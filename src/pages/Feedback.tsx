import { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Send, TrendingUp, Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface Review {
  id: number;
  name: string;
  company: string;
  rating: number;
  comment: string;
  category: string;
  date: string;
  verified: boolean;
}

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    category: '',
    title: '',
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const reviews: Review[] = [
    {
      id: 1,
      name: "Sarah Chen",
      company: "SecureBank Corp",
      rating: 5,
      comment: "CyberScope has revolutionized our network reconnaissance capabilities. The ASN tracking feature is incredibly accurate and fast.",
      category: "ASN Tracking",
      date: "2024-01-15",
      verified: true
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      company: "TechFlow Solutions",
      rating: 5,
      comment: "The IP to domain mapping saved us countless hours of manual work. Outstanding tool for cybersecurity professionals.",
      category: "Domain Mapping",
      date: "2024-01-10",
      verified: true
    },
    {
      id: 3,
      name: "Emily Johnson",
      company: "Global Defense Systems",
      rating: 4,
      comment: "Great platform overall. Would love to see more advanced filtering options in the next update.",
      category: "User Interface",
      date: "2024-01-08",
      verified: true
    },
    {
      id: 4,
      name: "David Kim",
      company: "CloudFirst Enterprises",
      rating: 5,
      comment: "Exceptional customer support and documentation. The API integration was seamless.",
      category: "API & Support",
      date: "2024-01-05",
      verified: true
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.comment || rating === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and provide a rating",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Feedback Submitted!",
      description: "Thank you for your valuable feedback. We appreciate your input!",
    });
    
    setFormData({
      name: '',
      email: '',
      company: '',
      category: '',
      title: '',
      comment: ''
    });
    setRating(0);
    setIsSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStars = (count: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${
          index < count 
            ? 'fill-accent text-accent' 
            : 'text-muted-foreground'
        } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        onClick={interactive ? () => setRating(index + 1) : undefined}
        onMouseEnter={interactive ? () => setHoveredRating(index + 1) : undefined}
        onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
      />
    ));
  };

  const avgRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-glow mb-4">
            Feedback & Reviews
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Help us improve CyberScope with your valuable feedback and see what others are saying
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <Star className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-glow-accent">{avgRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-glow">{reviews.length}+</div>
              <div className="text-sm text-muted-foreground">Total Reviews</div>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-glow-accent">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <Award className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-glow">24h</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Feedback Form */}
          <Card className="card-cyber">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                Share Your Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Overall Rating <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-1">
                    {renderStars(hoveredRating || rating, true)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click to rate your experience
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company</label>
                    <Input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asn-tracking">ASN Tracking</SelectItem>
                        <SelectItem value="domain-mapping">Domain Mapping</SelectItem>
                        <SelectItem value="user-interface">User Interface</SelectItem>
                        <SelectItem value="api-support">API & Support</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief title for your feedback"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Comment <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    value={formData.comment}
                    onChange={(e) => handleInputChange('comment', e.target.value)}
                    placeholder="Share your detailed feedback, suggestions, or experience..."
                    rows={6}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-cyber w-full"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Reviews and Rating Breakdown */}
          <div className="space-y-6">
            {/* Rating Breakdown */}
            <Card className="card-cyber">
              <CardHeader>
                <CardTitle>Rating Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ratingDistribution.map((dist) => (
                    <div key={dist.rating} className="flex items-center gap-3">
                      <span className="text-sm w-6">{dist.rating}</span>
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-accent h-2 rounded-full transition-all duration-300"
                          style={{ width: `${dist.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{dist.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card className="card-cyber">
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border/30 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{review.name}</h4>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.company}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{review.comment}</p>
                      <Badge variant="outline" className="text-xs">
                        {review.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feedback Actions */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <ThumbsUp className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Love CyberScope?</h3>
              <p className="text-muted-foreground mb-4">
                Help others discover our platform by leaving a review
              </p>
              <Button className="btn-cyber-accent">
                Write a Review
              </Button>
            </CardContent>
          </Card>

          <Card className="card-cyber text-center">
            <CardContent className="pt-6">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Have Suggestions?</h3>
              <p className="text-muted-foreground mb-4">
                We're always looking to improve. Share your ideas with us
              </p>
              <Button className="btn-cyber-outline">
                Submit Idea
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;