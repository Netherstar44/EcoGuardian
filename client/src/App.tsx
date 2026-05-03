import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";

// Layout
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import CreateReport from "@/pages/CreateReport";
import ReportDetails from "@/pages/ReportDetails";
import Leaderboard from "@/pages/Leaderboard";
import Education from "@/pages/Education";
import Community from "@/pages/Community";
import CarbonCalculator from "@/pages/CarbonCalculator";
import Marketplace from "@/pages/Marketplace";
import Reels from "@/pages/Reels";
import Minigames from "@/pages/Minigames";
import UserProfile from "@/pages/UserProfile";
import Friends from "@/pages/Friends";
import SearchResults from "@/pages/SearchResults";
// @ts-ignore - path alias sometimes confuses ts in tooling
import Weather from "@/pages/Weather";
// @ts-ignore - path alias sometimes confuses ts in tooling
import Messages from "@/pages/Messages";

/**
 * Guard for routes that require authentication.
 * If not logged in, redirects to /auth with a toast (handled inside CreateReport too).
 */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  // Still resolving auth — render nothing (AppLayout + spinner handled by each page)
  if (isLoading) return null;

  // Not logged in → go to auth
  if (user === null) return <Redirect to="/auth" />;

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  // Always render AppLayout so the navbar is always visible.
  // Individual pages handle their own auth guards.
  return (
    <AppLayout>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={() =>
          // Once auth resolves: logged in → dashboard, not logged in → Home
          isLoading ? null : user ? <Redirect to="/dashboard" /> : <Home />
        } />
        <Route path="/auth" component={() =>
          // If already logged in, skip auth page
          !isLoading && user ? <Redirect to="/community" /> : <Auth />
        } />

        {/* Public but also useful logged-out */}
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/report/:id" component={ReportDetails} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/education" component={Education} />
        <Route path="/weather" component={Weather} />

        {/* Protected routes */}
        <Route path="/create-report" component={() => <ProtectedRoute component={CreateReport} />} />
        <Route path="/community" component={() => <ProtectedRoute component={Community} />} />
        <Route path="/friends" component={() => <ProtectedRoute component={Friends} />} />
        <Route path="/search" component={() => <ProtectedRoute component={SearchResults} />} />
        <Route path="/carbon" component={() => <ProtectedRoute component={CarbonCalculator} />} />
        <Route path="/marketplace" component={() => <ProtectedRoute component={Marketplace} />} />
        <Route path="/reels" component={() => <ProtectedRoute component={Reels} />} />
        <Route path="/minigames" component={() => <ProtectedRoute component={Minigames} />} />
        <Route path="/user/:id" component={() => <ProtectedRoute component={UserProfile} />} />
        <Route path="/messages" component={() => <ProtectedRoute component={Messages} />} />

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;