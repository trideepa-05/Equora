import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/lib/currency";
import { AppDataProvider } from "@/lib/appData";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PremiumBackground from "@/components/PremiumBackground";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateBill from "./pages/CreateBill";
import Groups from "./pages/Groups";
import Payments from "./pages/Payments";
import Analytics from "./pages/Analytics";
import Ledger from "./pages/Ledger";
import SettleUp from "./pages/SettleUp";
import SettingsPage from "./pages/SettingsPage";
import ScanCode from "./pages/ScanCode";
import BillDetails from "./pages/BillDetails";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <AppDataProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <PremiumBackground>
                <Routes>
                <Route path="/" element={<Splash />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-bill"
                  element={
                    <ProtectedRoute>
                      <CreateBill />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <Groups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ledger"
                  element={
                    <ProtectedRoute>
                      <Ledger />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settle"
                  element={
                    <ProtectedRoute>
                      <SettleUp />
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
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bill/:id"
                  element={
                    <ProtectedRoute>
                      <BillDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scan"
                  element={
                    <ProtectedRoute>
                      <ScanCode />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </PremiumBackground>
            </BrowserRouter>
          </TooltipProvider>
        </AppDataProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
