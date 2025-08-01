import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { DatabaseService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new Response(`
        <html>
          <body>
            <h1>Authentication Required</h1>
            <p>Please sign in first before connecting to QuickBooks.</p>
            <p><a href="/login">Sign In</a></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' }, status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const realmId = searchParams.get('realmId')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const storedState = request.cookies.get('qb_oauth_state')?.value

    if (error) {
      return new Response(`
        <html>
          <body>
            <h1>QuickBooks Connection Failed</h1>
            <p>Error: ${error}</p>
            <p><a href="/">Go back to app</a></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    if (state !== storedState) {
      return new Response(`
        <html>
          <body>
            <h1>Invalid State / CSRF Detected</h1>
            <p>The state parameter doesn't match. Please try connecting again.</p>
            <p><a href="/connect">Go back</a></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' }, status: 400 })
    }

    if (!code || !realmId) {
      return new Response(`
        <html>
          <body>
            <h1>Invalid OAuth Response</h1>
            <p>Missing authorization code or company ID</p>
            <p><a href="/">Go back to app</a></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/quickbooks/callback`
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokens = await tokenResponse.json()

    // Save tokens to database
    let responseHtml: string
    try {
      await DatabaseService.saveQuickBooksConnection(
        tokens.access_token,
        tokens.refresh_token,
        realmId,
        tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined
      )

      // Success page
      responseHtml = `
        <html>
          <head>
            <title>QuickBooks Connected Successfully!</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
              .success { color: green; }
              .container { max-width: 600px; margin: 0 auto; }
              .btn {
                background: #007cba;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 5px;
                text-decoration: none;
                display: inline-block;
                margin: 10px;
                font-size: 16px;
              }
              .btn:hover { background: #005a8b; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="success">✅ QuickBooks Connected Successfully!</h1>
              
              <p>Your QuickBooks account has been securely connected and linked to your profile.</p>
              <p><strong>User:</strong> ${user.email}</p>
              <p><strong>Company ID:</strong> ${realmId}</p>
              
              <div style="margin: 30px 0;">
                <a href="/" class="btn">Go to Dashboard</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Your credentials are securely stored and encrypted. You can disconnect anytime from your dashboard.
              </p>
            </div>
          </body>
        </html>
      `
    } catch (dbError: any) {
      return new Response(`
        <html>
          <body>
            <h1>Connection Successful, but Storage Failed</h1>
            <p>QuickBooks connection was successful, but we couldn't save your credentials.</p>
            <p>Error: ${dbError.message}</p>
            <p><a href="/connect">Try Again</a></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' }, status: 500 })
    }
    const response = new NextResponse(responseHtml, { 
      headers: { 'Content-Type': 'text/html' }
    })

    response.cookies.set('qb_oauth_state', '', { maxAge: -1 })

    return response

  } catch (error: any) {
    return new Response(`
      <html>
        <body>
          <h1>OAuth Callback Error</h1>
          <p>Error: ${error.message}</p>
          <p><a href="/">Go back to app</a></p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }
}