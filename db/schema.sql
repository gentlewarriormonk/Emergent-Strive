-- Strive App Database Schema for Supabase PostgreSQL
-- Multi-school, multi-class architecture with RLS

-- Schools table - top-level tenant isolation
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Classes table - belongs to a school
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  name text not null,
  invite_code text unique,
  created_at timestamptz default now()
);

-- Memberships table - users belong to schools and classes with roles
-- Primary key ensures one role per user per school/class combination
create table public.memberships (
  user_id uuid not null,
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  role text not null check (role in ('admin','teacher','student')),
  primary key (user_id, school_id, coalesce(class_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Habits table - user habits within school/class context
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  user_id uuid not null,
  title text not null,
  frequency text not null default 'daily',
  start_date date not null default current_date,
  created_at timestamptz default now()
);

-- Habit logs table - daily logging of habit completion
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null,
  occurred_on date not null,
  completed boolean not null default false,
  created_at timestamptz default now(),
  unique (habit_id, occurred_on)
);

-- Indexes for performance
create index idx_memberships_user_school on public.memberships(user_id, school_id);
create index idx_memberships_school_role on public.memberships(school_id, role);
create index idx_habits_user_school on public.habits(user_id, school_id);
create index idx_habits_class on public.habits(class_id);
create index idx_habit_logs_habit_date on public.habit_logs(habit_id, occurred_on);
create index idx_habit_logs_user_date on public.habit_logs(user_id, occurred_on);

-- Unique constraint for invite codes
create unique index idx_classes_invite_code on public.classes(invite_code) where invite_code is not null;