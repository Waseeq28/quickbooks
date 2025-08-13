import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { DatabaseService } from '@/lib/database'
import { getServerAuthzContext } from '@/utils/authz-server'

export async function GET(request: NextRequest) {
  try {
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
        <html><body><h1>QuickBooks Connection Failed</h1><p>Error: ${error}</p><p><a href="/">Go back to app</a></p></body></html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    if (state !== storedState) {
      return new Response(`
        <html><body><h1>Invalid State / CSRF Detected</h1><p>The state parameter doesn't match. Please try connecting again.</p><p><a href="/">Go back</a></p></body></html>
      `, { headers: { 'Content-Type': 'text/html' }, status: 400 })
    }

    if (!code || !realmId) {
      return new Response(`
        <html><body><h1>Invalid OAuth Response</h1><p>Missing authorization code or company ID</p><p><a href="/">Go back to app</a></p></body></html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/quickbooks/callback`
      })
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokens = await tokenResponse.json()

    try {
      const { teamId, role } = await getServerAuthzContext()
      if (role !== 'admin') {
        const url = new URL('/error', request.url)
        const response = NextResponse.redirect(url)
        response.cookies.set('app_err_title', 'Forbidden', { path: '/' })
        response.cookies.set('app_err_message', 'Only team admins can connect QuickBooks.', { path: '/' })
        response.cookies.set('app_err_back', '/', { path: '/' })
        return response
      }
      await DatabaseService.saveQuickBooksConnectionForTeam(
        teamId,
        tokens.access_token,
        tokens.refresh_token,
        realmId!,
        tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined
      )

      const responseHtml = `
        <html><head><title>QuickBooks Connected Successfully!</title></head>
        <body><h1>✅ QuickBooks Connected Successfully!</h1>
        <p>Your QuickBooks account has been securely connected and linked to your team.</p>
        <p><a href="/">Go to Dashboard</a></p></body></html>`
      const response = new NextResponse(responseHtml, { headers: { 'Content-Type': 'text/html' } })
      response.cookies.set('qb_oauth_state', '', { maxAge: -1 })
      return response
    } catch (dbError: any) {
      const message = (dbError?.message || '').toLowerCase()
      const isUniqueRealm = message.includes('duplicate key value') || message.includes('qbo_conns_unique_realm')
      const isAppGuard = (dbError as any)?.code === 'REALM_ALREADY_LINKED'
      const friendly = isUniqueRealm
        ? 'This QuickBooks company is already linked to another team. Please switch to that team or choose a different company.'
        : isAppGuard
        ? 'This QuickBooks company is already linked to another team. Please switch teams or connect a different company.'
        : `QuickBooks connection was successful, but we couldn't save your credentials.`
      const status = (isUniqueRealm || isAppGuard) ? 409 : 500
      return new Response(`<html><body><h1>Connection Stored Failed</h1><p>${friendly}</p><p>Error: ${dbError.message}</p><p><a href="/">Go back</a></p></body></html>`, { headers: { 'Content-Type': 'text/html' }, status })
    }
  } catch (error: any) {
    return new Response(`<html><body><h1>OAuth Callback Error</h1><p>Error: ${error.message}</p><p><a href="/">Go back to app</a></p></body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }
}



