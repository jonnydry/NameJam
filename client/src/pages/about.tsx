import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FermataLogo } from "@/components/fermata-logo";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with back link */}
      <header className="bg-card border-b border-border py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Name_Jam
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Logo and Title Section */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <FermataLogo size="lg" />
              </div>
              <h1 className="text-3xl font-bold mb-2 uppercase tracking-wide font-mono">About Name_Jam</h1>
            </div>
          </div>

          {/* Content Card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">About This Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-muted-foreground">
                <p>This is a placeholder for the About page content.</p>
                <p className="mt-4">You can add your project description, features, credits, or any other information here.</p>
              </div>
              
              {/* Placeholder sections */}
              <div className="grid gap-6 mt-8">
                <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                  <h3 className="font-medium mb-2">Project Overview</h3>
                  <p className="text-sm text-muted-foreground">Add your project description here...</p>
                </div>
                
                <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                  <h3 className="font-medium mb-2">Features</h3>
                  <p className="text-sm text-muted-foreground">List your app's key features here...</p>
                </div>
                
                <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                  <h3 className="font-medium mb-2">Technology Stack</h3>
                  <p className="text-sm text-muted-foreground">Describe the technologies used...</p>
                </div>
                
                <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                  <h3 className="font-medium mb-2">Credits & Acknowledgments</h3>
                  <p className="text-sm text-muted-foreground">Add credits and acknowledgments here...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-card border-t border-border py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">© 2024 Name_Jam. Powered by web-sourced creativity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}