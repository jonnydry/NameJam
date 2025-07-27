import { Button } from "@/components/ui/button";
import { FermataLogo } from "@/components/fermata-logo";
import { Link } from "wouter";
import { LogIn, Zap, ListMusic, NotebookPen, Brain, Archive, Music, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

export function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const features = [
    {
      icon: Zap,
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-500",
      customClass: "carousel-card-blue",
      title: "Quadruple API Intelligence",
      description: "Datamuse linguistics + Spotify data + Last.fm genres + ConceptNet semantics for unmatched authenticity"
    },
    {
      icon: NotebookPen,
      bgColor: "bg-green-500/10",
      textColor: "text-green-500",
      customClass: "carousel-card-green",
      title: "Lyric Sparks",
      description: "AI-powered opening lines with authentic genre vocabulary from real artist data"
    },
    {
      icon: Brain,
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-500",
      customClass: "carousel-card-yellow",
      title: "Genre-Perfect AI",
      description: "Learns from 15+ real artist examples per genre to create names that truly fit your style"
    },
    {
      icon: Archive,
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-500",
      customClass: "carousel-card-orange",
      title: "Organized Stash",
      description: "Rate, sort, and export your favorites - names, lyrics, and edgy band bios"
    },
    {
      icon: Music,
      bgColor: "bg-red-500/10",
      textColor: "text-red-500",
      customClass: "carousel-card-red",
      title: "Instant Verification",
      description: "Check availability across Spotify, YouTube & Google with one click - know what's taken instantly"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Resume auto-advance after 10 seconds
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Resume auto-advance after 10 seconds
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Resume auto-advance after 10 seconds
  };

  // Auto-advance carousel
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % features.length);
      }, 5000); // Change slide every 5 seconds
      return () => clearInterval(timer);
    }
  }, [isPaused, features.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-8 md:p-12">
          {/* Logo and Title Section */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              {/* Logo */}
              <div className="mb-4">
                <FermataLogo size="xl" />
              </div>
              {/* Title with special alignment */}
              <div className="relative">
                <h1 className="text-responsive-3xl md:text-responsive-4xl font-bold mb-2 uppercase tracking-wide font-mono flex items-center justify-center relative">
                  <span className="title-text title-align">&gt;Name_Jam</span>
                </h1>
              </div>
            </div>
            <p className="text-responsive-xs md:text-responsive-sm text-muted-foreground font-medium subtitle-fade px-2 mb-8">Create unique band or song names and generate lyrics to prompt your own writing. Name your Jam!</p>
          </div>

          {/* Features Carousel */}
          <div className="relative mb-12 max-w-3xl mx-auto">
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="w-full flex-shrink-0">
                      <div className={`mx-4 text-left p-8 rounded-xl border-2 border-border/30 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-sm transition-all duration-300 ${feature.customClass}`}>
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${feature.bgColor} ${feature.textColor}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2 font-mono text-foreground">{feature.title}</h3>
                            <p className="text-base text-muted-foreground/90 leading-relaxed">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 p-2 rounded-full bg-background/80 border border-border hover:bg-background transition-all duration-200 shadow-lg"
              aria-label="Previous feature"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 p-2 rounded-full bg-background/80 border border-border hover:bg-background transition-all duration-200 shadow-lg"
              aria-label="Next feature"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-primary w-8' : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to feature ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Link href="/app">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="font-semibold px-8 py-4 text-lg w-full sm:w-auto"
                >
                  Proceed as Guest Artist
                </Button>
              </Link>
              <Button 
                size="lg" 
                className="font-semibold px-8 py-4 text-lg"
                onClick={() => window.location.href = "/api/login"}
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sign in for AI band biographies, enhanced stash features, and personalized creative tools
            </p>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-primary transition-colors">
              About
            </Link>
            <span className="hidden sm:inline">•</span>
            <span>© 2025 Name_Jam</span>
          </div>
        </div>
      </footer>
    </div>
  );
}