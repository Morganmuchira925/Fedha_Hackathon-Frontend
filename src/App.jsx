import { useState, useMemo, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useAuth, useUser } from "@clerk/clerk-react";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import VoiceLogPage from "./pages/VoiceLogPage";
import ReceiptsPage from "./pages/ReceiptsPage";
import TransactionsPage from "./pages/TransactionsPage";
import AuthPage from "./pages/AuthPage";
import { generateData } from "./utils";
import { API_BASE } from "./constants";
import "./App.css";

const initialData = generateData();

function ProtectedLayout({ darkMode, setDarkMode, summary }) {
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const { isLoaded: clerkLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  // ── Sync Clerk user into Convex on first login ──────────────────────────
  // Fires once when auth resolves. Creates or updates the users table row.
  // This is what connects the Clerk identity to all Convex data writes.
  useEffect(() => {
    if (!isAuthenticated || !isSignedIn || !user) return;

    getToken().then((token) => {
      fetch(`${API_BASE}/api/auth/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language: "en", currency: "KES" }),
      }).catch((err) => console.warn("[Fedha] User sync failed:", err));
    });
  }, [isAuthenticated, isSignedIn, user?.id]);
  // ────────────────────────────────────────────────────────────────────────

  if (!clerkLoaded || convexLoading) {
    return (
      <div
        className="loading-spinner-container"
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <p>Loading Fedha...</p>
      </div>
    );
  }

  if (!isSignedIn || !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout darkMode={darkMode} setDarkMode={setDarkMode} summary={summary} initialData={initialData}>
      <Outlet />
    </Layout>
  );
}

function AuthRouteWrapper() {
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();

  if (!clerkLoaded || convexLoading) return null;

  if (isSignedIn && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthPage />;
}

export default function FedhaApp() {
  const [darkMode, setDarkMode] = useState(true);

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
        <Route path="/" element={<AuthRouteWrapper />} />
        <Route
          path="/dashboard"
          element={<ProtectedLayout darkMode={darkMode} setDarkMode={setDarkMode} summary={summary} />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="voice" element={<VoiceLogPage />} />
          <Route path="receipts" element={<ReceiptsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}