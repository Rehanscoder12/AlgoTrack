create table if not exists public.dsa_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text not null default '' check (char_length(description) <= 2000),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.dsa_section_topics (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.dsa_sections(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text not null default '' check (char_length(description) <= 2000),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (section_id, title)
);

create table if not exists public.dsa_topic_questions (
  topic_id uuid not null references public.dsa_section_topics(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  primary key (topic_id, question_id)
);

create index if not exists dsa_sections_display_order_idx
  on public.dsa_sections (display_order, created_at);
create index if not exists dsa_section_topics_section_order_idx
  on public.dsa_section_topics (section_id, display_order, created_at);
create index if not exists dsa_topic_questions_question_idx
  on public.dsa_topic_questions (question_id);
create index if not exists dsa_topic_questions_topic_order_idx
  on public.dsa_topic_questions (topic_id, display_order, created_at);

alter table public.dsa_sections enable row level security;
alter table public.dsa_section_topics enable row level security;
alter table public.dsa_topic_questions enable row level security;

drop policy if exists "Public can read DSA sections" on public.dsa_sections;
create policy "Public can read DSA sections" on public.dsa_sections
  for select to anon, authenticated using (true);

drop policy if exists "Public can read DSA section topics" on public.dsa_section_topics;
create policy "Public can read DSA section topics" on public.dsa_section_topics
  for select to anon, authenticated using (true);

drop policy if exists "Public can read DSA topic questions" on public.dsa_topic_questions;
create policy "Public can read DSA topic questions" on public.dsa_topic_questions
  for select to anon, authenticated using (true);

revoke all on public.dsa_sections from anon, authenticated;
revoke all on public.dsa_section_topics from anon, authenticated;
revoke all on public.dsa_topic_questions from anon, authenticated;
grant select on public.dsa_sections to anon, authenticated;
grant select on public.dsa_section_topics to anon, authenticated;
grant select on public.dsa_topic_questions to anon, authenticated;
grant all on public.dsa_sections to service_role;
grant all on public.dsa_section_topics to service_role;
grant all on public.dsa_topic_questions to service_role;
