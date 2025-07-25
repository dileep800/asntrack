-- Create tables for ASN tracking functionality

-- Table to store ASN information
CREATE TABLE public.asn_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asn_number INTEGER NOT NULL UNIQUE,
  organization TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store CIDR ranges for ASNs
CREATE TABLE public.cidr_ranges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asn_id UUID NOT NULL REFERENCES public.asn_info(id) ON DELETE CASCADE,
  cidr_range CIDR NOT NULL,
  ip_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store tracking jobs
CREATE TABLE public.tracking_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asn_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 4,
  progress_data JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store discovered IP addresses
CREATE TABLE public.discovered_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.tracking_jobs(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  is_active BOOLEAN DEFAULT false,
  port_scan_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store resolved domains
CREATE TABLE public.resolved_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.tracking_jobs(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  domain_name TEXT NOT NULL,
  domain_type TEXT DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.asn_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cidr_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolved_domains ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public tool)
CREATE POLICY "ASN info is viewable by everyone" ON public.asn_info FOR SELECT USING (true);
CREATE POLICY "ASN info can be inserted by everyone" ON public.asn_info FOR INSERT WITH CHECK (true);

CREATE POLICY "CIDR ranges are viewable by everyone" ON public.cidr_ranges FOR SELECT USING (true);
CREATE POLICY "CIDR ranges can be inserted by everyone" ON public.cidr_ranges FOR INSERT WITH CHECK (true);

CREATE POLICY "Tracking jobs are viewable by everyone" ON public.tracking_jobs FOR SELECT USING (true);
CREATE POLICY "Tracking jobs can be inserted by everyone" ON public.tracking_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Tracking jobs can be updated by everyone" ON public.tracking_jobs FOR UPDATE USING (true);

CREATE POLICY "Discovered IPs are viewable by everyone" ON public.discovered_ips FOR SELECT USING (true);
CREATE POLICY "Discovered IPs can be inserted by everyone" ON public.discovered_ips FOR INSERT WITH CHECK (true);

CREATE POLICY "Resolved domains are viewable by everyone" ON public.resolved_domains FOR SELECT USING (true);
CREATE POLICY "Resolved domains can be inserted by everyone" ON public.resolved_domains FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_asn_info_number ON public.asn_info(asn_number);
CREATE INDEX idx_cidr_ranges_asn_id ON public.cidr_ranges(asn_id);
CREATE INDEX idx_tracking_jobs_status ON public.tracking_jobs(status);
CREATE INDEX idx_tracking_jobs_asn ON public.tracking_jobs(asn_number);
CREATE INDEX idx_discovered_ips_job_id ON public.discovered_ips(job_id);
CREATE INDEX idx_discovered_ips_ip ON public.discovered_ips(ip_address);
CREATE INDEX idx_resolved_domains_job_id ON public.resolved_domains(job_id);
CREATE INDEX idx_resolved_domains_ip ON public.resolved_domains(ip_address);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_asn_info_updated_at
    BEFORE UPDATE ON public.asn_info
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tracking_jobs_updated_at
    BEFORE UPDATE ON public.tracking_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();