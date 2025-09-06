import { FermataLogo } from "@/components/fermata-logo";
import { ModernLogo } from "@/components/modern-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogoDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Logo Comparison</h1>
          <p className="text-muted-foreground">Original vs Modern Geometric Design</p>
        </div>

        {/* Full Logo Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Original FermataLogo</CardTitle>
              <CardDescription>Current design with detailed lightbulb and fermata symbols</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-card-foreground/5 rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-muted-foreground">Small (sm)</div>
                <FermataLogo size="sm" />
              </div>
              <div className="bg-card-foreground/5 rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-muted-foreground">Large (lg)</div>
                <FermataLogo size="lg" />
              </div>
              <div className="bg-card-foreground/5 rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-muted-foreground">Extra Large (xl)</div>
                <FermataLogo size="xl" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modern Geometric Logo</CardTitle>
              <CardDescription>Simplified design with integrated typography</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-card-foreground/5 rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-muted-foreground">Small (sm) - Full</div>
                <ModernLogo size="sm" variant="full" />
              </div>
              <div className="bg-card-foreground/5 rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-muted-foreground">Large (lg) - Full</div>
                <ModernLogo size="lg" variant="full" />
              </div>
              <div className="bg-card-foreground/5 rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-muted-foreground">Extra Large (xl) - Full</div>
                <ModernLogo size="xl" variant="full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Icon-Only Versions */}
        <Card>
          <CardHeader>
            <CardTitle>Icon-Only Versions</CardTitle>
            <CardDescription>For app icons, favicons, and compact spaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card-foreground/5 rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-muted-foreground">Modern - Small Icon</div>
                <ModernLogo size="sm" variant="icon-only" />
              </div>
              <div className="bg-card-foreground/5 rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-muted-foreground">Modern - Large Icon</div>
                <ModernLogo size="lg" variant="icon-only" />
              </div>
              <div className="bg-card-foreground/5 rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-muted-foreground">Modern - XL Icon</div>
                <ModernLogo size="xl" variant="icon-only" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dark Background Test */}
        <Card>
          <CardHeader>
            <CardTitle>Dark Background Test</CardTitle>
            <CardDescription>How the logos look on darker backgrounds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-white/70">Original on Black</div>
                <FermataLogo size="lg" />
              </div>
              <div className="bg-black rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="text-sm text-white/70">Modern on Black</div>
                <ModernLogo size="lg" variant="full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Design Changes</CardTitle>
            <CardDescription>Key improvements in the modern version</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Geometric Simplification</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Hexagonal lightbulb shape instead of traditional curved</li>
                  <li>• Clean rectangular base with rounded corners</li>
                  <li>• Consistent 2px stroke weight throughout</li>
                  <li>• Strategic use of negative space</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Typography Integration</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Monospace font maintaining brand aesthetic</li>
                  <li>• "Name" in primary color, "Jam" in muted tone</li>
                  <li>• Subtle curved underline echoing fermata shape</li>
                  <li>• Responsive sizing for different contexts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}