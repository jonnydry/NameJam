import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StashProvider } from "@/context/stash-context";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Home from "@/pages/home";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";
import { Landing } from "@/components/landing";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading ? (
        <Route path="/" component={() => <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/app" component={Home} />
          <Route path="/landing" component={Landing} />
          <Route path="/about" component={About} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Apply dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StashProvider>
          <TooltipProvider>
            <Toaster />
            <OfflineIndicator />
            <Router />
          </TooltipProvider>
        </StashProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
