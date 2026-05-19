-- ZealHub database schema
-- Run this in the Supabase SQL Editor after creating your project.

-- Tasks
create table if not exists tasks (
  id          text        primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  title       text        not null default '',
  description text        not null default '',
  status      text        not null default 'todo',
  priority    text        not null default 'medium',
  date        text,
  project_id  text,
  tags        text[]      not null default '{}',
  sort_order  bigint      not null default 0,
  created_at  timestamptz not null,
  updated_at  timestamptz not null
);

alter table tasks enable row level security;

create policy "users can manage own tasks" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Projects
create table if not exists projects (
  id           text        primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  name         text        not null default '',
  start_date   text        not null default '',
  end_date     text,
  team_members text[]      not null default '{}',
  notes        text        not null default '',
  color        text        not null default '',
  archived     boolean     not null default false,
  created_at   timestamptz not null,
  updated_at   timestamptz not null
);

alter table projects enable row level security;

create policy "users can manage own projects" on projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notes (keyed by user + date)
create table if not exists notes (
  user_id uuid references auth.users(id) on delete cascade not null,
  date    text not null,
  text    text not null default '',
  primary key (user_id, date)
);

alter table notes enable row level security;

create policy "users can manage own notes" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
