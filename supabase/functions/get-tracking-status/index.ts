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

    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, work without authentication since tables are public
    // In production, you'd want proper authentication

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('tracking_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get CIDR ranges for this job by ASN
    const { data: asnInfo } = await supabase
      .from('asn_info')
      .select('id')
      .eq('asn_number', job.asn_number)
      .single();

    let cidrs = [];
    if (asnInfo) {
      const { data: cidrData } = await supabase
        .from('cidr_ranges')
        .select('*')
        .eq('asn_id', asnInfo.id);
      cidrs = cidrData || [];
    }

    // Get discovered IPs (limited to first 100 for performance)
    const { data: ips } = await supabase
      .from('discovered_ips')
      .select('*')
      .eq('job_id', job_id)
      .limit(100);

    // Get resolved domains (limited to first 100 for performance)
    const { data: domains } = await supabase
      .from('resolved_domains')
      .select('*')
      .eq('job_id', job_id)
      .limit(100);

    const response = {
      job,
      cidr_ranges: cidrs,
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