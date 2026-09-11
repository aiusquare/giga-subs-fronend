import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ServiceGuard } from "@/components/ServiceGuard";
import { NotificationPopup } from "@/components/NotificationPopup";
import { isServiceEnabled } from "@/lib/serviceConfig";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import DataPage from "./pages/DataPage";
import AirtimePage from "./pages/AirtimePage";
import ElectricityPage from "./pages/ElectricityPage";
import CablePage from "./pages/CablePage";
import BillsPage from "./pages/BillsPage";
import MorePage from "./pages/MorePage";
import ScratchCardPage from "./pages/ScratchCardPage";
import ResultCheckerPage from "./pages/ResultCheckerPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import ApiPage from "./pages/ApiPage";
import ApiDocsPage from "./pages/ApiDocsPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import ContactPage from "./pages/ContactPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ChangePinPage from "./pages/ChangePinPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import TwoFactorPage from "./pages/TwoFactorPage";
import SupportTicketsPage from "./pages/SupportTicketsPage";
import BvnVerificationPage from "./pages/BvnVerificationPage";
import NinVerificationPage from "./pages/NinVerificationPage";
import NinSlipDownloadPage from "./pages/NinSlipDownloadPage";
import IdentityUpdatesPage from "./pages/IdentityUpdatesPage";

const queryClient = new QueryClient();

function AuthenticatedNotifications() {
  const { user } = useAuth();
  const location = useLocation();

  // Only show on authenticated pages (not on /, /auth, or unknown pages)
  if (!user || location.pathname === "/" || location.pathname === "/auth") {
    return null;
  }

  return <NotificationPopup />;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthenticatedNotifications />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                {isServiceEnabled("data") && (
                  <Route
                    path="/data"
                    element={
                      <ProtectedRoute>
                        <ServiceGuard serviceType="data">
                          <DataPage />
                        </ServiceGuard>
                      </ProtectedRoute>
                    }
                  />
                )}
                {isServiceEnabled("airtime") && (
                  <Route
                    path="/airtime"
                    element={
                      <ProtectedRoute>
                        <ServiceGuard serviceType="airtime">
                          <AirtimePage />
                        </ServiceGuard>
                      </ProtectedRoute>
                    }
                  />
                )}
                {isServiceEnabled("electricity") && (
                  <Route
                    path="/electricity"
                    element={
                      <ProtectedRoute>
                        <ServiceGuard serviceType="electricity">
                          <ElectricityPage />
                        </ServiceGuard>
                      </ProtectedRoute>
                    }
                  />
                )}
                {isServiceEnabled("cable") && (
                  <Route
                    path="/cable"
                    element={
                      <ProtectedRoute>
                        <ServiceGuard serviceType="cable">
                          <CablePage />
                        </ServiceGuard>
                      </ProtectedRoute>
                    }
                  />
                )}
                {isServiceEnabled("bills") && (
                  <Route
                    path="/bills"
                    element={
                      <ProtectedRoute>
                        <ServiceGuard serviceType="bills">
                          <BillsPage />
                        </ServiceGuard>
                      </ProtectedRoute>
                    }
                  />
                )}
                <Route
                  path="/more"
                  element={
                    <ProtectedRoute>
                      <MorePage />
                    </ProtectedRoute>
                  }
                />
                {isServiceEnabled("scratch_card") && (
                  <Route
                    path="/scratch-card"
                    element={
                      <ProtectedRoute>
                        <ScratchCardPage />
                      </ProtectedRoute>
                    }
                  />
                )}
                {isServiceEnabled("result_checker") && (
                  <Route
                    path="/result-checker"
                    element={
                      <ProtectedRoute>
                        <ServiceGuard serviceType="result_checker">
                          <ResultCheckerPage />
                        </ServiceGuard>
                      </ProtectedRoute>
                    }
                  />
                )}
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                {isServiceEnabled("api_access") && (
                  <Route
                    path="/api"
                    element={
                      <ProtectedRoute>
                        <ApiPage />
                      </ProtectedRoute>
                    }
                  />
                )}
                {isServiceEnabled("api_access") && (
                  <Route
                    path="/api/docs"
                    element={
                      <ProtectedRoute>
                        <ApiDocsPage />
                      </ProtectedRoute>
                    }
                  />
                )}
                <Route
                  path="/help"
                  element={
                    <ProtectedRoute>
                      <HelpCenterPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <ProtectedRoute>
                      <ContactPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route
                  path="/change-pin"
                  element={
                    <ProtectedRoute>
                      <ChangePinPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute>
                      <ChangePasswordPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/2fa"
                  element={
                    <ProtectedRoute>
                      <TwoFactorPage />
                    </ProtectedRoute>
                  }
                />
                {isServiceEnabled("support_tickets") && (
                  <Route
                    path="/tickets"
                    element={
                      <ProtectedRoute>
                        <SupportTicketsPage />
                      </ProtectedRoute>
                    }
                  />
                )}
                {isServiceEnabled("identity_update") && (
                  <Route
                    path="/identity-updates"
                    element={
                      <ProtectedRoute>
                        <ServiceGuard serviceType="identity_update">
                          <IdentityUpdatesPage />
                        </ServiceGuard>
                      </ProtectedRoute>
                    }
                  />
                )}
                {isServiceEnabled("bvn_verification") && (
                  <Route
                    path="/bvn-verification"
                    element={
                      <ProtectedRoute>
                        <ServiceGuard serviceType="bvn_verification">
                          <BvnVerificationPage />
                        </ServiceGuard>
                      </ProtectedRoute>
                    }
                  />
                )}
                {isServiceEnabled("nin_verification") && (
                  <Route
                    path="/nin-verification"
                    element={
                      <ProtectedRoute>
                        <ServiceGuard serviceType="nin_verification">
                          <NinVerificationPage />
                        </ServiceGuard>
                      </ProtectedRoute>
                    }
                  />
                )}
                {isServiceEnabled("nin_slip_download") && (
                  <Route
                    path="/nin-slip-download"
                    element={
                      <ProtectedRoute>
                        <ServiceGuard serviceType="nin_slip_download">
                          <NinSlipDownloadPage />
                        </ServiceGuard>
                      </ProtectedRoute>
                    }
                  />
                )}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
