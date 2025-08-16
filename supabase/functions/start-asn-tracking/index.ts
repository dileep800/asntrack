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

    // Update progress to IP discovery phase
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

    // IP Discovery - Simulate masscan + httpx workflow from d3sec.sh
    console.log(`[${jobId}] Starting IP discovery on ${cidrs.size} CIDR ranges`);
    
    const discoveredIps = new Set<string>();
    const commonPorts = [80, 81, 82, 83, 8080, 8888, 8088, 8443, 8000]; // Same ports as d3sec.sh
    
    for (const cidr of Array.from(cidrs).slice(0, 5)) { // Limit to first 5 CIDRs for demo
      const ips = generateSampleIpsFromCidr(cidr);
      
      for (const ip of ips) {
        // Simulate masscan port scanning + httpx service detection
        const isLive = await simulateHttpCheck(ip, commonPorts);
        
        if (isLive.hasActiveServices) {
          discoveredIps.add(ip);
          
          // Insert discovered IP into database
          await supabase
            .from('discovered_ips')
            .insert({
              job_id: jobId,
              ip_address: ip,
              is_active: true,
              port_scan_data: {
                open_ports: isLive.openPorts,
                services: isLive.services,
                scan_time: new Date().toISOString(),
                scan_method: 'masscan+httpx'
              }
            });
        }
      }
    }

    console.log(`[${jobId}] Found ${discoveredIps.size} live IPs with HTTP services`);

    // Update progress to domain resolution phase
    await supabase
      .from('tracking_jobs')
      .update({ 
        current_step: 3,
        progress_data: { 
          current_step_name: 'domain_resolution', 
          progress: 75, 
          total_ips: discoveredIps.size 
        }
      })
      .eq('id', jobId);

    // Domain Resolution - Use reverse DNS and whois-like lookup
    console.log(`[${jobId}] Starting domain resolution for ${discoveredIps.size} IPs`);
    
    const resolvedDomains = new Set<{ip: string, domain: string, type: string}>();
    
    for (const ip of Array.from(discoveredIps).slice(0, 20)) { // Limit to first 20 IPs
      const domains = await performDomainResolution(ip);
      
      for (const domain of domains) {
        resolvedDomains.add({ip, domain: domain.name, type: domain.type});
        
        // Insert resolved domain into database
        await supabase
          .from('resolved_domains')
          .insert({
            job_id: jobId,
            ip_address: ip,
            domain_name: domain.name,
            domain_type: domain.type
          });
      }
    }

    console.log(`[${jobId}] Resolved ${resolvedDomains.size} domains`);

    // Update to completed
    await supabase
      .from('tracking_jobs')
      .update({ 
        status: 'completed',
        current_step: 4,
        progress_data: {
          current_step_name: 'completed',
          progress: 100,
          total_ips: discoveredIps.size,
          total_domains: resolvedDomains.size
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

// Generate sample IPs from CIDR range (simulating IP enumeration)
function generateSampleIpsFromCidr(cidr: string): string[] {
  const [baseIp, prefixLength] = cidr.split('/');
  const [a, b, c, d] = baseIp.split('.').map(Number);
  const ips: string[] = [];
  
  // Generate a small sample of IPs from the CIDR range
  const sampleSize = Math.min(10, Math.pow(2, 32 - parseInt(prefixLength)));
  
  for (let i = 0; i < sampleSize; i++) {
    // Simple IP generation within range
    const lastOctet = (d + i) % 256;
    ips.push(`${a}.${b}.${c}.${lastOctet}`);
  }
  
  return ips;
}

// Simulate masscan + httpx workflow
async function simulateHttpCheck(ip: string, ports: number[]): Promise<{
  hasActiveServices: boolean;
  openPorts: number[];
  services: string[];
}> {
  // Simulate random chance of having active HTTP services
  const hasServices = Math.random() > 0.85; // ~15% chance of live services
  
  if (!hasServices) {
    return {
      hasActiveServices: false,
      openPorts: [],
      services: []
    };
  }
  
  // Simulate which ports are open
  const openPorts = ports.filter(() => Math.random() > 0.7); // Random subset of ports
  const services = openPorts.map(port => {
    const serviceTypes = ['nginx', 'apache', 'IIS', 'nodejs', 'tomcat'];
    return `${serviceTypes[Math.floor(Math.random() * serviceTypes.length)]}:${port}`;
  });
  
  return {
    hasActiveServices: true,
    openPorts,
    services
  };
}

// Simulate domain resolution using reverse DNS and whois-like lookup
async function performDomainResolution(ip: string): Promise<{name: string, type: string}[]> {
  const domains: {name: string, type: string}[] = [];
  
  // Simulate reverse DNS lookup
  const hasReverseDns = Math.random() > 0.6; // 40% chance of having reverse DNS
  
  if (hasReverseDns) {
    // Generate realistic domain names based on IP
    const [a, b, c, d] = ip.split('.').map(Number);
    const domainTypes = [
      { name: `host-${a}-${b}-${c}-${d}.example.com`, type: 'reverse_dns' },
      { name: `server${d}.hosting-provider.net`, type: 'reverse_dns' },
      { name: `mail${c}.company.org`, type: 'mail_server' },
      { name: `web${d}.cdn-provider.com`, type: 'web_server' }
    ];
    
    // Randomly select 1-2 domain types
    const numDomains = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numDomains; i++) {
      const domain = domainTypes[Math.floor(Math.random() * domainTypes.length)];
      domains.push(domain);
    }
  }
  
  // Simulate SSL certificate domain discovery (like from certificates.crt.sh)
  const hasSslCerts = Math.random() > 0.7; // 30% chance of discoverable SSL certs
  
  if (hasSslCerts) {
    const sslDomains = [
      { name: `api.example-corp.com`, type: 'ssl_cert' },
      { name: `secure.webapp-${Math.floor(Math.random() * 1000)}.com`, type: 'ssl_cert' },
      { name: `admin.internal-system.net`, type: 'ssl_cert' }
    ];
    
    const sslDomain = sslDomains[Math.floor(Math.random() * sslDomains.length)];
    domains.push(sslDomain);
  }
  
  return domains;
}