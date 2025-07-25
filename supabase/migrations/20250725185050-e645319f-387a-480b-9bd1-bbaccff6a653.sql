-- Create ASN information table
CREATE TABLE public.asn_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asn_number INTEGER NOT NULL UNIQUE,
  organization_name TEXT,
  country_code TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CIDR ranges table
CREATE TABLE public.cidr_ranges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asn_id UUID NOT NULL REFERENCES public.asn_info(id) ON DELETE CASCADE,
  cidr_range TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tracking jobs table
CREATE TABLE public.tracking_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asn_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  current_step TEXT NOT NULL DEFAULT 'asn_lookup',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_cidrs INTEGER DEFAULT 0,
  total_ips INTEGER DEFAULT 0,
  total_domains INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discovered IPs table
CREATE TABLE public.discovered_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.tracking_jobs(id) ON DELETE CASCADE,
  cidr_id UUID NOT NULL REFERENCES public.cidr_ranges(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_ping_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resolved domains table
CREATE TABLE public.resolved_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.tracking_jobs(id) ON DELETE CASCADE,
  ip_id UUID NOT NULL REFERENCES public.discovered_ips(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  resolution_type TEXT NOT NULL DEFAULT 'ptr' CHECK (resolution_type IN ('ptr', 'forward')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.asn_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cidr_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolved_domains ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ASN info (publicly readable, admin writable)
CREATE POLICY "ASN info is viewable by everyone" 
ON public.asn_info 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert ASN info" 
ON public.asn_info 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for CIDR ranges (publicly readable, admin writable)
CREATE POLICY "CIDR ranges are viewable by everyone" 
ON public.cidr_ranges 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert CIDR ranges" 
ON public.cidr_ranges 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for tracking jobs (user-specific)
CREATE POLICY "Users can view their own tracking jobs" 
ON public.tracking_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tracking jobs" 
ON public.tracking_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracking jobs" 
ON public.tracking_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for discovered IPs (user-specific through job)
CREATE POLICY "Users can view IPs from their jobs" 
ON public.discovered_ips 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tracking_jobs 
    WHERE tracking_jobs.id = discovered_ips.job_id 
    AND tracking_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert discovered IPs" 
ON public.discovered_ips 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tracking_jobs 
    WHERE tracking_jobs.id = discovered_ips.job_id 
    AND tracking_jobs.user_id = auth.uid()
  )
);

-- Create RLS policies for resolved domains (user-specific through job)
CREATE POLICY "Users can view domains from their jobs" 
ON public.resolved_domains 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tracking_jobs tj
    JOIN public.discovered_ips di ON di.job_id = tj.id
    WHERE di.id = resolved_domains.ip_id 
    AND tj.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert resolved domains" 
ON public.resolved_domains 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tracking_jobs tj
    JOIN public.discovered_ips di ON di.job_id = tj.id
    WHERE di.id = resolved_domains.ip_id 
    AND tj.user_id = auth.uid()
  )
);

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

-- Create indexes for better performance
CREATE INDEX idx_asn_info_asn_number ON public.asn_info(asn_number);
CREATE INDEX idx_cidr_ranges_asn_id ON public.cidr_ranges(asn_id);
CREATE INDEX idx_tracking_jobs_user_id ON public.tracking_jobs(user_id);
CREATE INDEX idx_tracking_jobs_status ON public.tracking_jobs(status);
CREATE INDEX idx_discovered_ips_job_id ON public.discovered_ips(job_id);
CREATE INDEX idx_discovered_ips_ip_address ON public.discovered_ips(ip_address);
CREATE INDEX idx_resolved_domains_job_id ON public.resolved_domains(job_id);