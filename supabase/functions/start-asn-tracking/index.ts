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

    // Real CIDR discovery using BGPView and RADB
    console.log(`[${jobId}] Starting CIDR discovery for AS${asnNumber}`);
    
    const cidrs = new Set<string>();
    
    // Fetch from BGPView API
    try {
      console.log(`[${jobId}] Fetching from BGPView...`);
      const bgpResponse = await fetch(`https://api.bgpview.io/asn/${asnNumber}/prefixes`);
      if (bgpResponse.ok) {
        const bgpData = await bgpResponse.json();
        if (bgpData.data && bgpData.data.ipv4_prefixes) {
          bgpData.data.ipv4_prefixes.forEach((prefix: any) => {
            if (prefix.prefix) {
              cidrs.add(prefix.prefix);
            }
          });
        }
      }
    } catch (error) {
      console.error(`[${jobId}] BGPView fetch error:`, error);
    }

    // Fetch from RADB WHOIS (via RIPE REST API as fallback)
    try {
      console.log(`[${jobId}] Fetching from RIPE database...`);
      const whoisResponse = await fetch(`https://rest.db.ripe.net/search.json?query-string=AS${asnNumber}&type-filter=route`);
      if (whoisResponse.ok) {
        const whoisData = await whoisResponse.json();
        if (whoisData.objects && whoisData.objects.object) {
          whoisData.objects.object.forEach((obj: any) => {
            if (obj.attributes && obj.attributes.attribute) {
              obj.attributes.attribute.forEach((attr: any) => {
                if (attr.name === 'route' && attr.value) {
                  cidrs.add(attr.value);
                }
              });
            }
          });
        }
      }
    } catch (error) {
      console.error(`[${jobId}] RIPE database fetch error:`, error);
    }

    console.log(`[${jobId}] Found ${cidrs.size} unique CIDRs`);

    // Get ASN info for foreign key
    const { data: asnInfo } = await supabase
      .from('asn_info')
      .select('id')
      .eq('asn_number', asnNumber)
      .single();

    // Insert CIDR ranges
    if (asnInfo && cidrs.size > 0) {
      for (const cidr of cidrs) {
        try {
          await supabase
            .from('cidr_ranges')
            .insert({
              asn_id: asnInfo.id,
              cidr_range: cidr,
              ip_count: calculateIpCount(cidr)
            });
        } catch (error) {
          console.error(`[${jobId}] Error inserting CIDR ${cidr}:`, error);
        }
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
          total_cidrs: cidrs.size 
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
          total_ips: cidrs.size * 100, // Estimate IPs per CIDR
          total_domains: cidrs.size * 10 // Estimate domains per CIDR
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

// Helper function to calculate IP count from CIDR
function calculateIpCount(cidr: string): number {
  const parts = cidr.split('/');
  if (parts.length !== 2) return 0;
  
  const prefixLength = parseInt(parts[1]);
  if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) return 0;
  
  return Math.pow(2, 32 - prefixLength);
}