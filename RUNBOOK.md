# Strive - Streaks Management Runbook

## Overview
This runbook covers the management of the automated nightly streak recomputation system implemented in Phase 3 of the Strive multi-school habit tracker.

## Architecture

### Streak Calculation System
- **Real-time**: Frontend displays optimistic streaks based on `habit_logs` during the day
- **Scheduled**: Nightly recomputation at 02:00 EU time stores authoritative streak data
- **Storage**: Precomputed streaks stored in `public.streaks` table
- **Security**: RLS policies ensure multi-tenant data isolation

### Components
1. **Database Function**: `public.recompute_all_streaks()` - PostgreSQL function for calculation
2. **Edge Function**: `/supabase/functions/recompute-streaks/` - Deno/TypeScript cron handler
3. **Cron Schedule**: Daily at 01:00 UTC (02:00 EU standard time)
4. **Manual Trigger**: Admin API endpoint for immediate recomputation

## Database Schema

### Streaks Table
```sql
create table public.streaks (
  user_id uuid not null,
  class_id uuid not null,
  habit_id uuid references public.habits(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_completed_date date,
  updated_at timestamptz default now(),
  primary key (user_id, class_id, habit_id)
);
```

### Key Functions
- **`recompute_all_streaks()`**: Recalculates all streaks from habit_logs data
- **RLS Policies**: Ensure users only see their own streaks, teachers see class streaks

## Operations

### 1. Manual Streak Recomputation

#### Via Admin Dashboard (Recommended)
1. Log in as admin user
2. Navigate to Admin panel
3. Click "Recompute Streaks" button
4. Confirm action
5. Wait for completion message

#### Via API Call
```bash
curl -X POST "https://your-backend-url/api/admin/recompute-streaks" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

#### Via Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Execute: `SELECT public.recompute_all_streaks();`
3. Check result: `SELECT COUNT(*) FROM public.streaks;`

#### Via Edge Function (Direct)
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/recompute-streaks" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

### 2. Monitoring Streak Recomputation

#### Check Last Run Status
```sql
SELECT 
  COUNT(*) as total_streaks,
  MAX(updated_at) as last_updated,
  COUNT(DISTINCT user_id) as users_with_streaks
FROM public.streaks;
```

#### View Streak Statistics
```sql
SELECT 
  class_id,
  COUNT(*) as habit_count,
  AVG(current_streak) as avg_current_streak,
  MAX(current_streak) as max_current_streak,
  AVG(longest_streak) as avg_longest_streak
FROM public.streaks
GROUP BY class_id;
```

#### Check Cron Job Status
1. Go to Supabase Dashboard → Edge Functions
2. Navigate to `recompute-streaks` function
3. Check "Logs" tab for execution history
4. Look for success/error messages

### 3. Troubleshooting

#### Common Issues

**Problem**: Streaks not updating after cron run
```sql
-- Check if function is actually running
SELECT public.recompute_all_streaks();

-- Verify data exists
SELECT COUNT(*) FROM public.habits;
SELECT COUNT(*) FROM public.habit_logs;
```

**Problem**: Edge function timing out
- Check Supabase function logs
- Reduce batch size in recomputation function
- Consider breaking into smaller chunks

**Problem**: RLS blocking streak access
```sql
-- Test RLS policies
SET ROLE authenticated;
SELECT * FROM public.streaks WHERE user_id = 'test-user-id';
```

**Problem**: Incorrect streak calculations
```sql
-- Debug specific habit streaks
SELECT 
  hl.occurred_on,
  hl.completed,
  s.current_streak,
  s.longest_streak
FROM public.habit_logs hl
JOIN public.streaks s ON s.habit_id = hl.habit_id
WHERE hl.habit_id = 'specific-habit-id'
ORDER BY hl.occurred_on DESC;
```

### 4. Schedule Management

#### Current Schedule
- **Time**: 01:00 UTC daily (02:00 EU standard time, 03:00 EU daylight time)
- **Cron**: `0 1 * * *`
- **Location**: `/supabase/functions/recompute-streaks/supabase.toml`

#### Changing the Schedule
1. Edit `/supabase/functions/recompute-streaks/supabase.toml`
2. Update cron schedule:
   ```toml
   [cron.recompute-streaks]
   schedule = "0 2 * * *"  # Change to 02:00 UTC
   ```
3. Deploy function: `supabase functions deploy recompute-streaks`
4. Verify in Supabase Dashboard → Edge Functions

#### Timezone Considerations
- **EU Standard Time**: UTC + 1 (winter)
- **EU Daylight Time**: UTC + 2 (summer)  
- **Current Setting**: 01:00 UTC ensures 02:00 minimum EU time
- **Alternative**: Use `0 2 * * *` for 02:00 UTC if later execution preferred

### 5. Performance Monitoring

#### Execution Metrics
```sql
-- Check streak table size
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename = 'streaks';
```

#### Query Performance
```sql
-- Monitor slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements 
WHERE query LIKE '%streaks%'
ORDER BY total_time DESC;
```

### 6. Data Backup & Recovery

#### Before Major Changes
```sql
-- Backup streaks table
CREATE TABLE streaks_backup AS SELECT * FROM public.streaks;
```

#### Recovery
```sql
-- Restore from backup
TRUNCATE public.streaks;
INSERT INTO public.streaks SELECT * FROM streaks_backup;
```

### 7. Scaling Considerations

#### For Large Datasets
- Consider partitioning `habit_logs` by date
- Implement incremental streak updates
- Add database indexes:
  ```sql
  CREATE INDEX idx_habit_logs_habit_date_completed 
  ON public.habit_logs(habit_id, occurred_on, completed);
  ```

#### Memory Optimization
- Process habits in batches of 1000
- Use temp tables for intermediate calculations
- Monitor Edge function memory usage

## Alerts & Notifications

### Set Up Monitoring
1. **Supabase Metrics**: Monitor function execution in dashboard
2. **Custom Alerts**: Set up webhook notifications for failed runs
3. **Data Quality**: Monitor streak calculation consistency

### Emergency Contacts
- **Backend Issues**: Check supervisor logs at `/var/log/supervisor/backend.*.log`
- **Database Issues**: Supabase Dashboard → Settings → Support
- **Function Issues**: Supabase Dashboard → Edge Functions → Logs

## Change Log
- **Phase 3**: Initial implementation with nightly cron
- **Future**: Planned incremental updates and performance optimizations

---

## Quick Reference

| Operation | Command |
|-----------|---------|
| Manual recompute | `SELECT public.recompute_all_streaks();` |
| Check last run | `SELECT MAX(updated_at) FROM public.streaks;` |
| View cron logs | Supabase Dashboard → Edge Functions → recompute-streaks → Logs |
| Deploy function | `supabase functions deploy recompute-streaks` |
| Test function | `curl -X POST https://project.supabase.co/functions/v1/recompute-streaks` |