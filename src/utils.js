import { COLORS, CATEGORY_ICONS, SOURCE_ICONS, API_BASE, USER_ID, KES } from "./constants";
import { Package, FileText } from "lucide-react";

export function generateData() {
  const categories = [
    "produce",
    "groceries",
    "transport",
    "livestock",
    "services",
    "other",
  ];
  const days = 30;
  const chartData = [];
  const transactions = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toISOString().split("T")[0].slice(5);
    const income = Math.floor(Math.random() * 3200) + 800;
    const expense = Math.floor(Math.random() * 2100) + 400;
    chartData.push({
      date: label,
      income,
      expenses: expense,
      profit: income - expense,
    });

    const count = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < count; j++) {
      const type = Math.random() > 0.4 ? "income" : "expense";
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const items = {
        income: [
          "Tomatoes 2kg",
          "Sukuma wiki",
          "Onions 5kg",
          "Maize flour",
          "Fish 3kg",
          "Beans 1kg",
        ],
        expense: [
          "Transport fare",
          "Market stall fee",
          "Electricity bill",
          "Packaging bags",
          "Stock purchase",
        ],
      };
      const desc =
        items[type][Math.floor(Math.random() * items[type].length)];
      transactions.push({
        id: `txn_${i}_${j}`,
        type,
        amount: Math.floor(Math.random() * 1800) + 50,
        description: desc,
        category: cat,
        source: ["voice", "receipt_scan", "manual"][
          Math.floor(Math.random() * 3)
        ],
        date: label,
      });
    }
  }
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  const catMap = {};
  transactions.forEach((t) => {
    if (!catMap[t.category])
      catMap[t.category] = { income: 0, expense: 0 };
    catMap[t.category][t.type] += t.amount;
  });

  const pieData = Object.entries(catMap)
    .map(([name, v]) => ({
      name,
      value: v.income + v.expense,
      income: v.income,
      expense: v.expense,
    }))
    .sort((a, b) => b.value - a.value);

  const totalIncome = chartData.reduce((s, d) => s + d.income, 0);
  const totalExpense = chartData.reduce((s, d) => s + d.expenses, 0);
  const netProfit = totalIncome - totalExpense;

  return { chartData, transactions, pieData, totalIncome, totalExpense, netProfit };
}

export function buildHealth(summary, initialData) {
  const income = summary?.totalIncome || initialData.totalIncome;
  const netProfit = summary?.netProfit || initialData.netProfit;
  const healthScore = Math.min(
    100,
    Math.max(0, Math.round(50 + (income > 0 ? (netProfit / income) * 80 : 0)))
  );
  const healthLabel =
    healthScore >= 75
      ? "Excellent"
      : healthScore >= 55
        ? "Good"
        : healthScore >= 35
          ? "Fair"
          : "Needs Attention";
  const healthColor =
    healthScore >= 75
      ? "#1D9E75"
      : healthScore >= 55
        ? "#378ADD"
        : healthScore >= 35
          ? "#BA7517"
          : "#D85A30";
  return { healthScore, healthLabel, healthColor };
}

export function normalizeTransaction(t) {
  return {
    ...t,
    date:
      t.date ||
      (t.createdAt ? new Date(t.createdAt).toISOString().slice(5, 10) : ""),
    category: t.category || "other",
    source: t.source || "manual",
  };
}

export function renderCategoryIcon(category, className = "w-4 h-4") {
  const IconComponent = CATEGORY_ICONS[category] || Package;
  return IconComponent;
}

export function renderSourceIcon(source, className = "w-3.5 h-3.5") {
  const IconComponent = SOURCE_ICONS[source] || FileText;
  return IconComponent;
}

