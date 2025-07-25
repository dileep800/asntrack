import { useState } from 'react';
import { Shield, Users, Building2, Star, MapPin, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';

interface Client {
  id: number;
  name: string;
  logo: string;
  industry: string;
  location: string;
  projectsCompleted: number;
  rating: number;
  testimonial: string;
  services: string[];
  since: string;
}

const Clients = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const clients: Client[] = [
    {
      id: 1,
      name: "SecureBank Corp",
      logo: "🏦",
      industry: "Financial Services",
      location: "New York, USA",
      projectsCompleted: 15,
      rating: 5.0,
      testimonial: "CyberScope helped us identify critical vulnerabilities in our network infrastructure. Their ASN tracking capabilities are unmatched.",
      services: ["Network Assessment", "ASN Analysis", "Domain Monitoring"],
      since: "2022"
    },
    {
      id: 2,
      name: "TechFlow Solutions",
      logo: "💻",
      industry: "Technology",
      location: "San Francisco, USA",
      projectsCompleted: 23,
      rating: 4.9,
      testimonial: "The precision and speed of their IP mapping tools saved us weeks of manual reconnaissance work.",
      services: ["IP Reconnaissance", "Domain Mapping", "Security Audit"],
      since: "2021"
    },
    {
      id: 3,
      name: "Global Defense Systems",
      logo: "🛡️",
      industry: "Defense",
      location: "Washington, USA",
      projectsCompleted: 8,
      rating: 5.0,
      testimonial: "Outstanding security research capabilities. CyberScope's tools are essential for our threat intelligence operations.",
      services: ["Threat Intelligence", "Network Analysis", "ASN Tracking"],
      since: "2023"
    },
    {
      id: 4,
      name: "HealthTech Innovations",
      logo: "🏥",
      industry: "Healthcare",
      location: "Boston, USA",
      projectsCompleted: 12,
      rating: 4.8,
      testimonial: "Helped us secure our patient data infrastructure with comprehensive network mapping and vulnerability assessment.",
      services: ["Compliance Assessment", "Network Security", "Domain Analysis"],
      since: "2022"
    },
    {
      id: 5,
      name: "Energy Grid Networks",
      logo: "⚡",
      industry: "Energy",
      location: "Houston, USA",
      projectsCompleted: 19,
      rating: 4.9,
      testimonial: "Critical infrastructure protection made simple. Their ASN analysis helped us understand our network exposure.",
      services: ["Infrastructure Analysis", "Critical Asset Mapping", "Security Review"],
      since: "2021"
    },
    {
      id: 6,
      name: "CloudFirst Enterprises",
      logo: "☁️",
      industry: "Cloud Services",
      location: "Seattle, USA",
      projectsCompleted: 31,
      rating: 5.0,
      testimonial: "The most comprehensive network intelligence platform we've used. Essential for cloud security operations.",
      services: ["Cloud Security", "Network Intelligence", "Domain Monitoring"],
      since: "2020"
    }
  ];

  const industries = ['all', 'Financial Services', 'Technology', 'Defense', 'Healthcare', 'Energy', 'Cloud Services'];

  const filteredClients = selectedCategory === 'all' 
    ? clients 
    : clients.filter(client => client.industry === selectedCategory);

  const stats = {
    totalClients: clients.length,
    avgRating: (clients.reduce((acc, client) => acc + client.rating, 0) / clients.length).toFixed(1),
    totalProjects: clients.reduce((acc, client) => acc + client.projectsCompleted, 0),
    industries: [...new Set(clients.map(client => client.industry))].length
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-glow mb-4">
            Our Clients
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trusted by leading organizations worldwide for cybersecurity excellence
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-glow">{stats.totalClients}+</div>
              <div className="text-sm text-muted-foreground">Active Clients</div>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <Star className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-glow-accent">{stats.avgRating}</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-glow">{stats.totalProjects}+</div>
              <div className="text-sm text-muted-foreground">Projects Completed</div>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <Building2 className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-glow-accent">{stats.industries}</div>
              <div className="text-sm text-muted-foreground">Industries Served</div>
            </CardContent>
          </Card>
        </div>

        {/* Industry Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {industries.map((industry) => (
            <Button
              key={industry}
              variant={selectedCategory === industry ? "default" : "outline"}
              onClick={() => setSelectedCategory(industry)}
              className={selectedCategory === industry ? "btn-cyber" : "btn-cyber-outline"}
            >
              {industry === 'all' ? 'All Industries' : industry}
            </Button>
          ))}
        </div>

        {/* Client Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredClients.map((client) => (
            <Card key={client.id} className="card-cyber group hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{client.logo}</div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {client.location}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{client.industry}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-accent fill-current" />
                    <span className="font-semibold">{client.rating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Projects</div>
                    <div className="font-semibold">{client.projectsCompleted}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Client Since</div>
                    <div className="font-semibold">{client.since}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Services</div>
                  <div className="flex flex-wrap gap-1">
                    {client.services.slice(0, 2).map((service, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                    {client.services.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{client.services.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
                  "{client.testimonial}"
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success Stories Section */}
        <Card className="card-cyber">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Shield className="h-6 w-6 text-primary" />
              Success Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-glow mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Vulnerability Detection Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-glow-accent mb-2">50%</div>
                <div className="text-sm text-muted-foreground">Average Time Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-glow mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring Coverage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold mb-4">Ready to Join Our Success Stories?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join hundreds of organizations that trust CyberScope for their cybersecurity needs.
          </p>
          <Button className="btn-cyber text-lg px-8 py-4">
            Become a Client
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;