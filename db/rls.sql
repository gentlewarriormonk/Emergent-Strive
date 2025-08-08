-- Row Level Security Policies for Strive App
-- Ensures secure multi-tenant data access

-- Enable RLS on all tables
alter table public.schools enable row level security;
alter table public.classes enable row level security;
alter table public.memberships enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

-- Helper function to check if user is member of a school
create or replace function public.user_in_school(s uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.school_id = s
  );
$$;

-- Helper function to check if user has specific role in school
create or replace function public.user_has_role_in_school(s uuid, required_role text) returns boolean
language sql stable as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() 
      and m.school_id = s 
      and m.role = required_role
  );
$$;

-- Helper function to check if user is staff (admin or teacher) in school
create or replace function public.user_is_staff_in_school(s uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() 
      and m.school_id = s 
      and m.role in ('admin', 'teacher')
  );
$$;

-- SCHOOLS POLICIES
-- Users can see schools they are members of
create policy "schools readable to members"
  on public.schools for select
  using ( public.user_in_school(id) );

-- Only admins can create schools (handled in backend)
create policy "schools insertable by admins"
  on public.schools for insert
  with check ( false ); -- Handled via service role in backend

-- Only admins can update/delete schools
create policy "schools updatable by admins"
  on public.schools for update
  using ( public.user_has_role_in_school(id, 'admin') );

create policy "schools deletable by admins"
  on public.schools for delete
  using ( public.user_has_role_in_school(id, 'admin') );

-- CLASSES POLICIES
-- Classes are visible to school members
create policy "classes readable to school members"
  on public.classes for select
  using ( public.user_in_school(school_id) );

-- Only admins and teachers can create classes
create policy "classes insertable by staff"
  on public.classes for insert
  with check ( public.user_is_staff_in_school(school_id) );

-- Only admins and teachers can update classes (for invite codes)
create policy "classes updatable by staff"
  on public.classes for update
  using ( public.user_is_staff_in_school(school_id) );

-- Only admins can delete classes
create policy "classes deletable by admins"
  on public.classes for delete
  using ( public.user_has_role_in_school(school_id, 'admin') );

-- MEMBERSHIPS POLICIES
-- Users can see their own membership or same-school if they are staff
create policy "memberships select own or same school staff"
  on public.memberships for select
  using (
    user_id = auth.uid()
    or public.user_is_staff_in_school(school_id)
  );

-- Users can insert their own memberships (via invite system)
create policy "memberships insertable own"
  on public.memberships for insert
  with check ( user_id = auth.uid() );

-- Only staff can update memberships (role changes)
create policy "memberships updatable by staff"
  on public.memberships for update
  using ( public.user_is_staff_in_school(school_id) );

-- Only admins can delete memberships
create policy "memberships deletable by admins"
  on public.memberships for delete
  using ( public.user_has_role_in_school(school_id, 'admin') );

-- HABITS POLICIES
-- Users can manage their own habits
create policy "habits owner crud"
  on public.habits for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.user_in_school(school_id));

-- Staff can read all habits in their school
create policy "habits read by staff"
  on public.habits for select
  using ( public.user_is_staff_in_school(school_id) );

-- HABIT_LOGS POLICIES
-- Users can manage their own habit logs
create policy "habit_logs owner crud"
  on public.habit_logs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Staff can read habit logs in their school
create policy "habit_logs read by staff"
  on public.habit_logs for select
  using (
    exists (
      select 1 from public.habits h
      where h.id = habit_logs.habit_id
        and public.user_is_staff_in_school(h.school_id)
    )
  );

-- Grant necessary permissions to authenticated users
grant select, insert, update, delete on public.schools to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
grant select, insert, update, delete on public.habits to authenticated;
grant select, insert, update, delete on public.habit_logs to authenticated;

-- Grant usage on sequences
grant usage on all sequences in schema public to authenticated;