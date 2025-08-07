import { useState, useEffect } from 'react';
import { Search, Activity, Globe, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';

interface TrackingStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

interface Result {
  type: 'asn' | 'cidr' | 'ip' | 'domain';
  value: string;
  details?: string;
}

const ASNTracker = () => {
  const [asnNumber, setAsnNumber] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const trackingSteps: TrackingStep[] = [
    {
      id: 1,
      title: 'Validating ASN',
      description: 'Checking ASN format and existence',
      status: 'pending',
      progress: 0
    },
    {
      id: 2,
      title: 'Fetching CIDR Ranges',
      description: 'Retrieving network ranges for ASN',
      status: 'pending',
      progress: 0
    },
    {
      id: 3,
      title: 'Scanning IP Addresses',
      description: 'Mapping CIDR ranges to active IPs',
      status: 'pending',
      progress: 0
    },
    {
      id: 4,
      title: 'Resolving Domains',
      description: 'Converting IPs to domain names',
      status: 'pending',
      progress: 0
    }
  ];

  const [steps, setSteps] = useState(trackingSteps);

  const startTracking = async () => {
    if (!asnNumber.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid ASN number",
        variant: "destructive"
      });
      return;
    }

    const asnNum = parseInt(asnNumber.trim());
    if (isNaN(asnNum) || asnNum <= 0) {
      toast({
        title: "Invalid ASN",
        description: "Please enter a valid ASN number",
        variant: "destructive"
      });
      return;
    }

    setIsTracking(true);
    setResults([]);
    setCurrentStep(0);

    // Reset steps
    setSteps(trackingSteps.map(step => ({ ...step, status: 'pending', progress: 0 })));

    try {
      // Start tracking job
      const { data, error } = await supabase.functions.invoke('start-asn-tracking', {
        body: { asn_number: asnNum }
      });

      if (error) {
        throw error;
      }

      setJobId(data.job_id);
      
      // Add initial ASN result
      if (data.asn_info) {
        setResults([{
          type: 'asn',
          value: `AS${asnNum}`,
          details: `${data.asn_info.organization_name || 'Organization'} (${data.asn_info.country_code || 'Unknown'})`
        }]);
      }

      toast({
        title: "Tracking Started",
        description: `Started tracking ASN ${asnNum}`,
      });

    } catch (error: any) {
      console.error('Tracking start failed:', error);
      toast({
        title: "Tracking Failed",
        description: error.message || "An error occurred starting the tracking",
        variant: "destructive"
      });
      setIsTracking(false);
    }
  };

  const updateTrackingStatus = async () => {
    if (!jobId) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-tracking-status', {
        body: { job_id: jobId }
      });

      if (error) {
        console.error('Status check failed:', error);
        return;
      }

      const job = data.job;
      if (!job) return;

      // Update steps based on current step (now using integer steps)
      const currentStepIndex = job.current_step || 0;
      setCurrentStep(currentStepIndex);

      // Get progress from progress_data
      const progressData = job.progress_data || {};
      const currentProgress = progressData.progress || 0;

      // Update steps status
      setSteps(prev => prev.map((step, index) => {
        if (index < currentStepIndex) {
          return { ...step, status: 'completed', progress: 100 };
        } else if (index === currentStepIndex) {
          return { 
            ...step, 
            status: job.status === 'failed' ? 'error' : 'processing', 
            progress: currentProgress
          };
        } else {
          return { ...step, status: 'pending', progress: 0 };
        }
      }));

      // Update results
      if (data.cidr_ranges?.length > 0) {
        const cidrResults = data.cidr_ranges.map((cidr: any) => ({
          type: 'cidr' as const,
          value: cidr.cidr_range,
          details: `${cidr.ip_count || 'Unknown'} IPs`
        }));
        setResults(prev => {
          const filtered = prev.filter(r => r.type !== 'cidr');
          return [...filtered, ...cidrResults];
        });
      }

      if (data.discovered_ips?.length > 0) {
        const ipResults = data.discovered_ips.map((ip: any) => ({
          type: 'ip' as const,
          value: ip.ip_address,
          details: ip.is_active ? 'Active' : 'Inactive'
        }));
        setResults(prev => {
          const filtered = prev.filter(r => r.type !== 'ip');
          return [...filtered, ...ipResults];
        });
      }

      if (data.resolved_domains?.length > 0) {
        const domainResults = data.resolved_domains.map((domain: any) => ({
          type: 'domain' as const,
          value: domain.domain_name,
          details: domain.domain_type || 'Standard'
        }));
        setResults(prev => {
          const filtered = prev.filter(r => r.type !== 'domain');
          return [...filtered, ...domainResults];
        });
      }

      // Check if tracking is complete or failed
      if (job.status === 'completed') {
        setIsTracking(false);
        toast({
          title: "Tracking Complete",
          description: `Successfully tracked ASN ${asnNumber}`,
        });
      } else if (job.status === 'failed') {
        setIsTracking(false);
        toast({
          title: "Tracking Failed",
          description: job.error_message || "Tracking failed",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Status update failed:', error);
    }
  };

  // Poll for status updates when tracking
  useEffect(() => {
    if (!isTracking || !jobId) return;

    const interval = setInterval(updateTrackingStatus, 2000);
    return () => clearInterval(interval);
  }, [isTracking, jobId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Activity className="h-5 w-5 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case 'error':
        return <div className="h-5 w-5 rounded-full bg-destructive" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-muted" />;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'asn':
        return <Search className="h-4 w-4 text-primary" />;
      case 'cidr':
        return <MapPin className="h-4 w-4 text-accent" />;
      case 'ip':
        return <Globe className="h-4 w-4 text-primary" />;
      case 'domain':
        return <Globe className="h-4 w-4 text-accent" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-glow mb-4">
            ASN Tracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enter an ASN number to track and map its network infrastructure
          </p>
        </div>

        {/* Input Section */}
        <Card className="card-cyber mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              ASN Input
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter ASN number (e.g., 13335)"
                  value={asnNumber}
                  onChange={(e) => setAsnNumber(e.target.value)}
                  className="bg-background border-border/50 text-lg py-3"
                  disabled={isTracking}
                />
              </div>
              <Button 
                onClick={startTracking}
                disabled={isTracking}
                className="btn-cyber px-8"
              >
                {isTracking ? 'Tracking...' : 'Start Tracking'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Progress Section */}
          <Card className="card-cyber">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Tracking Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.status)}
                    <div className="flex-1">
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {step.status === 'completed' && (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <Progress 
                    value={step.progress} 
                    className={`transition-all duration-300 ${
                      step.status === 'processing' ? 'animate-pulse-glow' : ''
                    }`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="card-cyber">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-accent" />
                Discovery Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start tracking to see results here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/30">
                      {getResultIcon(result.type)}
                      <div className="flex-1">
                        <div className="font-mono text-sm font-semibold">{result.value}</div>
                        {result.details && (
                          <div className="text-xs text-muted-foreground">{result.details}</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {result.type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <Search className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">ASN to CIDR</h3>
              <p className="text-sm text-muted-foreground">
                Convert Autonomous System Numbers to network ranges
              </p>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <MapPin className="h-8 w-8 text-accent mx-auto mb-4" />
              <h3 className="font-semibold mb-2">CIDR to IP</h3>
              <p className="text-sm text-muted-foreground">
                Map network ranges to individual IP addresses
              </p>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <Globe className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">IP to Domain</h3>
              <p className="text-sm text-muted-foreground">
                Resolve IP addresses to domain names
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ASNTracker;