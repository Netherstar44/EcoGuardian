import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Components
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

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={Auth} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/create-report" component={CreateReport} />
        <Route path="/community" component={Community} />
        <Route path="/report/:id" component={ReportDetails} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/education" component={Education} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
