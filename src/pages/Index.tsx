import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import ASNTrackingSection from '@/components/ASNTrackingSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <ASNTrackingSection />
    </div>
  );
};

export default Index;
