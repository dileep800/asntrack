import { useState, useEffect } from 'react';
import { ArrowRight, Shield, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Hero = () => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  const texts = [
    'Track IP Addresses',
    'Analyze Domains',
    'Map Network Ranges',
    'Discover Digital Footprints'
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (charIndex < texts[currentIndex].length) {
        setCurrentText(texts[currentIndex].substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else {
        setTimeout(() => {
          setCharIndex(0);
          setCurrentIndex((currentIndex + 1) % texts.length);
          setCurrentText('');
        }, 2000);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [charIndex, currentIndex, texts]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden cyber-grid">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-accent rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-accent rounded-full animate-pulse delay-1500"></div>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent scan-line opacity-50"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8 animate-fade-in-up">
          {/* Main heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-glow">
              Cyber<span className="text-accent">Scope</span>
            </h1>
            <div className="h-16 flex items-center justify-center">
              <h2 className="text-2xl md:text-4xl font-semibold text-muted-foreground">
                {currentText}
                <span className="animate-pulse text-primary">|</span>
              </h2>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Professional ASN to IP mapping and domain reconnaissance for cybersecurity professionals. 
            Track network infrastructures with precision and speed.
          </p>

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="card-cyber text-center group">
              <Search className="h-12 w-12 text-primary mx-auto mb-4 group-hover:animate-float" />
              <h3 className="text-lg font-semibold mb-2">ASN Discovery</h3>
              <p className="text-muted-foreground">Convert ASN numbers to CIDR ranges with real-time tracking</p>
            </div>
            <div className="card-cyber text-center group">
              <Globe className="h-12 w-12 text-accent mx-auto mb-4 group-hover:animate-float" />
              <h3 className="text-lg font-semibold mb-2">IP to Domain</h3>
              <p className="text-muted-foreground">Map IP addresses to domains for comprehensive analysis</p>
            </div>
            <div className="card-cyber text-center group">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4 group-hover:animate-float" />
              <h3 className="text-lg font-semibold mb-2">Secure Processing</h3>
              <p className="text-muted-foreground">Enterprise-grade security for all reconnaissance operations</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Link to="/tracker">
              <Button className="btn-cyber text-lg px-8 py-4 group">
                Start Tracking
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/support">
              <Button className="btn-cyber-outline text-lg px-8 py-4">
                View Documentation
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16 pt-8 border-t border-border/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-glow">99.9%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-glow-accent">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-glow">500+</div>
              <div className="text-sm text-muted-foreground">Clients</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;