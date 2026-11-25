create extension if not exists pgcrypto;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question_name text not null check (char_length(question_name) between 1 and 180),
  topic text not null check (topic in (
    'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'Binary Search',
    'Recursion', 'Backtracking', 'Trees', 'Binary Search Tree', 'Heap',
    'Graph', 'Dynamic Programming', 'Greedy', 'Sliding Window', 'Two Pointers',
    'Hashing', 'Bit Manipulation', 'Tries', 'Others'
  )),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  platform text not null check (platform in ('LeetCode', 'GeeksforGeeks', 'CodeStudio', 'HackerRank', 'Others')),
  problem_url text not null check (problem_url ~ '^https?://'),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  category text not null check (category in (
    'Operating System (OS)', 'Database Management System (DBMS)',
    'Computer Networks (CN)', 'Object Oriented Programming (OOP)', 'Aptitude',
    'Technical MCQs', 'System Design', 'Java', 'SQL', 'Other Technical Subjects'
  )),
  description text not null default '' check (char_length(description) <= 2000),
  resource_type text not null check (resource_type in ('PDF', 'Notes', 'Video', 'Website', 'Practice')),
  resource_url text not null check (resource_url ~ '^https?://'),
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;
alter table public.resources enable row level security;

drop policy if exists "Public can read questions" on public.questions;
create policy "Public can read questions" on public.questions
  for select to anon, authenticated using (true);

drop policy if exists "Public can read resources" on public.resources;
create policy "Public can read resources" on public.resources
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.questions from anon, authenticated;
revoke insert, update, delete on public.resources from anon, authenticated;
grant select on public.questions to anon, authenticated;
grant select on public.resources to anon, authenticated;
