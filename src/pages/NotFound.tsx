import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex items-center justify-center py-24">
        <Card className="card-cyber max-w-lg mx-4">
          <CardContent className="text-center pt-12 pb-8">
            <div className="relative mb-8">
              <AlertTriangle className="h-24 w-24 text-primary mx-auto mb-4 animate-pulse-glow" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
            </div>
            
            <h1 className="text-6xl font-bold text-glow mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-4">System Not Found</h2>
            <p className="text-muted-foreground mb-8">
              The digital pathway you're looking for doesn't exist in our network. 
              It may have been moved or the address was typed incorrectly.
            </p>
            
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 font-mono">
                Route: <span className="text-primary">{location.pathname}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/">
                  <Button className="btn-cyber">
                    <Home className="h-4 w-4 mr-2" />
                    Return to Base
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="btn-cyber-outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
