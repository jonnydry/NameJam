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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
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
    <QueryClientProvider client={queryClient}>
      <StashProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </StashProvider>
    </QueryClientProvider>
  );
}

export default App;
