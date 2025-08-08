// Supabase Edge Function for Nightly Streak Recomputation
// Scheduled to run daily at 02:00 EU time via Supabase cron

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StreedRecomputeResult {
  success: boolean;
  message: string;
  timestamp: string;
  habitsProcessed?: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Starting nightly streak recomputation...')

    // Execute the streak recomputation function
    const { data, error } = await supabaseAdmin
      .rpc('recompute_all_streaks')

    if (error) {
      console.error('❌ Error during streak recomputation:', error)
      
      const result: StreedRecomputeResult = {
        success: false,
        message: 'Streak recomputation failed',
        timestamp: new Date().toISOString(),
        error: error.message
      }
      
      return new Response(
        JSON.stringify(result),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get count of processed habits for reporting
    const { count: habitsCount } = await supabaseAdmin
      .from('habits')
      .select('*', { count: 'exact', head: true })

    console.log(`✅ Streak recomputation completed successfully. Processed ${habitsCount} habits.`)

    const result: StreedRecomputeResult = {
      success: true,
      message: 'Nightly streak recomputation completed successfully',
      timestamp: new Date().toISOString(),
      habitsProcessed: habitsCount || 0
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    
    const result: StreedRecomputeResult = {
      success: false,
      message: 'Unexpected error during streak recomputation',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})