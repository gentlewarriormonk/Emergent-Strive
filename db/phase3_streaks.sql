-- Phase 3: Streaks Table for Scheduled Recomputation
-- This table stores precomputed streak data updated nightly

create table if not exists public.streaks (
  user_id uuid not null,
  class_id uuid not null,
  habit_id uuid references public.habits(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_completed_date date,
  updated_at timestamptz default now(),
  primary key (user_id, class_id, habit_id)
);

-- Add RLS policies for streaks table
alter table public.streaks enable row level security;

-- Users can see their own streaks
create policy "streaks owner read"
  on public.streaks for select
  using (user_id = auth.uid());

-- Staff can read all streaks in their school
create policy "streaks read by staff"
  on public.streaks for select
  using (
    exists (
      select 1 from public.habits h
      join public.memberships m on m.school_id = h.school_id
      where h.id = streaks.habit_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'teacher')
    )
  );

-- Only the system (service role) can insert/update streaks
create policy "streaks system update"
  on public.streaks for all
  using (false)
  with check (false);

-- Indexes for performance
create index idx_streaks_user_class on public.streaks(user_id, class_id);
create index idx_streaks_class on public.streaks(class_id);
create index idx_streaks_updated on public.streaks(updated_at);

-- Grant permissions
grant select on public.streaks to authenticated;
grant all on public.streaks to service_role;

-- Function to recompute streaks for all users
create or replace function public.recompute_all_streaks()
returns void
language plpgsql
security definer
as $$
declare
  habit_record record;
  log_record record;
  current_streak integer;
  longest_streak integer;
  last_completed date;
  streak_count integer;
begin
  -- Clear existing streaks
  delete from public.streaks;
  
  -- Loop through all habits
  for habit_record in 
    select h.id as habit_id, h.user_id, h.class_id, h.start_date
    from public.habits h
  loop
    current_streak := 0;
    longest_streak := 0;
    last_completed := null;
    streak_count := 0;
    
    -- Calculate current streak (from today backwards)
    for i in 0..365 loop
      select completed into log_record
      from public.habit_logs 
      where habit_id = habit_record.habit_id 
        and occurred_on = current_date - interval '1 day' * i
      limit 1;
      
      if found and log_record.completed then
        current_streak := current_streak + 1;
        if last_completed is null then
          last_completed := current_date - interval '1 day' * i;
        end if;
      else
        exit; -- Break streak
      end if;
    end loop;
    
    -- Calculate longest streak ever
    streak_count := 0;
    for log_record in
      select completed, occurred_on
      from public.habit_logs
      where habit_id = habit_record.habit_id
      order by occurred_on
    loop
      if log_record.completed then
        streak_count := streak_count + 1;
        longest_streak := greatest(longest_streak, streak_count);
      else
        streak_count := 0;
      end if;
    end loop;
    
    -- Insert/update streak record
    insert into public.streaks (user_id, class_id, habit_id, current_streak, longest_streak, last_completed_date)
    values (habit_record.user_id, habit_record.class_id, habit_record.habit_id, current_streak, longest_streak, last_completed)
    on conflict (user_id, class_id, habit_id) 
    do update set 
      current_streak = excluded.current_streak,
      longest_streak = excluded.longest_streak,
      last_completed_date = excluded.last_completed_date,
      updated_at = now();
      
  end loop;
  
  raise notice 'Streaks recomputation completed for % habits', (select count(*) from public.habits);
end;
$$;