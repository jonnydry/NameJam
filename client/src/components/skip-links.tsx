import { cn } from "@/lib/utils";

export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className={cn(
          "absolute top-4 left-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
          "transform -translate-y-full focus:translate-y-0 transition-transform"
        )}
      >
        Skip to main content
      </a>
      <a
        href="#generator-controls"
        className={cn(
          "absolute top-4 left-32 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
          "transform -translate-y-full focus:translate-y-0 transition-transform"
        )}
      >
        Skip to generator controls
      </a>
      <a
        href="#generated-results"
        className={cn(
          "absolute top-4 left-64 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
          "transform -translate-y-full focus:translate-y-0 transition-transform"
        )}
      >
        Skip to results
      </a>
    </div>
  );
}