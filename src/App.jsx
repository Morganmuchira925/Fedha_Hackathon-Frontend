import { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useConvexAuth } from "convex/react"; 
import { useAuth } from "@clerk/clerk-react";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import VoiceLogPage from "./pages/VoiceLogPage";
import ReceiptsPage from "./pages/ReceiptsPage";
import TransactionsPage from "./pages/TransactionsPage";
import AuthPage from "./pages/AuthPage";
import { generateData } from "./utils";
import "./App.css";

// Generate mock data once outside component scope to prevent resetting on re-renders
const initialData = generateData();

// The gate component protects paths starting with /dashboard
function ProtectedLayout({ darkMode, setDarkMode, summary }) {
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();

  if (!clerkLoaded || convexLoading) {
    return (
      <div 
        className="loading-spinner-container" 
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <p>Loading Fedha...</p>
      </div>
    );
  }

  // If unauthorized, bounce them back to the root landing page (/)
  if (!isSignedIn || !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      summary={summary}
      initialData={initialData}
    >
      <Outlet />
    </Layout>
  );
}

// Redirect wrapper for authenticated users attempting to access the landing/auth page
function AuthRouteWrapper() {
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();

  if (!clerkLoaded || convexLoading) {
    return null; // Let the core loading boundary handle it, or keep layout blank briefly
  }

  if (isSignedIn && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthPage />;
}

export default function FedhaApp() {
  const [darkMode, setDarkMode] = useState(true);

  // Memoize summary calculations so changing the dark mode theme state 
  // doesn't trigger heavy mathematical loops or sub-array sweeps.
  const summary = useMemo(() => {
    const totalIncome = initialData.totalIncome || 0;
    const netProfit = initialData.netProfit || 0;
    
    return {
      totalIncome,
      totalExpenses: initialData.totalExpense || 0,
      netProfit,
      profitMargin: totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0,
      transactionCount: initialData.transactions?.length || 0,
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Root Auth Page with built-in authenticated-user bypass */}
        <Route path="/" element={<AuthRouteWrapper />} />

        {/* 2. Protected App space under the /dashboard sub-path */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              summary={summary}
            />
          }
        >
          {/* Sub-paths rendering cleanly into the Layout's <Outlet /> */}
          <Route index element={<DashboardPage />} />
          <Route path="voice" element={<VoiceLogPage />} />
          <Route path="receipts" element={<ReceiptsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
        </Route>

        {/* Fallback redirect for broken paths safely defaults to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}