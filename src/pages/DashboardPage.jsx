import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Info,
  EyeOff,
  PlusCircle,
  Database,
} from "lucide-react";
import { COLORS, KES } from "../constants";
import {
  generateData,
  buildHealth,
  loadDashboard,
  fetchInsights,
  renderCategoryIcon,
} from "../utils";
import { useAuth } from "@clerk/clerk-react";

const initialData = generateData();

const zeroStateData = {
  totalIncome: 0,
  totalExpense: 0,
  netProfit: 0,
  chartData: [],
  pieData: [],
  transactions: []
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-secondary)",
      border: "0.03125rem solid var(--border-color)",
      borderRadius: "0.5rem",
      padding: "0.625rem 0.875rem",
      fontSize: "0.8125rem",
      boxShadow: "0 0.25rem 0.75rem rgba(0,0,0,0.15)",
    }}>
      <p style={{
        color: "var(--text-secondary)",
        marginBottom: "0.375rem",
        marginTop: 0,
      }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          marginBottom: "0.1875rem",
        }}>
          <span style={{
            width: "0.5rem",
            height: "0.5rem",
            borderRadius: "0.125rem",
            background: p.color,
            display: "inline-block",
          }} />
          <span style={{
            color: "var(--text-secondary)",
            textTransform: "capitalize",
          }}>{p.name}:</span>
          <span style={{
            fontWeight: 500,
            color: "var(--text-primary)",
          }}>{KES(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// --- REPLACED BROKEN VIDEO WITH A STABLE HIGH-PERFORMANCE MESH GRAPHIC ---
const IllustrationBanner = () => {
  return (
    <div style={{
      width: "100%",
      height: "14rem", 
      borderRadius: "0.875rem",
      overflow: "hidden",
      position: "relative",
      marginBottom: "1.5rem",
      border: "1px solid var(--border-color)",
      // Generates a rich modern data-visualization thematic texture natively via CSS
      background: "radial-gradient(circle at 80% 20%, rgba(29, 158, 117, 0.15), transparent 45%), radial-gradient(circle at 15% 85%, rgba(55, 138, 221, 0.12), transparent 50%), var(--bg-secondary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      
      {/* Grid Pattern Background Overlay to Simulate Telemetry Interface */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.04,
        backgroundImage: "linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)",
        backgroundSize: "20px 20px"
      }} />

      {/* Decorative Blur Spheres */}
      <div style={{
        position: "absolute",
        top: "20%", right: "10%",
        width: "12rem", height: "12rem",
        background: "rgba(55, 138, 221, 0.2)",
        filter: "blur(60px)",
        borderRadius: "50%"
      }} />

      {/* Overlaid Decorative Content Left-Aligned */}
      <div style={{
        position: "absolute",
        left: "1.5rem",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 2,
        pointerEvents: "none"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.5rem", 
          color: "#1D9E75", 
          fontSize: "0.75rem", 
          fontWeight: 700, 
          textTransform: "uppercase", 
          letterSpacing: "0.05em", 
          marginBottom: "0.25rem" 
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1D9E75" }} />
          Engine Core Active
        </div>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>Continuous Ledger Stream</h2>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Algorithmic processing overview</p>
      </div>
      
      <div style={{
        position: "absolute",
        bottom: "1rem", right: "1.5rem",
        background: "var(--bg-primary)",
        border: "1px solid var(--border-color)",
        padding: "0.375rem 1rem",
        borderRadius: "2rem",
        fontWeight: 600,
        fontSize: "0.75rem",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        boxShadow: "0 0.125rem 0.5rem rgba(0,0,0,0.05)",
        zIndex: 2
      }}>
        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        Live Dynamics
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [chartType, setChartType] = useState("area");
  const [period, setPeriod] = useState("30d");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [insightError, setInsightError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { getToken } = useAuth();
  
  const [dashboardState, setDashboardState] = useState("live"); 

  const isPreviewMode = dashboardState === "preview";

  const [summary, setSummary] = useState({
    totalIncome: zeroStateData.totalIncome,
    totalExpenses: zeroStateData.totalExpense,
    netProfit: zeroStateData.netProfit,
    profitMargin: 0,
    transactionCount: zeroStateData.transactions.length,
  });
  const [chartData, setChartData] = useState(zeroStateData.chartData);
  const [pieData, setPieData] = useState(zeroStateData.pieData);

  const lastInsightFetchRef = useRef(null);

  const currentBaseline = dashboardState === "preview" ? initialData : zeroStateData;
  const { healthScore, healthLabel, healthColor } = buildHealth(summary, currentBaseline);
  
  const profitMargin =
    summary.totalIncome > 0
      ? Math.round((summary.netProfit / summary.totalIncome) * 100)
      : 0;

  useEffect(() => {
    let isMounted = true;

    if (dashboardState === "preview") {
      setSummary({
        totalIncome: initialData.totalIncome || 125000, 
        totalExpenses: initialData.totalExpenses || 45000,
        netProfit: (initialData.totalIncome || 125000) - (initialData.totalExpenses || 45000),
        profitMargin: Math.round(((125000 - 45000) / 125000) * 100),
        transactionCount: initialData.transactions?.length || 12,
      });
      setChartData(initialData.chartData || []);
      setPieData(initialData.pieData || []);
      setInsight(null);
      setInsightError(null);

    } else if (dashboardState === "live") {
      const fetchLiveDashboardData = async () => {
        if (!isMounted) return;
        setIsLoading(true);
        try {
          await loadDashboard(
            period,
            (data) => isMounted && setSummary(data),
            (data) => isMounted && setChartData(data),
            (data) => isMounted && setPieData(data),
            (loadingState) => isMounted && setIsLoading(loadingState),
            null, 
            getToken
          );
          if (isMounted) {
             lastInsightFetchRef.current = null; 
          }
        } catch (error) {
          console.error("Dashboard synchronization connection lost:", error);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      };

      fetchLiveDashboardData();
    } else {
      setSummary({
        totalIncome: zeroStateData.totalIncome,
        totalExpenses: zeroStateData.totalExpense,
        netProfit: zeroStateData.netProfit,
        profitMargin: 0,
        transactionCount: zeroStateData.transactions.length,
      });
      setChartData(zeroStateData.chartData);
      setPieData(zeroStateData.pieData);
      setInsight(null);
      setInsightError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [period, dashboardState, getToken]);

  useEffect(() => {
    if (dashboardState === "live") {
      const now = Date.now();
      if (!lastInsightFetchRef.current || (now - lastInsightFetchRef.current) > 300000) {
        setInsight(null);
        setInsightError(null);
        fetchInsights(
          period, 
          setInsightLoading, 
          (data) => {
             setInsight(data);
             lastInsightFetchRef.current = Date.now(); 
          }, 
          healthLabel, 
          getToken,
          (errorMsg) => {
             setInsightError(errorMsg);
             setInsightLoading(false);
          }
        );
      }
    }
  }, [period, dashboardState, healthLabel, getToken, summary.transactionCount]);

  return (
    <>
      {/* Upper Utility Ribbon */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Performance Hub</h2>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {dashboardState === "preview" && "Viewing mock transactional dashboard preview"}
            {dashboardState === "empty" && "No transaction pipelines loaded"}
            {dashboardState === "live" && (isLoading ? "Refreshing records..." : "Real-time production ledger values")}
          </p>
        </div>

        <button
          onClick={() => {
            if (dashboardState === "live") {
              setDashboardState("preview");
            } else if (dashboardState === "preview") {
              setDashboardState("empty");
            } else {
              setDashboardState("live");
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            borderRadius: "0.5rem", 
            padding: "0.5rem 0.875rem", 
            fontSize: "0.78125rem", 
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            background: 
              dashboardState === "preview" ? "rgba(216, 90, 48, 0.1)" : 
              dashboardState === "live"    ? "rgba(29, 158, 117, 0.1)"  : 
                                             "rgba(192, 132, 252, 0.15)", 
            border: 
              dashboardState === "preview" ? "0.0625rem solid #D85A30" : 
              dashboardState === "live"    ? "0.0625rem solid #1D9E75" : 
                                             "0.0625rem solid #c084fc",
            color: 
              dashboardState === "preview" ? "#D85A30" : 
              dashboardState === "live"    ? "#1D9E75" : 
                                             "#c084fc",
          }}
        >
          {dashboardState === "empty" && (
            <>
              <Database style={{ width: "0.9375rem", height: "0.9375rem" }} />
              Switch to Live Production
            </>
          )}

          {dashboardState === "preview" && (
            <>
              <EyeOff style={{ width: "0.9375rem", height: "0.9375rem" }} />
              Clear Sample Metrics
            </>
          )}

          {dashboardState === "live" && (
            <>
              <CheckCircle style={{ width: "0.9375rem", height: "0.9375rem" }} />
              Live Ledger Active
            </>
          )}
        </button>
      </div>

      <IllustrationBanner />

      {/* Grid Layout Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(9.375rem, 1fr))", 
        gap: "0.75rem", 
        marginBottom: "1.5rem",
      }}>
        {[
          { label: "Total income", value: KES(summary.totalIncome), color: "#1D9E75", Icon: TrendingUp },
          { label: "Total expenses", value: KES(summary.totalExpenses), color: "#D85A30", Icon: TrendingDown },
          { label: "Net profit", value: KES(summary.netProfit), color: summary.netProfit >= 0 ? "#378ADD" : "#D85A30", Icon: Wallet },
          { label: "Profit margin", value: `${profitMargin}%`, color: profitMargin >= 20 ? "#1D9E75" : "#BA7517", Icon: Percent },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: "var(--bg-secondary)",
              border: "0.0625rem solid var(--border-color)",
              borderRadius: "0.75rem", 
              padding: "0.875rem", 
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)" }}>{c.label}</span>
              <c.Icon style={{ width: "0.9375rem", height: "0.9375rem", color: "var(--text-tertiary)" }} />
            </div>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: c.color, letterSpacing: "-0.02em" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Health Meter Progress Bar */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "0.0625rem solid var(--border-color)",
        borderRadius: "0.875rem", 
        padding: "1rem", 
        marginBottom: "1.5rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity className="w-4 h-4 text-slate-400" />
            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)" }}>Financial health score</span>
          </div>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: summary.transactionCount === 0 ? "var(--text-tertiary)" : healthColor }}>
            {summary.transactionCount === 0 ? "No Transactions Added" : `${healthScore}/100 · ${healthLabel}`}
          </span>
        </div>
        <div style={{ height: "0.5rem", background: "var(--border-color)", borderRadius: "0.375rem", overflow: "hidden" }}>
          <div style={{ height: "100%", width: summary.transactionCount === 0 ? "0%" : `${healthScore}%`, background: summary.transactionCount === 0 ? "var(--text-tertiary)" : healthColor, borderRadius: "0.375rem", transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </div>
      </div>

      {/* Main Analytical Chart Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>Income vs expenses</p>
        <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-secondary)", padding: "0.1875rem", borderRadius: "0.5rem", border: "0.0625rem solid var(--border-color)" }}>
          {["area", "bar"].map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              disabled={chartData.length === 0}
              style={{
                background: chartType === t ? "var(--bg-primary)" : "transparent",
                border: "none",
                borderRadius: "0.375rem", 
                textTransform: "capitalize",
                padding: "0.25rem 0.75rem", 
                fontSize: "0.75rem",
                cursor: chartData.length === 0 ? "not-allowed" : "pointer",
                fontWeight: chartType === t ? 600 : 500,
                color: chartType === t ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: chartType === t ? "0 0.0625rem 0.1875rem rgba(0,0,0,0.1)" : "none",
                opacity: chartData.length === 0 ? 0.4 : 1,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div style={{ height: "13.75rem", background: "var(--bg-secondary)", border: "0.0625rem dashed var(--border-color)", borderRadius: "0.875rem", display: "flex", flexDirection: "column", justify2Content: "center", alignItems: "center", marginBottom: "2rem", gap: "0.5rem", padding: "1.25rem", textAlign: "center" }}>
          <PlusCircle style={{ width: "1.75rem", height: "1.75rem", color: "var(--text-tertiary)" }} />
          <p style={{ fontSize: "0.8125rem", fontWeight: 500, margin: 0, color: "var(--text-primary)" }}>No transaction streams found</p>
          <p style={{ fontSize: "0.71875rem", margin: 0, color: "var(--text-secondary)", maxWidth: "21.25rem" }}>Process your records via Voice Log pipelines or activate the <strong>Preview Demo Visuals</strong> switch above to inspect structural layout tools.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "0.875rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {[["income", COLORS.income, "solid"], ["expense", COLORS.expense, "dashed"], ["profit", COLORS.profit, "dotted"]].map(([k, c, style]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span style={{ width: "0.875rem", height: "0.1875rem", background: c, display: "inline-block", borderRadius: "0.125rem", borderBottom: style === "dashed" ? "0.0625rem dashed #fff" : "none" }} />
                <span style={{ textTransform: "capitalize" }}>{k}</span>
              </span>
            ))}
          </div>

          <div style={{ position: "relative", height: "13.75rem", marginBottom: "2rem", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.income} stopOpacity={0.15} /><stop offset="95%" stopColor={COLORS.income} stopOpacity={0} /></linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.15} /><stop offset="95%" stopColor={COLORS.expense} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" stroke={COLORS.income} strokeWidth={2} fill="url(#gi)" dot={false} />
                  <Area type="monotone" dataKey="expenses" stroke={COLORS.expense} strokeWidth={2} fill="url(#ge)" dot={false} strokeDasharray="5 3" />
                  <Area type="monotone" dataKey="profit" stroke={COLORS.profit} strokeWidth={1.5} fill="none" dot={false} strokeDasharray="2 2" />
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" fill={COLORS.income} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses" fill={COLORS.expense} radius={[2, 2, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Breakdown Categorization Split */}
      <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>Category breakdown</p>
      <div style={{ display: "grid", gridTemplateColumns: pieData.length === 0 ? "1fr" : "1fr 1fr", gap: "1rem", alignItems: "center", marginBottom: "2rem", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "0.875rem", border: "0.0625rem solid var(--border-color)", minHeight: "7.5rem" }}>
        {pieData.length === 0 ? (
          <p style={{ fontSize: "0.78125rem", color: "var(--text-secondary)", textAlign: "center", margin: 0, fontStyle: "italic" }}>No transaction distribution to chart yet.</p>
        ) : (
          <>
            <div style={{ position: "relative", height: "10rem" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => <Cell key={entry.name} fill={COLORS[entry.name] || COLORS.other} />)}
                  </Pie>
                  <Tooltip formatter={(v) => KES(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", justifyContent: "center" }}>
              {pieData.slice(0, 5).map((p) => {
                const totalDenominator = summary.totalIncome + summary.totalExpenses || 1;
                const pct = Math.round((p.value / totalDenominator) * 100);
                const IconComponent = renderCategoryIcon(p.name);
                return (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "1.5rem" }}>
                    <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: COLORS[p.name] || COLORS.other, flexShrink: 0 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flex: 1, minWidth: 0, color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", color: "var(--text-tertiary)", flexShrink: 0 }}><IconComponent className="w-3.5 h-3.5" /></span>
                      <span style={{ textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", flexShrink: 0 }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* AI Insights Board Panel */}
      <div style={{ background: "var(--bg-secondary)", border: "0.0625rem solid var(--border-color)", borderRadius: "0.875rem", padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Sparkles className="w-4 h-4 text-amber-500" />
            <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>AI Insights</p>
          </div>
          {!insight && !insightError && (
            <button
              onClick={() => {
                 lastInsightFetchRef.current = null; 
                 setInsight(null);
                 setInsightError(null);
                 fetchInsights(period, setInsightLoading, (data) => { setInsight(data); lastInsightFetchRef.current = Date.now(); }, healthLabel, getToken, setInsightError);
              }}
              disabled={insightLoading || isPreviewMode}
              style={{ background: "var(--bg-primary)", border: "0.0625rem solid var(--border-color)", borderRadius: "0.5rem", padding: "0.375rem 0.875rem", fontSize: "0.75rem", cursor: (isPreviewMode || insightLoading) ? "not-allowed" : "pointer", color: "var(--text-secondary)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.25rem", transition: "opacity 0.2s", opacity: (isPreviewMode || insightLoading) ? 0.5 : 1 }}
            >
              {insightLoading ? "Analyzing..." : "Generate"}
            </button>
          )}
        </div>
        {!insight && !insightLoading && !insightError && (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            {isPreviewMode ? "Gemini analysis requires active log streams. Switch on the live pipeline to preview dynamic structural metrics." : "Get a comprehensive real-time financial health analysis powered directly by Gemini."}
          </p>
        )}
        {insightLoading && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.5rem 0" }}>
            <div className="pulse-indicator" style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "#1D9E75" }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Gemini is scanning transaction metrics...</span>
          </div>
        )}
        {insightError && (
          <div style={{ display: "flex", gap: "0.625rem", padding: "0.75rem", background: "rgba(216, 90, 48, 0.08)", border: "0.0625rem solid rgba(216, 90, 48, 0.3)", borderRadius: "0.5rem", alignItems: "flex-start" }}>
             <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
             <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0, color: "#D85A30"}}>High Demand Detected</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>{insightError} Please refresh the dashboard in a few minutes to try again.</p>
             </div>
          </div>
        )}
        {insight && !insightError && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>{insight.summary}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {insight.insights?.map((ins, i) => {
                const isPos = ins.type === "positive";
                const isWarn = ins.type === "warning";
                const alertBg = isPos ? "rgba(29,158,117,0.1)" : isWarn ? "rgba(216,90,48,0.1)" : "rgba(55,138,221,0.1)";
                const alertColor = isPos ? "#1D9E75" : isWarn ? "#D85A30" : "#378ADD";
                const AlertIcon = isPos ? CheckCircle : isWarn ? AlertTriangle : Lightbulb;
                return (
                  <div key={i} style={{ display: "flex", gap: "0.625rem", padding: "0.625rem 0.75rem", borderRadius: "0.625rem", background: alertBg, border: `0.0625rem solid ${alertBg}`, alignItems: "flex-start" }}>
                    <AlertIcon style={{ width: "1rem", height: "1rem", color: alertColor, flexShrink: 0, marginTop: "0.0625rem" }} />
                    <span style={{ fontSize: "0.78125rem", color: "var(--text-primary)", lineHeight: 1.4 }}>{ins.message}</span>
                  </div>
                );
              })}
            </div>
            {insight.recommendation && (
              <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", marginTop: "0.125rem", paddingLeft: "0.125rem" }}>
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, fontStyle: "italic" }}>Tip: {insight.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}