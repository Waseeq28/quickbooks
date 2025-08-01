import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

export async function GET() {
  try {
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const clientId = process.env.QB_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: 'QB_CLIENT_ID not configured' }, { status: 500 })
    }

    const state = crypto.randomBytes(16).toString('hex')

    // QuickBooks OAuth 2.0 authorization URL
    const baseUrl = 'https://appcenter.intuit.com/connect/oauth2'

    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/quickbooks/callback`
    
    const authUrl = new URL(baseUrl)
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('scope', 'com.intuit.quickbooks.accounting')
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('state', state)

    const response = NextResponse.redirect(authUrl.toString())

    response.cookies.set('qb_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 15, // 15 minutes
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}