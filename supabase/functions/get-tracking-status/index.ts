import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      tracking_jobs: {
        Row: {
          id: string;
          user_id: string;
          asn_number: number;
          status: string;
          current_step: string;
          progress: number;
          total_cidrs: number;
          total_ips: number;
          total_domains: number;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      discovered_ips: {
        Row: {
          id: string;
          job_id: string;
          cidr_id: string;
          ip_address: string;
          is_active: boolean;
          last_ping_at: string | null;
          created_at: string;
        };
      };
      resolved_domains: {
        Row: {
          id: string;
          job_id: string;
          ip_id: string;
          domain_name: string;
          resolution_type: string;
          created_at: string;
        };
      };
      cidr_ranges: {
        Row: {
          id: string;
          asn_id: string;
          cidr_range: string;
          created_at: string;
        };
      };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const url = new URL(req.url);
    const jobId = url.searchParams.get('job_id');

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('tracking_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get CIDR ranges for this job
    const { data: cidrs } = await supabase
      .from('cidr_ranges')
      .select('*')
      .eq('asn_id', job.asn_number.toString());

    // Get discovered IPs (limited to first 100 for performance)
    const { data: ips } = await supabase
      .from('discovered_ips')
      .select('*')
      .eq('job_id', jobId)
      .limit(100);

    // Get resolved domains (limited to first 100 for performance)
    const { data: domains } = await supabase
      .from('resolved_domains')
      .select('*')
      .eq('job_id', jobId)
      .limit(100);

    const response = {
      job,
      cidr_ranges: cidrs || [],
      discovered_ips: ips || [],
      resolved_domains: domains || []
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-tracking-status:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});