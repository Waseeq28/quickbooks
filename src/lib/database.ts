import { createClient } from '@/utils/supabase/server'

export interface QuickBooksConnection {
  id: string
  team_id: string
  access_token: string
  refresh_token: string
  realm_id: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export class DatabaseService {
  
  // Remove user-scoped methods. From now on, connections are strictly team-scoped.

  // TEAM-SCOPED: Get QuickBooks connection for a given team.
  static async getQuickBooksConnectionForTeam(teamId: string): Promise<QuickBooksConnection | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quickbooks_connections')
      .select('*')
      .eq('team_id', teamId)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get QuickBooks connection for team: ${error.message}`)
    }
    return data
  }

  static async saveQuickBooksConnectionForTeam(
    teamId: string,
    accessToken: string,
    refreshToken: string,
    realmId: string,
    expiresAt?: Date
  ): Promise<QuickBooksConnection> {
    const supabase = await createClient()

    // Defensive check: prevent linking a realm to multiple teams at app level
    const { data: existingByRealm } = await supabase
      .from('quickbooks_connections')
      .select('team_id')
      .eq('realm_id', realmId)
      .maybeSingle()
    if (existingByRealm && existingByRealm.team_id !== teamId) {
      const err: any = new Error('This QuickBooks company is already linked to another team')
      err.code = 'REALM_ALREADY_LINKED'
      throw err
    }
    const connectionData = {
      team_id: teamId,
      access_token: accessToken,
      refresh_token: refreshToken,
      realm_id: realmId,
      expires_at: expiresAt?.toISOString(),
    }
    const { data, error } = await supabase
      .from('quickbooks_connections')
      .upsert(connectionData, { onConflict: 'team_id' })
      .select()
      .single()
    if (error) {
      throw new Error(`Failed to save QuickBooks connection for team: ${error.message}`)
    }
    return data
  }

  // Update QuickBooks tokens
  static async updateQuickBooksTokensForTeam(
    teamId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt?: Date
  ): Promise<QuickBooksConnection> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quickbooks_connections')
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt?.toISOString(),
      })
      .eq('team_id', teamId)
      .select()
      .single()
    if (error) {
      throw new Error(`Failed to update QuickBooks tokens for team: ${error.message}`)
    }
    return data
  }

  // Delete QuickBooks connection for a team
  static async deleteQuickBooksConnectionForTeam(teamId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('quickbooks_connections')
      .delete()
      .eq('team_id', teamId)
    if (error) {
      throw new Error(`Failed to delete QuickBooks connection for team: ${error.message}`)
    }
  }
}