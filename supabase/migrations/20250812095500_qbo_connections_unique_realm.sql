-- Enforce that each QuickBooks company (realm_id) can be linked to at most one team

-- Add a unique index on realm_id
create unique index if not exists qbo_conns_unique_realm on public.quickbooks_connections(realm_id);


