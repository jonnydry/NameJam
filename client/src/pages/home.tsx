import { NameGenerator } from "@/components/name-generator";
import { FermataLogo } from "@/components/fermata-logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FermataLogo size="sm" />
              <h1 className="text-2xl font-semibold text-neutral-600">Name Harmonics</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-neutral-600 hover:text-google-blue transition-colors">About</a>
              <a href="#" className="text-neutral-600 hover:text-google-blue transition-colors">API</a>
              <a href="#" className="text-neutral-600 hover:text-google-blue transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl mx-auto">
          {/* Logo and Title Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <FermataLogo size="lg" />
            </div>
            <h1 className="text-4xl font-light text-neutral-600 mb-2">Name Harmonics</h1>
            <p className="text-lg text-neutral-600 font-roboto">Generate unique band names and song titles</p>
          </div>

          {/* Name Generator Component */}
          <NameGenerator />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-neutral-600">© 2024 Name Harmonics. Powered by web-sourced creativity.</p>
            <div className="flex justify-center space-x-6 mt-4">
              <a href="#" className="text-xs text-neutral-600 hover:text-google-blue transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-neutral-600 hover:text-google-blue transition-colors">Terms of Service</a>
              <a href="#" className="text-xs text-neutral-600 hover:text-google-blue transition-colors">API Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
