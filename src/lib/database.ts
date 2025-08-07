import { createClient } from '@/utils/supabase/server'

export interface QuickBooksConnection {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  realm_id: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export class DatabaseService {
  
  // Get QuickBooks connection for authenticated user
  static async getQuickBooksConnection(): Promise<QuickBooksConnection | null> {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No connection found
        return null
      }
      throw new Error(`Failed to get QuickBooks connection: ${error.message}`)
    }

    return data
  }

  // Save or update QuickBooks connection for authenticated user
  static async saveQuickBooksConnection(
    accessToken: string,
    refreshToken: string,
    realmId: string,
    expiresAt?: Date
  ): Promise<QuickBooksConnection> {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const connectionData = {
      user_id: user.id,
      access_token: accessToken,
      refresh_token: refreshToken,
      realm_id: realmId,
      expires_at: expiresAt?.toISOString(),
    }

    // Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from('quickbooks_connections')
      .upsert(connectionData, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save QuickBooks connection: ${error.message}`)
    }

    return data
  }

  // Update QuickBooks tokens
  static async updateQuickBooksTokens(
    accessToken: string,
    refreshToken: string,
    expiresAt?: Date
  ): Promise<QuickBooksConnection> {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('quickbooks_connections')
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt?.toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update QuickBooks tokens: ${error.message}`)
    }

    return data
  }

  // Delete QuickBooks connection for authenticated user
  static async deleteQuickBooksConnection(): Promise<void> {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('quickbooks_connections')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`Failed to delete QuickBooks connection: ${error.message}`)
    }
  }
}