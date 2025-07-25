import { useState } from 'react';
import { Book, MessageCircle, Video, Download, Search, ChevronDown, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Navigation from '@/components/Navigation';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'api' | 'tutorial';
  url: string;
  duration?: string;
}

const Support = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqs: FAQ[] = [
    {
      id: 1,
      question: "How do I start tracking an ASN?",
      answer: "Navigate to the ASN Tracker page, enter your ASN number in the format 'AS13335' or just '13335', and click 'Start Tracking'. The system will automatically begin the discovery process.",
      category: "tracking"
    },
    {
      id: 2,
      question: "What ASN formats are supported?",
      answer: "We support multiple ASN formats including 'AS13335', '13335', and 'ASN13335'. The system automatically detects and validates the format.",
      category: "tracking"
    },
    {
      id: 3,
      question: "How accurate are the IP to domain mappings?",
      answer: "Our mapping accuracy is over 99.9%. We use multiple data sources and real-time validation to ensure the highest quality results.",
      category: "technical"
    },
    {
      id: 4,
      question: "Is there an API available?",
      answer: "Yes, we offer a comprehensive REST API for enterprise clients. Contact our sales team for API documentation and access credentials.",
      category: "api"
    },
    {
      id: 5,
      question: "What are the rate limits?",
      answer: "Free tier: 100 requests/day. Pro tier: 10,000 requests/day. Enterprise: Custom limits based on your needs.",
      category: "api"
    },
    {
      id: 6,
      question: "How do I export results?",
      answer: "Results can be exported in JSON, CSV, or XML formats using the export button in the results panel.",
      category: "technical"
    }
  ];

  const resources: Resource[] = [
    {
      id: 1,
      title: "Getting Started Guide",
      description: "Complete guide to using CyberScope for ASN tracking and network reconnaissance",
      type: "guide",
      url: "#",
      duration: "10 min read"
    },
    {
      id: 2,
      title: "API Documentation",
      description: "Comprehensive API reference with examples and authentication details",
      type: "api",
      url: "#",
      duration: "Reference"
    },
    {
      id: 3,
      title: "ASN Tracking Tutorial",
      description: "Video walkthrough of the ASN tracking process from start to finish",
      type: "video",
      url: "#",
      duration: "15 minutes"
    },
    {
      id: 4,
      title: "Advanced Network Analysis",
      description: "Learn advanced techniques for network reconnaissance and analysis",
      type: "tutorial",
      url: "#",
      duration: "25 min read"
    },
    {
      id: 5,
      title: "Integration Examples",
      description: "Code examples for integrating CyberScope with popular security tools",
      type: "guide",
      url: "#",
      duration: "20 min read"
    },
    {
      id: 6,
      title: "Best Practices",
      description: "Security best practices for penetration testing and network analysis",
      type: "guide",
      url: "#",
      duration: "15 min read"
    }
  ];

  const categories = ['all', 'tracking', 'technical', 'api'];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return <Book className="h-5 w-5 text-primary" />;
      case 'video':
        return <Video className="h-5 w-5 text-accent" />;
      case 'api':
        return <Download className="h-5 w-5 text-primary" />;
      case 'tutorial':
        return <Book className="h-5 w-5 text-accent" />;
      default:
        return <Book className="h-5 w-5 text-muted-foreground" />;
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
            Support Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get help with CyberScope and learn how to maximize your cybersecurity capabilities
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="card-cyber text-center group hover:scale-105 transition-all duration-300">
            <CardContent className="pt-6">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4 group-hover:animate-float" />
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-muted-foreground mb-4">Get instant help from our support team</p>
              <Button className="btn-cyber-outline">Start Chat</Button>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center group hover:scale-105 transition-all duration-300">
            <CardContent className="pt-6">
              <Video className="h-12 w-12 text-accent mx-auto mb-4 group-hover:animate-float" />
              <h3 className="text-lg font-semibold mb-2">Video Tutorials</h3>
              <p className="text-muted-foreground mb-4">Watch step-by-step guides</p>
              <Button className="btn-cyber-accent">Watch Now</Button>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center group hover:scale-105 transition-all duration-300">
            <CardContent className="pt-6">
              <Download className="h-12 w-12 text-primary mx-auto mb-4 group-hover:animate-float" />
              <h3 className="text-lg font-semibold mb-2">API Docs</h3>
              <p className="text-muted-foreground mb-4">Access API documentation</p>
              <Button className="btn-cyber-outline">View Docs</Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <div>
            <Card className="card-cyber">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search FAQs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className={selectedCategory === category ? "btn-cyber" : "btn-cyber-outline"}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredFAQs.map((faq) => (
                    <Collapsible key={faq.id}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
                        <span className="text-left font-medium">{faq.question}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 text-muted-foreground">
                        {faq.answer}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resources Section */}
          <div>
            <Card className="card-cyber">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-6 w-6 text-accent" />
                  Documentation & Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {resources.map((resource) => (
                    <div key={resource.id} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
                      {getResourceIcon(resource.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{resource.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{resource.duration}</span>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Support */}
        <Card className="card-cyber mt-8">
          <CardHeader>
            <CardTitle className="text-center">Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is here to help 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-cyber">
                Contact Support
              </Button>
              <Button className="btn-cyber-outline">
                Schedule a Demo
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;