import { Button } from "@/components/ui/button";
import { FermataLogo } from "@/components/fermata-logo";

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
          <div className="flex items-center space-x-4">
            <FermataLogo />
            <h1 className="text-responsive-4xl font-bold tracking-tight">
              Name_Jam
            </h1>
          </div>
          
          <p className="text-responsive-lg text-muted-foreground max-w-2xl">
            Create unique band names, song titles, and lyrics with advanced AI and linguistic technologies. 
            Generate creative content for musicians and songwriters.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = "/api/login"} 
              size="lg"
              className="text-responsive-base px-8 py-4"
            >
              Get Started
            </Button>
            
            <p className="text-responsive-sm text-muted-foreground">
              Sign in with your Replit account to start creating
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl">
            <div className="p-6 border border-muted rounded-lg">
              <h3 className="text-responsive-lg font-semibold mb-2">Smart Generation</h3>
              <p className="text-responsive-sm text-muted-foreground">
                AI-powered name generation with 3,000+ word vocabulary and advanced linguistic patterns
              </p>
            </div>
            
            <div className="p-6 border border-muted rounded-lg">
              <h3 className="text-responsive-lg font-semibold mb-2">Real Verification</h3>
              <p className="text-responsive-sm text-muted-foreground">
                Check availability against Spotify, Last.fm, and other music databases
              </p>
            </div>
            
            <div className="p-6 border border-muted rounded-lg">
              <h3 className="text-responsive-lg font-semibold mb-2">Creative Tools</h3>
              <p className="text-responsive-sm text-muted-foreground">
                Generate setlists, lyrics, and band biographies with your personalized stash
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}