import { useState, useEffect } from 'react';
import { Search, Globe, Server, MapPin, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ASNInfo {
  id: string;
  asn_number: number;
  organization: string;
  country: string;
}

interface CIDRRange {
  id: string;
  cidr_range: string;
  ip_count: number;
}

interface DiscoveredIP {
  id: string;
  ip_address: string;
  is_active: boolean;
  port_scan_data: any;
}

interface ResolvedDomain {
  id: string;
  ip_address: string;
  domain_name: string;
  domain_type: string;
}

interface TrackingJob {
  id: string;
  status: string;
  current_step: number;
  progress_data: any;
}

const ASNTrackingSection = () => {
  const [asnInput, setAsnInput] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingJob, setTrackingJob] = useState<TrackingJob | null>(null);
  const [asnInfo, setAsnInfo] = useState<ASNInfo | null>(null);
  const [cidrRanges, setCidrRanges] = useState<CIDRRange[]>([]);
  const [discoveredIPs, setDiscoveredIPs] = useState<DiscoveredIP[]>([]);
  const [resolvedDomains, setResolvedDomains] = useState<ResolvedDomain[]>([]);
  const { toast } = useToast();

  const trackingSteps = [
    { id: 1, name: 'ASN Lookup', description: 'Fetching ASN information' },
    { id: 2, name: 'CIDR Discovery', description: 'Finding IP ranges from BGPView & RADB' },
    { id: 3, name: 'IP Discovery', description: 'Scanning for live IPs using masscan + httpx' },
    { id: 4, name: 'Domain Resolution', description: 'Resolving IPs to domains via whois' }
  ];

  const startTracking = async () => {
    if (!asnInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid ASN number",
        variant: "destructive"
      });
      return;
    }

    const asnNumber = parseInt(asnInput.replace(/^AS/i, ''));
    if (isNaN(asnNumber)) {
      toast({
        title: "Error", 
        description: "Please enter a valid ASN number",
        variant: "destructive"
      });
      return;
    }

    setIsTracking(true);
    setCidrRanges([]);
    setDiscoveredIPs([]);
    setResolvedDomains([]);

    try {
      const { data, error } = await supabase.functions.invoke('start-asn-tracking', {
        body: { asn_number: asnNumber }
      });

      if (error) throw error;

      setTrackingJob({ id: data.job_id, status: 'started', current_step: 0, progress_data: {} });
      setAsnInfo(data.asn_info);
      
      toast({
        title: "Tracking Started",
        description: `ASN ${asnNumber} tracking initiated`
      });
    } catch (error) {
      console.error('Error starting tracking:', error);
      toast({
        title: "Error",
        description: "Failed to start ASN tracking",
        variant: "destructive"
      });
      setIsTracking(false);
    }
  };

  const updateTrackingStatus = async () => {
    if (!trackingJob?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-tracking-status', {
        body: { job_id: trackingJob.id }
      });

      if (error) throw error;

      setTrackingJob(data.job);
      setCidrRanges(data.cidr_ranges || []);
      setDiscoveredIPs(data.discovered_ips || []);
      setResolvedDomains(data.resolved_domains || []);

      if (data.job.status === 'completed' || data.job.status === 'failed') {
        setIsTracking(false);
      }
    } catch (error) {
      console.error('Error fetching tracking status:', error);
    }
  };

  useEffect(() => {
    if (isTracking && trackingJob?.id) {
      const interval = setInterval(updateTrackingStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isTracking, trackingJob?.id]);

  const getStepStatus = (stepId: number) => {
    if (!trackingJob) return 'pending';
    if (trackingJob.current_step > stepId) return 'completed';
    if (trackingJob.current_step === stepId) return 'running';
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running': return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'failed': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <section className="py-20 px-4 bg-card/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-glow mb-4">
            ASN Intelligence Platform
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete ASN to domain reconnaissance pipeline. Enter an ASN number to discover 
            CIDR ranges, scan for live IPs, and resolve domains.
          </p>
        </div>

        {/* ASN Input */}
        <Card className="card-cyber max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Start ASN Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter ASN number (e.g., AS8075)"
                value={asnInput}
                onChange={(e) => setAsnInput(e.target.value)}
                className="flex-1"
                disabled={isTracking}
              />
              <Button 
                onClick={startTracking}
                disabled={isTracking}
                className="btn-cyber"
              >
                {isTracking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Track ASN
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ASN Information */}
        {asnInfo && (
          <Card className="card-cyber max-w-4xl mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                ASN Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ASN Number</p>
                  <p className="font-mono text-lg">AS{asnInfo.asn_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-semibold">{asnInfo.organization}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <Badge variant="outline">{asnInfo.country}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking Progress */}
        {trackingJob && (
          <Card className="card-cyber max-w-4xl mx-auto mb-8">
            <CardHeader>
              <CardTitle>Tracking Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackingSteps.map((step) => {
                  const status = getStepStatus(step.id);
                  return (
                    <div 
                      key={step.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        status === 'running' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      {getStepIcon(status)}
                      <div className="flex-1">
                        <h4 className="font-semibold">{step.name}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <Badge variant={status === 'completed' ? 'default' : 'outline'}>
                        {status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Grid */}
        {(cidrRanges.length > 0 || discoveredIPs.length > 0 || resolvedDomains.length > 0) && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* CIDR Ranges */}
            <Card className="card-cyber">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  CIDR Ranges ({cidrRanges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cidrRanges.map((cidr) => (
                    <div key={cidr.id} className="p-2 bg-background/50 rounded border">
                      <p className="font-mono text-sm">{cidr.cidr_range}</p>
                      <p className="text-xs text-muted-foreground">
                        {cidr.ip_count?.toLocaleString()} IPs
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Discovered IPs */}
            <Card className="card-cyber">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Live IPs ({discoveredIPs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {discoveredIPs.map((ip) => (
                    <div key={ip.id} className="p-2 bg-background/50 rounded border">
                      <p className="font-mono text-sm">{ip.ip_address}</p>
                      <div className="flex gap-1 mt-1">
                        {ip.port_scan_data?.open_ports?.map((port: number) => (
                          <Badge key={port} variant="outline" className="text-xs">
                            {port}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resolved Domains */}
            <Card className="card-cyber">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Domains ({resolvedDomains.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {resolvedDomains.map((domain) => (
                    <div key={domain.id} className="p-2 bg-background/50 rounded border">
                      <p className="text-sm font-medium">{domain.domain_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {domain.ip_address}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};

export default ASNTrackingSection;