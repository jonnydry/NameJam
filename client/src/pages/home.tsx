import { NameGenerator } from "@/components/name-generator";
import { SetListGenerator } from "@/components/setlist-generator";
import { FermataLogo } from "@/components/fermata-logo";
import { Stash } from "@/components/stash";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function Home() {
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const handleCopy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedName(name);
      setTimeout(() => setCopiedName(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Logo and Title Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <FermataLogo size="xl" />
            </div>
            <h1 className="text-5xl font-mono text-foreground mb-2 bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent uppercase tracking-wider">Name_Jam</h1>
            <p className="text-lg text-muted-foreground font-roboto">Generate unique band names, song titles, and set lists</p>
          </div>

          {/* Two Column Layout with Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Generator Section - Takes 2/3 on large screens */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="names" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="names">Name Generator</TabsTrigger>
                  <TabsTrigger value="setlist">Set List Generator</TabsTrigger>
                </TabsList>
                <TabsContent value="names">
                  <NameGenerator />
                </TabsContent>
                <TabsContent value="setlist">
                  <SetListGenerator onCopy={handleCopy} />
                </TabsContent>
              </Tabs>
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
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">About</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Contact</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">API Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