export function speak(message, lang = "en-KE") {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = lang;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export async function loadDashboard(
  period,
  setSummary,
  setChartData,
  setPieData,
  setRecentTxns,
  initialData
) {
  try {
    const [summaryRes, chartRes, categoriesRes, txnsRes] = await Promise.all([
      fetch(`${API_BASE}/api/dashboard/summary?userId=${USER_ID}&period=${period}`),
      fetch(`${API_BASE}/api/dashboard/chart?userId=${USER_ID}&period=${period}&groupBy=day`),
      fetch(`${API_BASE}/api/dashboard/categories?userId=${USER_ID}&period=${period}`),
      fetch(`${API_BASE}/api/transactions?userId=${USER_ID}&limit=20`),
    ]);

    if (summaryRes.ok) {
      const data = await summaryRes.json();
      setSummary(data.summary || initialData);
    }
    if (chartRes.ok) {
      const data = await chartRes.json();
      setChartData(
        (data.chartData || []).map((d) => ({
          ...d,
          profit: d.income - d.expenses,
        }))
      );
    }
    if (categoriesRes.ok) {
      const data = await categoriesRes.json();
      const categories = (data.categories || []).map((cat) => ({
        name: cat.category,
        value: cat.income + cat.expenses,
        income: cat.income,
        expense: cat.expenses,
      }));
      setPieData(categories.length ? categories : initialData.pieData);
    }
    if (txnsRes.ok) {
      const data = await txnsRes.json();
      setRecentTxns(
        (data.transactions || []).map(normalizeTransaction)
      );
    }
  } catch (error) {
    console.warn("Dashboard API unavailable, using local fallback.", error);
  }
}

export async function uploadVoiceAudio(
  audioFile,
  fileName,
  setParsedTxn,
  setVoiceText,
  setRecentTxns,
  setVoiceStatus,
  setVoiceUploadStatus,
  setVoiceError
) {
  setVoiceUploadStatus("uploading");
  setVoiceError(null);

  try {
    const form = new FormData();
    form.append("audio", audioFile, fileName);
    form.append("userId", USER_ID);
    form.append("language", "en");

    const resp = await fetch(`${API_BASE}/api/voice/log`, {
      method: "POST",
      body: form,
    });
    const data = await resp.json();

    if (!resp.ok || !data.success) {
      throw new Error(data.error || data.message || "Voice upload failed.");
    }

    const txn = normalizeTransaction(data.transaction || {});
    setParsedTxn(txn);
    setVoiceText(data.transcript || "");
    setRecentTxns((prev) => [txn, ...prev.slice(0, 7)]);
    setVoiceStatus("saved");
    setVoiceUploadStatus("done");
    speak(
      data.confirmationText ||
        `Saved ${txn.type === "income" ? "income" : "expense"} of KES ${txn.amount}.`
    );
  } catch (err) {
    console.error(err);
    setVoiceError(err.message || "Could not upload audio. Try again.");
    setVoiceStatus("error");
    setVoiceUploadStatus("error");
  }
}

export async function uploadReceiptPhoto(
  file,
  setReceiptError,
  setReceiptScanResult,
  setReceiptUploadStatus,
  setReceiptFile
) {
  setReceiptError(null);
  setReceiptScanResult(null);
  setReceiptUploadStatus("loading");

  try {
    const form = new FormData();
    form.append("receipt", file);

    const resp = await fetch(`${API_BASE}/api/receipts/scan`, {
      method: "POST",
      body: form,
    });
    const data = await resp.json();

    if (!resp.ok || !data.success) {
      throw new Error(data.error || data.message || "Receipt upload failed.");
    }

    setReceiptScanResult(data);
    setReceiptUploadStatus("done");
    setReceiptFile(file);
  } catch (err) {
    console.error(err);
    setReceiptError(
      err.message || "Could not upload receipt. Try another photo."
    );
    setReceiptUploadStatus("error");
  }
}

export async function lookupBarcode(
  barcodeInput,
  setScanMode,
  setBarcodeResult
) {
  if (!barcodeInput.trim()) return;
  setScanMode("loading");
  setBarcodeResult(null);

  try {
    const resp = await fetch(`${API_BASE}/api/receipts/barcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: barcodeInput.trim(), symbology: "EAN-13" }),
    });
    const data = await resp.json();
    setBarcodeResult(data.product || {
      identified: false,
      notes: "No product found.",
    });
  } catch (error) {
    setBarcodeResult({
      identified: false,
      notes: "Lookup failed. Check your backend connection.",
    });
  }
  setScanMode("done");
}

export async function fetchInsights(
  period,
  setInsightLoading,
  setInsight,
  healthLabel
) {
  setInsightLoading(true);
  try {
    const resp = await fetch(
      `${API_BASE}/api/dashboard/insights?userId=${USER_ID}&period=${period}`
    );
    const data = await resp.json();
    setInsight(
      data.insights || {
        healthLabel,
        summary: "Stay on top of your cash flow.",
        insights: [
          {
            type: "tip",
            message: "Track receipts and voice entries every day.",
          },
        ],
        recommendation: "Review your top expenses weekly.",
      }
    );
  } catch {
    setInsight({
      healthLabel,
      summary:
        "Your business is actively generating transactions. Keep tracking consistently.",
      insights: [
        {
          type: "tip",
          message: "Log every transaction via voice to build your 90-day financial picture.",
        },
      ],
      recommendation: "Review your top expense category weekly.",
    });
  }
  setInsightLoading(false);
}
