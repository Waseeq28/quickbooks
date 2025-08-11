-- Core schema for teams, team_members, and profiles
-- Creates enum, tables, and helpful indexes (no RLS/policies in this file)

-- Ensure required extension for UUID generation
create extension if not exists pgcrypto;

-- Role enum for team membership
do $$ begin
  create type team_role as enum ('admin', 'accountant', 'viewer');
exception when duplicate_object then null; end $$;

-- Teams table
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Team members table
create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role team_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- Profiles table (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  current_team_id uuid references public.teams(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists team_members_user_idx on public.team_members(user_id);
create index if not exists team_members_team_idx on public.team_members(team_id);
create index if not exists profiles_current_team_idx on public.profiles(current_team_id);


