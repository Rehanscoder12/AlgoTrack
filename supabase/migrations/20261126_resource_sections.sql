create table if not exists public.resource_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text not null default '' check (char_length(description) <= 2000),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.resource_section_topics (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.resource_sections(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text not null default '' check (char_length(description) <= 2000),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (section_id, title)
);

create table if not exists public.resource_topic_resources (
  topic_id uuid not null references public.resource_section_topics(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  primary key (topic_id, resource_id)
);

create index if not exists resource_sections_display_order_idx
  on public.resource_sections (display_order, created_at);
create index if not exists resource_section_topics_section_order_idx
  on public.resource_section_topics (section_id, display_order, created_at);
create index if not exists resource_topic_resources_resource_idx
  on public.resource_topic_resources (resource_id);
create index if not exists resource_topic_resources_topic_order_idx
  on public.resource_topic_resources (topic_id, display_order, created_at);

alter table public.resource_sections enable row level security;
alter table public.resource_section_topics enable row level security;
alter table public.resource_topic_resources enable row level security;

drop policy if exists "Public can read resource sections" on public.resource_sections;
create policy "Public can read resource sections" on public.resource_sections
  for select to anon, authenticated using (true);

drop policy if exists "Public can read resource section topics" on public.resource_section_topics;
create policy "Public can read resource section topics" on public.resource_section_topics
  for select to anon, authenticated using (true);

drop policy if exists "Public can read resource topic links" on public.resource_topic_resources;
create policy "Public can read resource topic links" on public.resource_topic_resources
  for select to anon, authenticated using (true);

revoke all on public.resource_sections from anon, authenticated;
revoke all on public.resource_section_topics from anon, authenticated;
revoke all on public.resource_topic_resources from anon, authenticated;
grant select on public.resource_sections to anon, authenticated;
grant select on public.resource_section_topics to anon, authenticated;
grant select on public.resource_topic_resources to anon, authenticated;
grant all on public.resource_sections to service_role;
grant all on public.resource_section_topics to service_role;
grant all on public.resource_topic_resources to service_role;
