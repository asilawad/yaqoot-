import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { DataProvider } from "@/contexts/DataContext";
import AppLayout from "@/layouts/AppLayout";
import HomePage from "@/pages/HomePage";
import PatientList from "@/pages/PatientList";
import PatientProfile from "@/pages/PatientProfile";
import VisitPage from "@/pages/VisitPage";
import SettingsPage from "@/pages/SettingsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import VitalsConfigPage from "@/pages/VitalsConfigPage";
import DataManagementPage from "@/pages/DataManagementPage";
import SystemInfoPage from "@/pages/SystemInfoPage";
import NotFound from "@/pages/not-found";
import ExitGuardModal from "@/components/ExitGuardModal";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/patients" component={PatientList} />
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
  const [showExitGuard, setShowExitGuard] = useState(false);
  const isExiting = useRef(false);

  useEffect(() => {
    const isTauri = typeof window !== "undefined" &&
      Boolean((window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
    if (!isTauri) return;

    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | undefined;
    let disposed = false;

    appWindow.onCloseRequested(async event => {
      if (isExiting.current) return;
      event.preventDefault();
      setShowExitGuard(true);
    }).then(stopListening => {
      if (disposed) stopListening();
      else unlisten = stopListening;
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  const exitApplication = async () => {
    isExiting.current = true;
    setShowExitGuard(false);
    await getCurrentWindow().destroy();
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LocaleProvider>
            <DataProvider>
              <WouterRouter hook={useHashLocation}>
                <Router />
              </WouterRouter>
              <Toaster />
              <ExitGuardModal
                open={showExitGuard}
                onCancel={() => setShowExitGuard(false)}
                onExit={exitApplication}
              />
            </DataProvider>
          </LocaleProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
