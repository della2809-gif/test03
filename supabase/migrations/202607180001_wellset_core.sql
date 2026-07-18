-- WELLSET Phase 0 core schema.
-- Additive migration only: no existing object is deleted or replaced.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  birth_year integer check (birth_year between 1900 and 2100),
  sex text,
  height_cm numeric check (height_cm > 0),
  weight_kg numeric check (weight_kg > 0),
  timezone text not null default 'Asia/Seoul',
  locale text not null default 'ko-KR',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  consent_version text not null,
  is_granted boolean not null,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, consent_type, consent_version)
);

create table if not exists public.health_asset_domains (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  short_description text not null,
  long_description text not null,
  icon text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.health_asset_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_date date not null,
  total_score numeric not null check (total_score between 0 and 100),
  data_confidence numeric not null check (data_confidence between 0 and 100),
  score_version text not null,
  source_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists health_asset_scores_user_date_idx
  on public.health_asset_scores (user_id, assessment_date desc);

create table if not exists public.health_asset_score_details (
  id uuid primary key default gen_random_uuid(),
  health_asset_score_id uuid not null references public.health_asset_scores(id) on delete cascade,
  domain_id uuid not null references public.health_asset_domains(id),
  score numeric not null check (score between 0 and 100),
  status text not null,
  explanation text,
  evidence jsonb not null default '[]'::jsonb,
  recommended_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (health_asset_score_id, domain_id)
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  completion_rate numeric not null default 0 check (completion_rate between 0 and 100),
  daily_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists daily_logs_user_date_idx
  on public.daily_logs (user_id, log_date desc);

create table if not exists public.stack_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  source_type text not null,
  source_id uuid,
  points integer not null check (points > 0),
  event_date date not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists stack_events_user_date_idx
  on public.stack_events (user_id, event_date desc);

create table if not exists public.daily_stack_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stack_date date not null,
  total_stack integer not null default 0 check (total_stack >= 0),
  event_count integer not null default 0 check (event_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, stack_date)
);

alter table public.profiles enable row level security;
alter table public.user_consents enable row level security;
alter table public.health_asset_domains enable row level security;
alter table public.health_asset_scores enable row level security;
alter table public.health_asset_score_details enable row level security;
alter table public.daily_logs enable row level security;
alter table public.stack_events enable row level security;
alter table public.daily_stack_summaries enable row level security;

create policy "profiles_own_rows" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "consents_own_rows" on public.user_consents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "domains_authenticated_read" on public.health_asset_domains
  for select to authenticated using (true);
create policy "scores_own_rows" on public.health_asset_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "score_details_own_rows" on public.health_asset_score_details
  for all using (
    exists (
      select 1 from public.health_asset_scores scores
      where scores.id = health_asset_score_id and scores.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.health_asset_scores scores
      where scores.id = health_asset_score_id and scores.user_id = auth.uid()
    )
  );
create policy "daily_logs_own_rows" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stack_events_own_rows" on public.stack_events
  for select using (auth.uid() = user_id);
create policy "stack_summaries_own_rows" on public.daily_stack_summaries
  for select using (auth.uid() = user_id);

-- stack_events and daily_stack_summaries intentionally have no client INSERT,
-- UPDATE, or DELETE policies. They must be calculated by trusted server code.
