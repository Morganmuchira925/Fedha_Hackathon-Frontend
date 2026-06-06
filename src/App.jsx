import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "";
const USER_ID = "demo_user";

const KES = (n) => `KES ${Math.round(n).toLocaleString()}`;

const COLORS = {
  income: "#1D9E75",
  expense: "#D85A30",
  profit: "#378ADD",
  produce: "#1D9E75",
  groceries: "#378ADD",
  transport: "#BA7517",
  livestock: "#7F77DD",
  services: "#D4537E",
  rent: "#D85A30",
  utilities: "#888780",
  other: "#B4B2A9",
};

const CATEGORY_ICONS = {
  produce: "🥬",
  groceries: "🛒",
  transport: "🚗",
  livestock: "🐄",
  services: "🔧",
  rent: "🏠",
  utilities: "💡",
  salary: "💼",
  other: "📦",
};

const SOURCE_ICONS = { voice: "🎙️", receipt_scan: "📸", manual: "✏️" };

function generateData() {
  const categories = ["produce", "groceries", "transport", "livestock", "services", "other"];
  const days = 30;
  const chartData = [];
  const transactions = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toISOString().split("T")[0].slice(5);
    const income = Math.floor(Math.random() * 3200) + 800;
    const expense = Math.floor(Math.random() * 2100) + 400;
    chartData.push({ date: label, income, expenses: expense, profit: income - expense });

    const count = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < count; j++) {
      const type = Math.random() > 0.4 ? "income" : "expense";
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const items = {
        income: ["Tomatoes 2kg", "Sukuma wiki", "Onions 5kg", "Maize flour", "Fish 3kg", "Beans 1kg"],
        expense: ["Transport fare", "Market stall fee", "Electricity bill", "Packaging bags", "Stock purchase"],
      };
      const desc = items[type][Math.floor(Math.random() * items[type].length)];
      transactions.push({
        id: `txn_${i}_${j}`,
        type,
        amount: Math.floor(Math.random() * 1800) + 50,
        description: desc,
        category: cat,
        source: ["voice", "receipt_scan", "manual"][Math.floor(Math.random() * 3)],
        date: label,
      });
    }
  }
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  const catMap = {};
  transactions.forEach((t) => {
    if (!catMap[t.category]) catMap[t.category] = { income: 0, expense: 0 };
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

const initialData = generateData();

function buildHealth(summary) {
  const income = summary?.totalIncome || initialData.totalIncome;
  const netProfit = summary?.netProfit || initialData.netProfit;
  const healthScore = Math.min(100, Math.max(0, Math.round(50 + (income > 0 ? (netProfit / income) * 80 : 0))));
  const healthLabel = healthScore >= 75 ? "Excellent" : healthScore >= 55 ? "Good" : healthScore >= 35 ? "Fair" : "Needs Attention";
  const healthColor = healthScore >= 75 ? "#1D9E75" : healthScore >= 55 ? "#378ADD" : healthScore >= 35 ? "#BA7517" : "#D85A30";
  return { healthScore, healthLabel, healthColor };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: "inline-block" }} />
          <span style={{ color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{p.name}:</span>
          <span style={{ fontWeight: 500 }}>{KES(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function FedhaApp() {
  const [tab, setTab] = useState("dashboard");
  const [chartType, setChartType] = useState("area");
  const [period, setPeriod] = useState("30d");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [parsedTxn, setParsedTxn] = useState(null);
  const [recentTxns, setRecentTxns] = useState(initialData.transactions.slice(0, 8));
  const [scanMode, setScanMode] = useState("idle");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [summary, setSummary] = useState({
    totalIncome: initialData.totalIncome,
    totalExpenses: initialData.totalExpense,
    netProfit: initialData.netProfit,
    profitMargin: Math.round((initialData.netProfit / initialData.totalIncome) * 100),
    transactionCount: initialData.transactions.length,
  });
  const [chartData, setChartData] = useState(initialData.chartData);
  const [pieData, setPieData] = useState(initialData.pieData);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [voiceUploadStatus, setVoiceUploadStatus] = useState("idle");
  const [voiceError, setVoiceError] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUploadStatus, setReceiptUploadStatus] = useState("idle");
  const [receiptScanResult, setReceiptScanResult] = useState(null);
  const [receiptError, setReceiptError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceInputRef = useRef(null);
  const receiptInputRef = useRef(null);

  const { healthScore, healthLabel, healthColor } = buildHealth(summary);
  const profitMargin = summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0;

  const speak = (message, lang = "en-KE") => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = lang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const normalizeTransaction = (t) => ({
    ...t,
    date: t.date || (t.createdAt ? new Date(t.createdAt).toISOString().slice(5, 10) : ""),
    category: t.category || "other",
    source: t.source || "manual",
  });

  const loadDashboard = async () => {
    try {
      const [summaryRes, chartRes, categoriesRes, txnsRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/summary?userId=${USER_ID}&period=${period}`),
        fetch(`${API_BASE}/api/dashboard/chart?userId=${USER_ID}&period=${period}&groupBy=day`),
        fetch(`${API_BASE}/api/dashboard/categories?userId=${USER_ID}&period=${period}`),
        fetch(`${API_BASE}/api/transactions?userId=${USER_ID}&limit=20`),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary || summary);
      }
      if (chartRes.ok) {
        const data = await chartRes.json();
        setChartData((data.chartData || []).map((d) => ({ ...d, profit: d.income - d.expenses })));
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
        setRecentTxns((data.transactions || []).map(normalizeTransaction));
      }
    } catch (error) {
      console.warn("Dashboard API unavailable, using local fallback.", error);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Microphone recording is not supported in this browser.");
      setVoiceStatus("error");
      return;
    }

    setVoiceError(null);
    setParsedTxn(null);
    setVoiceText("");
    setVoiceUploadStatus("recording");
    setVoiceStatus("recording");
    setAudioUrl("");
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setVoiceStatus("parsing");
        await uploadVoiceAudio(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setVoiceError("Could not access the microphone. Please allow microphone permissions and try again.");
      setIsRecording(false);
      setVoiceStatus("error");
      setVoiceUploadStatus("idle");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      setVoiceStatus("idle");
    }
  };

  const uploadVoiceAudio = async (audioFile, fileName = "voice.webm") => {
    setVoiceUploadStatus("uploading");
    setVoiceError(null);

    try {
      const form = new FormData();
      form.append("audio", audioFile, fileName);
      form.append("userId", USER_ID);
      form.append("language", "en");

      const resp = await fetch(`${API_BASE}/api/voice/log`, { method: "POST", body: form });
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
      speak(data.confirmationText || `Saved ${txn.type === "income" ? "income" : "expense"} of KES ${txn.amount}.`);
    } catch (err) {
      console.error(err);
      setVoiceError(err.message || "Could not upload audio. Try again.");
      setVoiceStatus("error");
      setVoiceUploadStatus("error");
    }
  };

  const handleVoiceFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setVoiceError(null);
    setVoiceStatus("parsing");
    await uploadVoiceAudio(file, file.name);
  };

  const uploadReceiptPhoto = async (file) => {
    setReceiptError(null);
    setReceiptScanResult(null);
    setReceiptUploadStatus("loading");

    try {
      const form = new FormData();
      form.append("receipt", file);

      const resp = await fetch(`${API_BASE}/api/receipts/scan`, { method: "POST", body: form });
      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(data.error || data.message || "Receipt upload failed.");
      }

      setReceiptScanResult(data);
      setReceiptUploadStatus("done");
      setReceiptFile(file);
    } catch (err) {
      console.error(err);
      setReceiptError(err.message || "Could not upload receipt. Try another photo.");
      setReceiptUploadStatus("error");
    }
  };

  const handleReceiptFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadReceiptPhoto(file);
  };

  const lookupBarcode = async () => {
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
      setBarcodeResult(data.product || { identified: false, notes: "No product found." });
    } catch (error) {
      setBarcodeResult({ identified: false, notes: "Lookup failed. Check your backend connection." });
    }
    setScanMode("done");
  };

  const fetchInsights = async () => {
    setInsightLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/dashboard/insights?userId=${USER_ID}&period=${period}`);
      const data = await resp.json();
      setInsight(data.insights || { healthLabel, summary: "Stay on top of your cash flow.", insights: [{ type: "tip", message: "Track receipts and voice entries every day." }], recommendation: "Review your top expenses weekly." });
    } catch {
      setInsight({ healthLabel, summary: "Your business is actively generating transactions. Keep tracking consistently.", insights: [{ type: "tip", message: "Log every transaction via voice to build your 90-day financial picture." }], recommendation: "Review your top expense category weekly." });
    }
    setInsightLoading(false);
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)", padding: "0 0 2rem", maxWidth: 700 }}>
      <h2 className="sr-only">Fedha — Financial Health Dashboard for informal traders</h2>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 0 1rem", borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💰</div>
          <div>
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0, color: "var(--color-text-primary)" }}>Fedha</p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>Mama Grace's Shop · June 2026</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ height: 8, width: 8, borderRadius: "50%", background: healthColor }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: healthColor }}>{healthLabel}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {[ ["dashboard", "📊 Dashboard"], ["voice", "🎙️ Voice log"], ["receipts", "📸 Receipts"], ["transactions", "📋 Transactions"] ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: "none", border: "none", padding: "8px 14px", fontSize: 13,
            fontWeight: tab === key ? 500 : 400,
            color: tab === key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            borderBottom: tab === key ? "2px solid #1D9E75" : "2px solid transparent",
            cursor: "pointer", borderRadius: 0, marginBottom: -1
          }}>{label}</button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: "1.25rem" }}>
            {[
              { label: "Total income", value: KES(summary.totalIncome), color: "#1D9E75" },
              { label: "Total expenses", value: KES(summary.totalExpenses), color: "#D85A30" },
              { label: "Net profit", value: KES(summary.netProfit), color: summary.netProfit >= 0 ? "#378ADD" : "#D85A30" },
              { label: "Profit margin", value: `${profitMargin}%`, color: profitMargin >= 20 ? "#1D9E75" : "#BA7517" },
            ].map((c) => (
              <div key={c.label} style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "12px 14px" }}>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>{c.label}</p>
                <p style={{ fontSize: 20, fontWeight: 500, margin: 0, color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "14px 16px", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Financial health score</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: healthColor }}>{healthScore}/100 · {healthLabel}</span>
            </div>
            <div style={{ height: 8, background: "var(--color-background-secondary)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${healthScore}%`, background: healthColor, borderRadius: 4, transition: "width 1s ease" }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--color-text-primary)" }}>Income vs expenses</p>
            <div style={{ display: "flex", gap: 6 }}>
              {["area", "bar"].map((t) => (
                <button key={t} onClick={() => setChartType(t)} style={{
                  background: chartType === t ? "var(--color-background-secondary)" : "none",
                  border: "0.5px solid var(--color-border-tertiary)", borderRadius: 6,
                  padding: "4px 10px", fontSize: 12, cursor: "pointer",
                  color: "var(--color-text-secondary)"
                }}>{t === "area" ? "Area" : "Bar"}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 12, color: "var(--color-text-secondary)" }}>
            {[ ["income", COLORS.income, "—"], ["expense", COLORS.expense, "– –"], ["profit", COLORS.profit, "···"] ].map(([k, c]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 12, height: 3, background: c, display: "inline-block", borderRadius: 2 }} />
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </span>
            ))}
          </div>

          <div style={{ position: "relative", height: 220, marginBottom: "1.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: "#888" }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" stroke={COLORS.income} strokeWidth={2} fill="url(#gi)" dot={false} />
                  <Area type="monotone" dataKey="expenses" stroke={COLORS.expense} strokeWidth={2} fill="url(#ge)" dot={false} strokeDasharray="5 3" />
                  <Area type="monotone" dataKey="profit" stroke={COLORS.profit} strokeWidth={1.5} fill="none" dot={false} strokeDasharray="2 2" />
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: "#888" }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" fill={COLORS.income} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses" fill={COLORS.expense} radius={[2, 2, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "var(--color-text-primary)" }}>Category breakdown</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.5rem" }}>
            <div style={{ position: "relative", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name] || COLORS.other} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => KES(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
              {pieData.slice(0, 5).map((p) => {
                const pct = Math.round((p.value / (summary.totalIncome + summary.totalExpenses || 1)) * 100);
                return (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[p.name] || COLORS.other, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)", flex: 1, textTransform: "capitalize" }}>
                      {CATEGORY_ICONS[p.name]} {p.name}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>✨ AI insights</p>
              {!insight && (
                <button onClick={fetchInsights} disabled={insightLoading} style={{
                  background: "none", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6,
                  padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "var(--color-text-secondary)"
                }}>{insightLoading ? "Analyzing..." : "Generate ↗"}</button>
              )}
            </div>
            {!insight && !insightLoading && (
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                Get a personalized financial health analysis powered by Gemini AI.
              </p>
            )}
            {insightLoading && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Gemini is analyzing your transactions...</span>
              </div>
            )}
            {insight && (
              <div>
                <p style={{ fontSize: 13, color: "var(--color-text-primary)", marginBottom: 10 }}>{insight.summary}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {insight.insights?.map((ins, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 8, padding: "8px 10px", borderRadius: 8,
                      background: ins.type === "positive" ? "#EAF3DE" : ins.type === "warning" ? "#FAEEDA" : "#E6F1FB",
                      fontSize: 12,
                      color: ins.type === "positive" ? "#3B6D11" : ins.type === "warning" ? "#854F0B" : "#185FA5"
                    }}>
                      <span>{ins.type === "positive" ? "✅" : ins.type === "warning" ? "⚠️" : "💡"}</span>
                      {ins.message}
                    </div>
                  ))}
                </div>
                {insight.recommendation && (
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 10, marginBottom: 0, fontStyle: "italic" }}>
                    Tip: {insight.recommendation}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "voice" && (
        <div>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
            Record a voice transaction or upload an audio clip. Gemini will parse and save it automatically.
          </p>

          <div style={{ display: "grid", gap: 16, marginBottom: "1.5rem" }}>
            <div style={{ background: "var(--color-background-secondary)", borderRadius: 12, padding: "16px", border: "0.5px solid var(--color-border-tertiary)" }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 10px", color: "var(--color-text-primary)" }}>Voice transaction</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  style={{
                    minWidth: 180,
                    height: 46,
                    borderRadius: 14,
                    background: isRecording ? "#D85A30" : "#1D9E75",
                    border: "none",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: isRecording ? "0 16px 34px rgba(216,90,48,0.22)" : "0 16px 34px rgba(29,158,117,0.18)",
                  }}
                >
                  {isRecording ? "⏹ Stop recording" : "🎙️ Record audio"}
                </button>
                <label style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 180,
                  height: 46,
                  borderRadius: 14,
                  background: "#fff",
                  border: "1px solid var(--color-border-tertiary)",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  textAlign: "center",
                }}>
                  Upload audio file
                  <input
                    ref={voiceInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleVoiceFileChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 12 }}>
                {voiceStatus === "idle" && "Tap record or upload an audio clip to parse a transaction."}
                {voiceStatus === "recording" && "🔴 Recording… tap stop when finished."}
                {voiceStatus === "parsing" && "✨ Sending audio to Gemini for parsing..."}
                {voiceStatus === "saved" && "✅ Transaction recognized and saved."}
                {voiceStatus === "error" && "⚠️ Something went wrong. Try again or upload a clearer clip."}
              </p>
            </div>

            {voiceError && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 14px", color: "#B91C1C" }}>
                {voiceError}
              </div>
            )}

            {audioUrl && (
              <div style={{ background: "var(--color-background-primary)", borderRadius: 12, padding: "14px 16px", border: "0.5px solid var(--color-border-tertiary)" }}>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>Recorded audio preview</p>
                <audio controls src={audioUrl} style={{ width: "100%" }} />
              </div>
            )}
          </div>

          {parsedTxn && (
            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, padding: "18px 20px", marginBottom: "1rem" }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px", color: "var(--color-text-primary)" }}>Saved transaction</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  ["Type", parsedTxn.type === "income" ? "✅ Income" : "📤 Expense"],
                  ["Amount", KES(parsedTxn.amount)],
                  ["Category", `${CATEGORY_ICONS[parsedTxn.category] || "📦"} ${parsedTxn.category}`],
                  ["Source", SOURCE_ICONS[parsedTxn.source] || parsedTxn.source],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "var(--color-background-secondary)", borderRadius: 12, padding: "12px" }}>
                    <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>{k}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "var(--color-text-primary)" }}>{v}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Description</p>
              <p style={{ fontSize: 14, margin: 0, color: "var(--color-text-primary)", fontStyle: "italic" }}>{parsedTxn.description}</p>
            </div>
          )}
        </div>
      )}

      {tab === "receipts" && (
        <div>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
            Scan a receipt photo or look up a product barcode. Gemini Vision extracts all transaction data automatically.
          </p>

          <div style={{
            background: "linear-gradient(180deg, rgba(55,133,221,0.12) 0%, rgba(255,255,255,0.82) 100%)",
            border: "1.5px dashed rgba(56,189,248,0.4)",
            borderRadius: 16,
            padding: "2rem",
            textAlign: "center",
            marginBottom: "1.5rem"
          }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>📸</div>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px", color: "var(--color-text-primary)" }}>Upload receipt photo</p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 18px" }}>JPG, PNG, WEBP up to 10MB</p>
            <button
              onClick={() => receiptInputRef.current?.click()}
              style={{
                background: "#2563EB",
                border: "none",
                borderRadius: 12,
                padding: "10px 22px",
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Choose photo
            </button>
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleReceiptFileChange}
            />
            <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 14 }}>
              Gemini Vision will extract vendor, items, prices, and barcodes.
            </p>
          </div>

          {receiptError && (
            <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 12, padding: "12px 14px", color: "#92400E", marginBottom: "1rem" }}>
              {receiptError}
            </div>
          )}

          {receiptScanResult && (
            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, padding: "18px 20px", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px", color: "var(--color-text-primary)" }}>Receipt scan</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ background: "var(--color-background-secondary)", borderRadius: 12, padding: "12px" }}>
                  <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Vendor</p>
                  <p style={{ fontSize: 14, margin: 0, color: "var(--color-text-primary)" }}>{receiptScanResult.parsed?.vendor || "Unknown"}</p>
                </div>
                <div style={{ background: "var(--color-background-secondary)", borderRadius: 12, padding: "12px" }}>
                  <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Total</p>
                  <p style={{ fontSize: 14, margin: 0, color: "var(--color-text-primary)" }}>{receiptScanResult.parsed?.total != null ? KES(receiptScanResult.parsed.total) : "Unknown"}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--color-text-secondary)" }}>
                <div style={{ flex: "1 1 150px", background: "var(--color-background-secondary)", borderRadius: 12, padding: "12px" }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text-primary)" }}>{receiptScanResult.barcodeCount || 0}</p>
                  <p style={{ margin: 0 }}>Barcode results</p>
                </div>
                <div style={{ flex: "1 1 150px", background: "var(--color-background-secondary)", borderRadius: 12, padding: "12px" }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text-primary)" }}>{receiptScanResult.parsed?.lineItems?.length || 0}</p>
                  <p style={{ margin: 0 }}>Line items</p>
                </div>
                <div style={{ flex: "1 1 150px", background: "var(--color-background-secondary)", borderRadius: 12, padding: "12px" }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text-primary)" }}>{receiptScanResult.parsed?.date || "-"}</p>
                  <p style={{ margin: 0 }}>Date</p>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 10px" }}>🔍 Barcode product lookup</p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 12px" }}>
              Enter a barcode number to identify a product. Works with EAN-13, EAN-8, Code-128.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="e.g. 6141234567890"
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13, border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }}
                onKeyDown={(e) => e.key === "Enter" && lookupBarcode()}
              />
              <button onClick={lookupBarcode} disabled={scanMode === "loading" || !barcodeInput.trim()} style={{
                background: "#378ADD", border: "none", borderRadius: 8, padding: "8px 16px",
                color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500
              }}>{scanMode === "loading" ? "..." : "Look up"}</button>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[ ["6141234567890", "Brookside Milk"], ["6141000000001", "Unga Maize"], ["5000159407236", "Nescafé"] ].map(([code, label]) => (
                <button key={code} onClick={() => setBarcodeInput(code)} style={{
                  background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: 20, padding: "4px 10px", fontSize: 11, cursor: "pointer",
                  color: "var(--color-text-secondary)"
                }}>{label}</button>
              ))}
            </div>

            {barcodeResult && (
              <div style={{
                background: barcodeResult.identified ? "#EAF3DE" : "var(--color-background-secondary)",
                borderRadius: 10, padding: "12px 14px"
              }}>
                {barcodeResult.identified ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#27500A" }}>{barcodeResult.productName}</p>
                      <span style={{ fontSize: 11, background: "#C0DD97", color: "#27500A", padding: "2px 8px", borderRadius: 20 }}>Identified</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, color: "#3B6D11" }}>
                      {barcodeResult.brand && <span>Brand: <strong>{barcodeResult.brand}</strong></span>}
                      {barcodeResult.category && <span>Category: <strong>{barcodeResult.category}</strong></span>}
                      {barcodeResult.typicalPriceKES != null && <span>Typical price: <strong>KES {barcodeResult.typicalPriceKES}</strong></span>}
                    </div>
                    {barcodeResult.notes && <p style={{ fontSize: 12, color: "#3B6D11", marginTop: 6, marginBottom: 0 }}>{barcodeResult.notes}</p>}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                    ⚠️ Product not identified. {barcodeResult.notes || "Try a different barcode."}
                  </p>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: "1rem", padding: "12px 14px", background: "var(--color-background-secondary)", borderRadius: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 500, margin: "0 0 8px", color: "var(--color-text-primary)" }}>Supported barcode types</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 12, color: "var(--color-text-secondary)" }}>
              {[ ["EAN-13", "Global retail (614 = Kenya)"], ["EAN-8", "Compact products"], ["Code-128", "Logistics, invoices"], ["QR Code", "Digital receipts"] ].map(([t, d]) => (
                <div key={t}>
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{t}</span> — {d}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "transactions" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{recentTxns.length} transactions</p>
            <div style={{ display: "flex", gap: 6 }}>
              {["All", "Income", "Expense"].map((f) => (
                <button key={f} style={{
                  background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: 20, padding: "4px 12px", fontSize: 12, cursor: "pointer", color: "var(--color-text-secondary)"
                }}>{f}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentTxns.map((t) => (
              <div key={t.id || t._id} style={{
                background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: t.type === "income" ? "#EAF3DE" : "#FAECE7",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
                }}>
                  {CATEGORY_ICONS[t.category] || "📦"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 2px", color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</p>
                  <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0, textTransform: "capitalize" }}>
                    {SOURCE_ICONS[t.source]} {t.source.replace("_", " ")} · {t.category} · {t.date}
                  </p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0, flexShrink: 0, color: t.type === "income" ? "#1D9E75" : "#D85A30" }}>
                  {t.type === "income" ? "+" : "−"}{KES(t.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }
        button:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}
