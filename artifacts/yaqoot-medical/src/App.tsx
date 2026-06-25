import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { DataProvider } from "@/contexts/DataContext";
import AppLayout from "@/layouts/AppLayout";
import PatientList from "@/pages/PatientList";
import PatientProfile from "@/pages/PatientProfile";
import VisitPage from "@/pages/VisitPage";
import SettingsPage from "@/pages/SettingsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import VitalsConfigPage from "@/pages/VitalsConfigPage";
import DataManagementPage from "@/pages/DataManagementPage";
import SystemInfoPage from "@/pages/SystemInfoPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={PatientList} />
        <Route path="/patients/:id" component={PatientProfile} />
        <Route path="/patients/:id/visits/new" component={VisitPage} />
        <Route path="/visits/:visitId" component={VisitPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/settings/analytics" component={AnalyticsPage} />
        <Route path="/settings/vitals" component={VitalsConfigPage} />
        <Route path="/settings/data" component={DataManagementPage} />
        <Route path="/settings/system" component={SystemInfoPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LocaleProvider>
          <DataProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </DataProvider>
        </LocaleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
