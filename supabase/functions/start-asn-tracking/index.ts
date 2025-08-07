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
        Insert: {
          user_id: string;
          asn_number: number;
          status?: string;
          current_step?: string;
          progress?: number;
          total_cidrs?: number;
          total_ips?: number;
          total_domains?: number;
          error_message?: string | null;
        };
        Update: {
          status?: string;
          current_step?: string;
          progress?: number;
          total_cidrs?: number;
          total_ips?: number;
          total_domains?: number;
          error_message?: string | null;
        };
      };
      asn_info: {
        Row: {
          id: string;
          asn_number: number;
          organization_name: string | null;
          country_code: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          asn_number: number;
          organization_name?: string | null;
          country_code?: string | null;
          description?: string | null;
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

    const { asn_number } = await req.json();

    if (!asn_number || typeof asn_number !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Valid ASN number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, work without authentication since tables are public
    const userId = 'anonymous';

    // Check if ASN info exists, if not fetch it from external API
    let { data: asnInfo } = await supabase
      .from('asn_info')
      .select('*')
      .eq('asn_number', asn_number)
      .single();

    if (!asnInfo) {
      // Fetch ASN info from external API (mock for now)
      console.log(`Fetching ASN info for AS${asn_number}`);
      
      const mockAsnInfo = {
        asn_number,
        organization: `Organization for AS${asn_number}`,
        country: 'US'
      };

      const { data: insertedAsn, error: insertError } = await supabase
        .from('asn_info')
        .insert(mockAsnInfo)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting ASN info:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to store ASN information' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      asnInfo = insertedAsn;
    }

    // Create tracking job
    const { data: job, error: jobError } = await supabase
      .from('tracking_jobs')
      .insert({
        asn_number,
        status: 'pending',
        current_step: 0,
        progress_data: { current_step_name: 'asn_lookup' }
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating tracking job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Failed to create tracking job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start background processing
    EdgeRuntime.waitUntil(processAsnTracking(job.id, asn_number));

    return new Response(
      JSON.stringify({ 
        job_id: job.id,
        status: 'started',
        asn_info: asnInfo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in start-asn-tracking:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processAsnTracking(jobId: string, asnNumber: number) {
  const supabase = createClient<Database>(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Update status to running
    await supabase
      .from('tracking_jobs')
      .update({ 
        status: 'running', 
        current_step: 1, 
        progress_data: { current_step_name: 'cidr_discovery', progress: 20 }
      })
      .eq('id', jobId);

    // Mock CIDR discovery - in real implementation, you'd query BGP data
    const mockCidrs = [
      `192.168.${asnNumber % 256}.0/24`,
      `10.${asnNumber % 256}.0.0/16`,
      `172.16.${asnNumber % 256}.0/24`
    ];

    // Insert CIDR ranges
    const { data: asnInfo } = await supabase
      .from('asn_info')
      .select('id')
      .eq('asn_number', asnNumber)
      .single();

    if (asnInfo) {
      for (const cidr of mockCidrs) {
        await supabase
          .from('cidr_ranges')
          .insert({
            asn_id: asnInfo.id,
            cidr_range: cidr
          });
      }
    }

    // Update progress
    await supabase
      .from('tracking_jobs')
      .update({ 
        current_step: 2,
        progress_data: { 
          current_step_name: 'ip_discovery', 
          progress: 50, 
          total_cidrs: mockCidrs.length 
        }
      })
      .eq('id', jobId);

    // Simulate IP discovery delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update to completed
    await supabase
      .from('tracking_jobs')
      .update({ 
        status: 'completed',
        current_step: 4,
        progress_data: {
          current_step_name: 'completed',
          progress: 100,
          total_ips: mockCidrs.length * 10,
          total_domains: mockCidrs.length * 5
        }
      })
      .eq('id', jobId);

    console.log(`ASN tracking completed for job ${jobId}`);

  } catch (error) {
    console.error(`Error processing ASN tracking for job ${jobId}:`, error);
    await supabase
      .from('tracking_jobs')
      .update({ 
        status: 'failed', 
        error_message: error.message 
      })
      .eq('id', jobId);
  }
}