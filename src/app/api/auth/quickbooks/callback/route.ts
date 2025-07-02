import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const realmId = searchParams.get('realmId')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const storedState = request.cookies.get('qb_oauth_state')?.value

    if (error) {
      console.error('OAuth error:', error)
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

    console.log('OAuth callback received:', { code: code.substring(0, 20) + '...', realmId })

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
      console.error('Token exchange failed:', errorText)
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokens = await tokenResponse.json()
    console.log('Tokens received successfully')

    // Display tokens for user to copy to .env.local
    const responseHtml = `
      <html>
        <head>
          <title>QuickBooks Connected Successfully!</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .success { color: green; }
            .code-block { 
              background: #f5f5f5; 
              padding: 15px; 
              border-radius: 5px; 
              font-family: monospace;
              white-space: pre-wrap;
              margin: 20px 0;
            }
            .copy-btn {
              background: #007cba;
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <h1 class="success">✅ QuickBooks Connected Successfully!</h1>
          
          <h3>📋 Copy these credentials to your .env.local file:</h3>
          
          <div class="code-block" id="credentials">QB_ACCESS_TOKEN=${tokens.access_token}
QB_REFRESH_TOKEN=${tokens.refresh_token}
QB_REALM_ID=${realmId}</div>

          <button class="copy-btn" onclick="copyToClipboard()">📋 Copy Credentials</button>
          
          <h3>📝 Next Steps:</h3>
          <ol>
            <li>Copy the credentials above to your <code>.env.local</code> file</li>
            <li>Restart your development server: <code>npm run dev</code></li>
            <li>Test the connection: <a href="/api/quickbooks/test" target="_blank">Test QuickBooks API</a></li>
            <li><a href="/">Go back to your app</a></li>
          </ol>

          <script>
            function copyToClipboard() {
              const text = document.getElementById('credentials').textContent;
              navigator.clipboard.writeText(text).then(() => {
                alert('Credentials copied to clipboard!');
              });
            }
          </script>
        </body>
      </html>
    `
    const response = new NextResponse(responseHtml, { 
      headers: { 'Content-Type': 'text/html' }
    })

    response.cookies.set('qb_oauth_state', '', { maxAge: -1 })

    return response

  } catch (error: any) {
    console.error('OAuth callback error:', error)
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