import { NameGenerator } from "@/components/name-generator";
import { FermataLogo } from "@/components/fermata-logo";
import { Stash } from "@/components/stash";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FermataLogo size="sm" />
              <h1 className="text-2xl font-semibold text-foreground">NameJam</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">API</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Logo and Title Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <FermataLogo size="lg" />
            </div>
            <h1 className="text-4xl font-light text-foreground mb-2">NameJam</h1>
            <p className="text-lg text-muted-foreground font-roboto">Generate unique band names and song titles</p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Name Generator - Takes 2/3 on large screens */}
            <div className="lg:col-span-2">
              <NameGenerator />
            </div>
            
            {/* Stash - Takes 1/3 on large screens */}
            <div className="lg:col-span-1">
              <Stash />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">© 2024 NameJam. Powered by web-sourced creativity.</p>
            <div className="flex justify-center space-x-6 mt-4">
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">API Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
