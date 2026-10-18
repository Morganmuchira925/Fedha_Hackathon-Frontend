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
  Receipt,
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
  transactions: [],
};

// Semantic status colors. COLORS.income / expense / profit (from ../constants)
// still drive the chart series themselves.
const STATUS = {
  success: "#1D9E75",
  danger: "#D85A30",
  info: "#378ADD",
  warning: "#BA7517",
  accent: "#c084fc",
};

// The hero card is the one memorable element on the page: a deep, solid
// colour block that holds the single number a trader cares about most.
// It flips to a warm clay tone when the business is running at a loss.
const HERO = {
  profit: { bg: "#0E3B2E", line: "#6FE3B5", soft: "rgba(111,227,181,0.16)" },
  loss: { bg: "#4A1F12", line: "#F4A582", soft: "rgba(244,165,130,0.16)" },
  text: "#F6F2E9",
  muted: "rgba(246,242,233,0.68)",
};

// Scoped stylesheet: layout, responsive breakpoints, focus rings and
// reduced motion. Everything is namespaced under [data-fedha-dashboard].
const DashboardStyles = () => (
  <style>{`
    [data-fedha-dashboard] {
      font-variant-numeric: tabular-nums;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-width: 64rem;
      margin: 0 auto;
    }

    [data-fedha-dashboard] button:focus-visible,
    [data-fedha-dashboard] [tabindex]:focus-visible {
      outline: 2px solid ${STATUS.info};
      outline-offset: 2px;
    }

    [data-fedha-dashboard] .fd-card {
      background: var(--bg-secondary);
      border: 0.0625rem solid var(--border-color);
      border-radius: 1rem;
      padding: 1.125rem 1.25rem;
      min-width: 0;
    }

    [data-fedha-dashboard] .fd-section-title {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 650;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }

    [data-fedha-dashboard] .fd-muted {
      color: var(--text-secondary);
    }

    /* Header */
    [data-fedha-dashboard] .fd-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    [data-fedha-dashboard] .fd-title {
      margin: 0;
      font-size: 1.625rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.15;
      color: var(--text-primary);
    }
    [data-fedha-dashboard] .fd-mode-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border-radius: 999px;
      padding: 0.5rem 0.95rem;
      font-size: 0.78125rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.15s ease;
    }
    [data-fedha-dashboard] .fd-mode-btn:active {
      transform: scale(0.97);
    }

    /* Hero */
    [data-fedha-dashboard] .fd-hero {
      position: relative;
      overflow: hidden;
      border-radius: 1.25rem;
      padding: 1.375rem 1.5rem 6.25rem;
      color: ${HERO.text};
      animation: fedha-rise 0.45s ease-out both;
    }
    [data-fedha-dashboard] .fd-hero-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      position: relative;
      z-index: 1;
    }
    [data-fedha-dashboard] .fd-hero-value {
      position: relative;
      z-index: 1;
      margin: 0.75rem 0 0.25rem;
      font-size: clamp(2rem, 8vw, 3rem);
      font-weight: 750;
      letter-spacing: -0.035em;
      line-height: 1.05;
      overflow-wrap: anywhere;
    }
    [data-fedha-dashboard] .fd-hero-spark {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 5.5rem;
      pointer-events: none;
    }
    [data-fedha-dashboard] .fd-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border-radius: 999px;
      padding: 0.25rem 0.7rem;
      font-size: 0.71875rem;
      font-weight: 600;
    }

    /* Stat cards */
    [data-fedha-dashboard] .fd-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.875rem;
    }
    [data-fedha-dashboard] .fd-stat {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
      overflow: hidden;
    }
    [data-fedha-dashboard] .fd-stat::before {
      content: "";
      position: absolute;
      left: 0;
      top: 1rem;
      bottom: 1rem;
      width: 0.1875rem;
      border-radius: 0 0.25rem 0.25rem 0;
      background: var(--stat-color);
    }
    [data-fedha-dashboard] .fd-icon-chip {
      width: 2rem;
      height: 2rem;
      border-radius: 0.625rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* Health */
    [data-fedha-dashboard] .fd-health {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    /* Charts */
    [data-fedha-dashboard] .fd-seg {
      display: inline-flex;
      gap: 0.1875rem;
      padding: 0.1875rem;
      border-radius: 999px;
      background: var(--bg-primary);
      border: 0.0625rem solid var(--border-color);
    }
    [data-fedha-dashboard] .fd-seg button {
      border: none;
      border-radius: 999px;
      padding: 0.25rem 0.85rem;
      font-size: 0.75rem;
      text-transform: capitalize;
      background: transparent;
      color: var(--text-secondary);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
    }
    [data-fedha-dashboard] .fd-seg button[aria-pressed="true"] {
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-weight: 650;
      box-shadow: 0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.12);
    }
    [data-fedha-dashboard] .fd-seg button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    [data-fedha-dashboard] .fd-breakdown {
      display: grid;
      grid-template-columns: minmax(0, 11rem) minmax(0, 1fr);
      gap: 1.5rem;
      align-items: center;
    }
    [data-fedha-dashboard] .fd-cat-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      column-gap: 0.625rem;
      row-gap: 0.3rem;
    }
    [data-fedha-dashboard] .fd-bar-track {
      grid-column: 1 / -1;
      height: 0.3125rem;
      border-radius: 999px;
      background: var(--border-color);
      overflow: hidden;
    }

    [data-fedha-dashboard] .fd-btn {
      border: 0.0625rem solid var(--border-color);
      background: var(--bg-primary);
      color: var(--text-primary);
      border-radius: 999px;
      padding: 0.4rem 1rem;
      font-size: 0.78125rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      cursor: pointer;
      transition: opacity 0.2s ease, transform 0.15s ease;
    }
    [data-fedha-dashboard] .fd-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    [data-fedha-dashboard] .fd-btn:not(:disabled):active {
      transform: scale(0.97);
    }

    @media (max-width: 640px) {
      [data-fedha-dashboard] .fd-stats {
        grid-template-columns: repeat(2, 1fr);
      }
      [data-fedha-dashboard] .fd-stats > :last-child {
        grid-column: 1 / -1;
      }
      [data-fedha-dashboard] .fd-breakdown {
        grid-template-columns: 1fr;
      }
      [data-fedha-dashboard] .fd-hero {
        padding: 1.125rem 1.125rem 5.5rem;
      }
      [data-fedha-dashboard] .fd-mode-btn {
        width: 100%;
        justify-content: center;
      }
      [data-fedha-dashboard] .fd-health {
        gap: 0.875rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      [data-fedha-dashboard] * {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
      }
    }

    [data-fedha-dashboard] .pulse-dot {
      animation: fedha-pulse 1.6s ease-in-out infinite;
    }
    @keyframes fedha-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes fedha-rise {
      from { opacity: 0; transform: translateY(0.5rem); }
      to { opacity: 1; transform: translateY(0); }
    }
  `}</style>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "0.0625rem solid var(--border-color)",
        borderRadius: "0.75rem",
        padding: "0.625rem 0.875rem",
        fontSize: "0.8125rem",
        boxShadow: "0 0.5rem 1.5rem rgba(0,0,0,0.18)",
      }}
    >
      <p style={{ color: "var(--text-secondary)", margin: "0 0 0.375rem", fontSize: "0.75rem" }}>
        {label}
      </p>
      {payload.map((p) => (
        <div
          key={p.name}
          style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.1875rem" }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "0.5rem",
              height: "0.5rem",
              borderRadius: "50%",
              background: p.color,
              display: "inline-block",
            }}
          />
          <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{KES(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// Circular gauge for the health score. Pure SVG: no extra requests, crisp at
// any density, and it inherits the app's theme variables.
const HealthRing = ({ score, color, empty }) => {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = empty ? 0 : Math.max(0, Math.min(100, score));
  return (
    <div style={{ position: "relative", width: "5rem", height: "5rem", flexShrink: 0 }}>
      <svg viewBox="0 0 72 72" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border-color)" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={empty ? "var(--text-tertiary)" : color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div
        role="progressbar"
        aria-label="Business health score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.125rem",
          fontWeight: 700,
          color: empty ? "var(--text-tertiary)" : "var(--text-primary)",
        }}
      >
        {empty ? "–" : pct}
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
    summary.totalIncome > 0 ? Math.round((summary.netProfit / summary.totalIncome) * 100) : 0;

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
      if (!lastInsightFetchRef.current || now - lastInsightFetchRef.current > 300000) {
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

  // Describes the action the toggle will perform next, not the current state.
  const modeToggleConfig = {
    live: { next: "preview", label: "View sample data", Icon: Database, color: STATUS.success },
    preview: { next: "empty", label: "Clear sample data", Icon: EyeOff, color: STATUS.danger },
    empty: { next: "live", label: "Show my data", Icon: CheckCircle, color: STATUS.accent },
  }[dashboardState];

  const statusBadgeText = {
    live: "Your data",
    preview: "Sample data",
    empty: "Empty",
  }[dashboardState];

  const hasTransactions = summary.transactionCount > 0;
  const isLoss = summary.netProfit < 0;
  const heroTone = isLoss ? HERO.loss : HERO.profit;
  const periodLabel = /^\d+d$/.test(period) ? `the last ${parseInt(period, 10)} days` : period;
  const isLive = dashboardState === "live" && !isLoading;
  const spendRatio =
    summary.totalIncome > 0 ? Math.round((summary.totalExpenses / summary.totalIncome) * 100) : 0;
  const pieTotal = pieData.reduce((sum, p) => sum + (p.value || 0), 0) || 1;

  const statCards = [
    {
      label: "Money in",
      value: KES(summary.totalIncome),
      caption: "Total income",
      color: STATUS.success,
      Icon: TrendingUp,
    },
    {
      label: "Money out",
      value: KES(summary.totalExpenses),
      caption: summary.totalIncome > 0 ? `${spendRatio}% of what came in` : "Total expenses",
      color: STATUS.danger,
      Icon: TrendingDown,
    },
    {
      label: "Transactions",
      value: String(summary.transactionCount),
      caption: `Recorded in ${periodLabel}`,
      color: STATUS.info,
      Icon: Receipt,
    },
  ];

  return (
    <div data-fedha-dashboard>
      <DashboardStyles />

      {/* Header + data-mode control */}
      <div className="fd-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            <h1 className="fd-title">Welcome back</h1>
            <span
              className="fd-pill"
              style={{
                background: "var(--bg-secondary)",
                border: "0.0625rem solid var(--border-color)",
                color: "var(--text-secondary)",
              }}
            >
              {statusBadgeText}
            </span>
          </div>
          <p
            role="status"
            className="fd-muted"
            style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem" }}
          >
            {dashboardState === "preview" && "This is sample data so you can see how the dashboard looks."}
            {dashboardState === "empty" && "No transactions yet. They'll show up here once you add some."}
            {dashboardState === "live" &&
              (isLoading ? "Updating your numbers…" : "Here's how your business is doing today.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDashboardState(modeToggleConfig.next)}
          className="fd-mode-btn"
          aria-label={`${modeToggleConfig.label} (currently showing ${statusBadgeText.toLowerCase()})`}
          style={{
            background: `${modeToggleConfig.color}1a`,
            border: `0.0625rem solid ${modeToggleConfig.color}`,
            color: modeToggleConfig.color,
          }}
        >
          <modeToggleConfig.Icon aria-hidden="true" style={{ width: "0.9375rem", height: "0.9375rem" }} />
          {modeToggleConfig.label}
        </button>
      </div>

      {/* Hero: net profit */}
      <section
        className="fd-hero"
        aria-label={`Net profit: ${KES(summary.netProfit)}`}
        style={{ background: heroTone.bg }}
      >
        <div className="fd-hero-top">
          <span className="fd-pill" style={{ background: heroTone.soft, color: HERO.text }}>
            <span
              aria-hidden="true"
              className={isLive ? "pulse-dot" : undefined}
              style={{
                width: "0.4375rem",
                height: "0.4375rem",
                borderRadius: "50%",
                background: isLive ? heroTone.line : HERO.muted,
              }}
            />
            {isLive ? "Updated just now" : isLoading ? "Updating…" : "Sample or empty view"}
          </span>
          {hasTransactions && summary.totalIncome > 0 && (
            <span className="fd-pill" style={{ background: heroTone.soft, color: HERO.text }}>
              <Wallet aria-hidden="true" style={{ width: "0.8125rem", height: "0.8125rem" }} />
              {profitMargin}% profit margin
            </span>
          )}
        </div>

        <p className="fd-hero-value">{KES(summary.netProfit)}</p>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: HERO.muted, position: "relative", zIndex: 1 }}>
          {isLoss ? "Net loss" : "Net profit"} over {periodLabel}
        </p>

        {chartData.length > 1 && (
          <div className="fd-hero-spark" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={heroTone.line} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={heroTone.line} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke={heroTone.line}
                  strokeWidth={2}
                  fill="url(#heroFill)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Key figures */}
      <div className="fd-stats">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="fd-card fd-stat"
            role="group"
            aria-label={`${c.label}: ${c.value}`}
            style={{ "--stat-color": c.color }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <span className="fd-icon-chip" style={{ background: `${c.color}1f`, color: c.color }}>
                <c.Icon aria-hidden="true" style={{ width: "1rem", height: "1rem" }} />
              </span>
              <span className="fd-muted" style={{ fontSize: "0.78125rem", fontWeight: 500 }}>
                {c.label}
              </span>
            </div>
            <div>
              <p
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.025em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.value}
              </p>
              <p className="fd-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.71875rem" }}>
                {c.caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Health */}
      <div className="fd-card fd-health">
        <HealthRing score={healthScore} color={healthColor} empty={!hasTransactions} />
        <div style={{ minWidth: 0 }}>
          <p className="fd-section-title">Business health</p>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "1.0625rem",
              fontWeight: 650,
              color: hasTransactions ? healthColor : "var(--text-tertiary)",
            }}
          >
            {hasTransactions ? healthLabel : "No transactions yet"}
          </p>
          <p className="fd-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", lineHeight: 1.45 }}>
            {hasTransactions
              ? `Score of ${healthScore} out of 100, based on your income, spending and profit.`
              : "Add a few sales and expenses to see your score."}
          </p>
        </div>
      </div>

      {/* Income vs expenses */}
      <div className="fd-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.875rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <p className="fd-section-title">Income vs expenses</p>
          <div className="fd-seg" role="group" aria-label="Chart type">
            {["area", "bar"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setChartType(t)}
                disabled={chartData.length === 0}
                aria-pressed={chartType === t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div
            style={{
              height: "13.75rem",
              border: "0.0625rem dashed var(--border-color)",
              borderRadius: "0.75rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              padding: "1.25rem",
              textAlign: "center",
            }}
          >
            <PlusCircle aria-hidden="true" style={{ width: "1.75rem", height: "1.75rem", color: "var(--text-tertiary)" }} />
            <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
              No transactions yet
            </p>
            <p className="fd-muted" style={{ fontSize: "0.75rem", margin: 0, maxWidth: "21.25rem", lineHeight: 1.45 }}>
              Add an income or expense to see your chart here, or tap <strong>View sample data</strong> above to
              see how it looks.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "0.75rem",
                fontSize: "0.75rem",
                flexWrap: "wrap",
              }}
              className="fd-muted"
            >
              {[
                ["income", COLORS.income],
                ["expense", COLORS.expense],
                ["profit", COLORS.profit],
              ].map(([k, c]) => (
                <span key={k} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <span
                    aria-hidden="true"
                    style={{ width: "0.625rem", height: "0.625rem", background: c, display: "inline-block", borderRadius: "50%" }}
                  />
                  <span style={{ textTransform: "capitalize" }}>{k}</span>
                </span>
              ))}
            </div>

            <div style={{ position: "relative", height: "14rem", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--grid-color)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-color)" }} />
                    <Area type="monotone" dataKey="income" stroke={COLORS.income} strokeWidth={2.25} fill="url(#gi)" dot={false} activeDot={{ r: 4 }} />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke={COLORS.expense}
                      strokeWidth={2}
                      fill="url(#ge)"
                      dot={false}
                      activeDot={{ r: 4 }}
                      strokeDasharray="5 3"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke={COLORS.profit}
                      strokeWidth={1.5}
                      fill="none"
                      dot={false}
                      activeDot={{ r: 3 }}
                      strokeDasharray="2 2"
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--grid-color)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border-color)", opacity: 0.35 }} />
                    <Bar dataKey="income" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="expenses" fill={COLORS.expense} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Spending by category */}
      <div className="fd-card">
        <p className="fd-section-title" style={{ marginBottom: "1rem" }}>
          Spending by category
        </p>
        {pieData.length === 0 ? (
          <p className="fd-muted" style={{ fontSize: "0.8125rem", textAlign: "center", margin: "1.25rem 0" }}>
            Add transactions to see where your money goes.
          </p>
        ) : (
          <div className="fd-breakdown">
            <div style={{ position: "relative", height: "11rem" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={3}
                    cornerRadius={4}
                    stroke="none"
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name] || COLORS.other} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => KES(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <span className="fd-muted" style={{ fontSize: "0.6875rem" }}>
                  Spent
                </span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {KES(pieTotal)}
                </span>
              </div>
            </div>

            <ul style={{ display: "flex", flexDirection: "column", gap: "0.875rem", margin: 0, padding: 0, listStyle: "none" }}>
              {pieData.slice(0, 5).map((p) => {
                const pct = Math.round((p.value / pieTotal) * 100);
                const color = COLORS[p.name] || COLORS.other;
                const IconComponent = renderCategoryIcon(p.name);
                return (
                  <li key={p.name} className="fd-cat-row">
                    <span
                      className="fd-icon-chip"
                      style={{ width: "1.625rem", height: "1.625rem", borderRadius: "0.5rem", background: `${color}22`, color }}
                    >
                      <IconComponent aria-hidden="true" className="w-3.5 h-3.5" />
                    </span>
                    <span
                      style={{
                        textTransform: "capitalize",
                        fontSize: "0.8125rem",
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 650, color: "var(--text-primary)" }}>{pct}%</span>
                    <div className="fd-bar-track" aria-hidden="true">
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: color,
                          borderRadius: "999px",
                          transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* AI insights */}
      <div className="fd-card" style={{ borderColor: `${STATUS.accent}55` }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.875rem",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span className="fd-icon-chip" style={{ background: `${STATUS.accent}22`, color: STATUS.accent }}>
              <Sparkles aria-hidden="true" style={{ width: "1rem", height: "1rem" }} />
            </span>
            <p className="fd-section-title">AI insights</p>
          </div>
          {!insight && !insightError && (
            <button
              type="button"
              className="fd-btn"
              onClick={() => {
                lastInsightFetchRef.current = null;
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
                  setInsightError
                );
              }}
              disabled={insightLoading || isPreviewMode}
            >
              {insightLoading ? "Analyzing…" : "Generate"}
            </button>
          )}
        </div>

        {!insight && !insightLoading && !insightError && (
          <p className="fd-muted" style={{ fontSize: "0.8125rem", margin: 0, lineHeight: 1.5 }}>
            {isPreviewMode
              ? "Insights need your real data. Switch off sample data to generate one."
              : "Get a quick, plain-language read on how your business is doing."}
          </p>
        )}

        {insightLoading && (
          <div role="status" style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.25rem 0" }}>
            <span
              aria-hidden="true"
              className="pulse-dot"
              style={{ width: "0.4375rem", height: "0.4375rem", borderRadius: "50%", background: STATUS.success }}
            />
            <span className="fd-muted" style={{ fontSize: "0.8125rem" }}>
              Looking at your numbers…
            </span>
          </div>
        )}

        {insightError && (
          <div
            role="alert"
            style={{
              display: "flex",
              gap: "0.625rem",
              padding: "0.875rem",
              background: "rgba(216, 90, 48, 0.08)",
              border: "0.0625rem solid rgba(216, 90, 48, 0.3)",
              borderRadius: "0.75rem",
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle aria-hidden="true" className="w-5 h-5 flex-shrink-0" style={{ color: STATUS.danger }} />
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0, color: STATUS.danger }}>
                Insights are unavailable right now
              </p>
              <p className="fd-muted" style={{ fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>
                {insightError} Please try again in a few minutes.
              </p>
            </div>
          </div>
        )}

        {insight && !insightError && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.55, maxWidth: "60ch" }}>
              {insight.summary}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {insight.insights?.map((ins, i) => {
                const isPos = ins.type === "positive";
                const isWarn = ins.type === "warning";
                const tone = isPos ? STATUS.success : isWarn ? STATUS.danger : STATUS.info;
                const AlertIcon = isPos ? CheckCircle : isWarn ? AlertTriangle : Lightbulb;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      padding: "0.75rem 0.875rem",
                      borderRadius: "0.75rem",
                      background: `${tone}14`,
                      borderLeft: `0.1875rem solid ${tone}`,
                      alignItems: "flex-start",
                    }}
                  >
                    <AlertIcon
                      aria-hidden="true"
                      style={{ width: "1rem", height: "1rem", color: tone, flexShrink: 0, marginTop: "0.125rem" }}
                    />
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                      {ins.message}
                    </span>
                  </div>
                );
              })}
            </div>
            {insight.recommendation && (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "0.75rem",
                  background: "var(--bg-primary)",
                  border: "0.0625rem dashed var(--border-color)",
                }}
              >
                <Info aria-hidden="true" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-tertiary)", marginTop: "0.125rem" }} />
                <p className="fd-muted" style={{ fontSize: "0.78125rem", margin: 0, lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--text-primary)" }}>Tip:</strong> {insight.recommendation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}