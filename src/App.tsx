import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import Index from "./pages/Index";
import TeamPage from "./pages/TeamPage";
import CentersPage from "./pages/CentersPage";
import SchedulePage from "./pages/SchedulePage";
import OperationsPage from "./pages/OperationsPage";
import RestrictionsPage from "./pages/RestrictionsPage";
import NotificationsPage from "./pages/NotificationsPage";
import MonthlySummaryPage from "./pages/MonthlySummaryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DataProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/centers" element={<CentersPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/restrictions" element={<RestrictionsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/monthly-summary" element={<MonthlySummaryPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
