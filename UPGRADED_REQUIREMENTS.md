# Upgrading Your Invoice Management Tool: Part 2

## Overview

This document provides instructions for upgrading the existing invoice management tool from Part 1. We will replace the simple, single-user setup with a robust, multi-tenant architecture by integrating Supabase Auth and introducing Team Collaboration with role-based access control (RBAC).

## Enhanced Architecture: From Scaffold to Production

The application will be upgraded to support individual user accounts and collaborative team workspaces, integrating Supabase as a central component while preserving your existing Vercel AI SDK and React foundation.

### Existing Scaffold (Preserved)
- Vercel AI SDK core
- QuickBooks integration logic  
- React dual-panel UI

### New Supabase Integration
- **Authentication**: User sign-up, login, and session handling
- **Database**: User profiles, team information, member roles, encrypted QuickBooks tokens
- **Row-Level Security (RLS)**: Strict data access policies ensuring team data isolation

## 1. Integrating Supabase Authentication and Authorization

### User Authentication Flow
- **Sign-up/Login**: Email/password or social providers (Google, GitHub)
- **Session Management**: JWT tokens for user identification and authorization
- **Secure QuickBooks OAuth**: Tokens encrypted and stored per user in Supabase

### Database Schema for Auth and Tokens

#### `profiles` Table
```sql
id (uuid, Foreign Key to auth.users.id)
full_name (text)
avatar_url (text)
```

#### `quickbooks_tokens` Table
```sql
user_id (uuid, Foreign Key to profiles.id)
encrypted_access_token (text)
encrypted_refresh_token (text)
realm_id (text, QuickBooks Company ID)
expires_at (timestampz)
```

## 2. Feature Spotlight: Team Collaboration & RBAC

### Functionality
- **Team Creation**: Users can create workspaces/teams (creator becomes Admin)
- **Invitations**: Admins can invite members via email
- **Role Management**: Three distinct roles with different permissions

### Role Definitions
- **Admin**: Full access to team management, billing, and all invoice operations
- **Accountant**: CRUD operations on invoices, no team management access
- **Viewer**: Read-only access to invoices, no write operations

### Database Schema for Teams and RBAC

#### `teams` Table
```sql
id (uuid, Primary Key)
team_name (text)
owner_id (uuid, Foreign Key to profiles.id)
```

#### `team_members` Table (Pivot)
```sql
team_id (uuid, Foreign Key to teams.id)
user_id (uuid, Foreign Key to profiles.id)
role (text: 'admin', 'accountant', 'viewer')
```

## 3. Adapting AI Tools for Multi-Tenancy

The Vercel AI SDK tools must be updated to be "team-aware" with authorization checks:

```typescript
const invoiceTools = {
  getInvoice: tool({
    description: 'Get details of a specific invoice by ID for the current team.',
    parameters: z.object({
      invoiceId: z.string().describe('The ID of the invoice to retrieve'),
      teamId: z.string().describe('The ID of the team this invoice belongs to'),
    }),
    execute: async ({ invoiceId, teamId }) => {
      const userId = getCurrentUserId();
      
      // 1. Authorization Check
      const hasPermission = await checkUserRole(userId, teamId, ['admin', 'accountant', 'viewer']);
      if (!hasPermission) {
        throw new Error('You do not have permission to view invoices for this team.');
      }
      
      // 2. Retrieve team-specific QuickBooks tokens
      const qbo = await getQuickBooksClientForTeam(teamId);
      
      // 3. Execute QuickBooks API call
      return await qbo.getInvoice(invoiceId);
    }),
  }),
};
```
