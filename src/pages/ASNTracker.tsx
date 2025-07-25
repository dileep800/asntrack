import { useState } from 'react';
import { Search, Activity, Globe, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

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

  const simulateTracking = async () => {
    if (!asnNumber.trim()) {
      toast({
        title: "Invalid Input",
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
      // Simulate each step
      for (let i = 0; i < trackingSteps.length; i++) {
        setCurrentStep(i);
        
        // Update current step to processing
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'processing' } : step
        ));

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setSteps(prev => prev.map((step, index) => 
            index === i ? { ...step, progress } : step
          ));
        }

        // Complete current step and add results
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'completed', progress: 100 } : step
        ));

        // Add mock results based on step
        switch (i) {
          case 0:
            setResults(prev => [...prev, { 
              type: 'asn', 
              value: `AS${asnNumber}`, 
              details: 'Valid ASN found' 
            }]);
            break;
          case 1:
            setResults(prev => [...prev, 
              { type: 'cidr', value: '192.168.1.0/24', details: 'Primary range' },
              { type: 'cidr', value: '10.0.0.0/16', details: 'Secondary range' }
            ]);
            break;
          case 2:
            setResults(prev => [...prev,
              { type: 'ip', value: '192.168.1.1', details: 'Active host' },
              { type: 'ip', value: '192.168.1.100', details: 'Web server' },
              { type: 'ip', value: '10.0.0.1', details: 'Gateway' }
            ]);
            break;
          case 3:
            setResults(prev => [...prev,
              { type: 'domain', value: 'example.com', details: 'Primary domain' },
              { type: 'domain', value: 'subdomain.example.com', details: 'Subdomain' },
              { type: 'domain', value: 'api.example.com', details: 'API endpoint' }
            ]);
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Tracking Complete",
        description: `Successfully tracked ASN ${asnNumber}`,
      });

    } catch (error) {
      toast({
        title: "Tracking Failed",
        description: "An error occurred during tracking",
        variant: "destructive"
      });
    } finally {
      setIsTracking(false);
    }
  };

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
                onClick={simulateTracking}
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