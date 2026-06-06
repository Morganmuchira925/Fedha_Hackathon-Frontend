import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import VoiceLogPage from "./pages/VoiceLogPage";
import ReceiptsPage from "./pages/ReceiptsPage";
import TransactionsPage from "./pages/TransactionsPage";
import { generateData } from "./utils";
import "./App.css";

const initialData = generateData();

export default function FedhaApp() {
  const [darkMode, setDarkMode] = useState(true);
  const [summary, setSummary] = useState({
    totalIncome: initialData.totalIncome,
    totalExpenses: initialData.totalExpense,
    netProfit: initialData.netProfit,
    profitMargin: Math.round(
      (initialData.netProfit / initialData.totalIncome) * 100
    ),
    transactionCount: initialData.transactions.length,
  });

  return (
    <BrowserRouter>
      <Layout
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        summary={summary}
        initialData={initialData}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/voice" element={<VoiceLogPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
