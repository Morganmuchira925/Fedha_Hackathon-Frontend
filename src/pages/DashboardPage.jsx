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
  transactions: [],
};

// Semantic status colors, used instead of scattering hex codes through the
// markup below. COLORS.income / COLORS.expense / COLORS.profit (from
// ../constants) still drive the chart series themselves.
const STATUS = {
  success: "#1D9E75",
  danger: "#D85A30",
  info: "#378ADD",
  warning: "#BA7517",
  accent: "#c084fc",
};

// One-time stylesheet for things inline styles can't express: responsive
// breakpoints, focus rings, and reduced-motion. Scoped with a data attribute
// on the root element so it can't leak into the rest of the app.
const DashboardStyles = () => (
  <style>{`
    [data-fedha-dashboard] button:focus-visible,
    [data-fedha-dashboard] [tabindex]:focus-visible {
      outline: 2px solid ${STATUS.info};
      outline-offset: 2px;
    }

    [data-fedha-dashboard] .stat-card-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    [data-fedha-dashboard] .breakdown-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 640px) {
      [data-fedha-dashboard] .stat-card-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      [data-fedha-dashboard] .breakdown-grid {
        grid-template-columns: 1fr;
      }
      [data-fedha-dashboard] .welcome-banner {
        height: auto !important;
        padding: 1.25rem 1rem;
      }
      [data-fedha-dashboard] .welcome-illustration {
        display: none;
      }
      [data-fedha-dashboard] .toolbar-row {
        align-items: stretch !important;
      }
      [data-fedha-dashboard] .mode-toggle-btn {
        justify-content: center;
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
  `}</style>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "0.0625rem solid var(--border-color)",
        borderRadius: "0.5rem",
        padding: "0.625rem 0.875rem",
        fontSize: "0.8125rem",
        boxShadow: "0 0.25rem 0.75rem rgba(0,0,0,0.15)",
      }}
    >
      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: "0.375rem",
          marginTop: 0,
        }}
      >
        {label}
      </p>
      {payload.map((p) => (
        <div
          key={p.name}
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            marginBottom: "0.1875rem",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "0.5rem",
              height: "0.5rem",
              borderRadius: "0.125rem",
              background: p.color,
              display: "inline-block",
            }}
          />
          <span
            style={{
              color: "var(--text-secondary)",
              textTransform: "capitalize",
            }}
          >
            {p.name}:
          </span>
          <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
            {KES(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// A small flat-style financial illustration: a phone showing a rising
// income chart, with a coin stack beside it. Built as inline SVG rather
// than a photo or stock-style asset for three reasons that matter for this
// audience specifically: it costs zero extra network requests (no broken
// images on a patchy market-stall connection), it scales perfectly at any
// size/DPI without a CDN, and there's no licensing risk — it's drawn from
// scratch. It reuses the app's own brand colors so it reads as part of the
// product rather than a stock illustration dropped on top of it.
const FinanceIllustration = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 220 160"
    style={{ width: "100%", height: "100%" }}
  >
    <defs>
      <linearGradient id="coinGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F2C265" />
        <stop offset="100%" stopColor={STATUS.warning} />
      </linearGradient>
      <linearGradient id="phoneScreenGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--bg-primary)" />
        <stop offset="100%" stopColor="var(--bg-secondary)" />
      </linearGradient>
    </defs>

    {/* soft backdrop circle */}
    <circle cx="120" cy="80" r="74" fill={STATUS.info} opacity="0.08" />
    <circle cx="46" cy="120" r="40" fill={STATUS.success} opacity="0.08" />

    {/* coin stack */}
    <g>
      <ellipse cx="42" cy="118" rx="26" ry="9" fill="url(#coinGradient)" />
      <ellipse cx="42" cy="108" rx="26" ry="9" fill="url(#coinGradient)" />
      <ellipse cx="42" cy="98" rx="26" ry="9" fill="url(#coinGradient)" />
      <ellipse cx="42" cy="98" rx="26" ry="9" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
      <text x="42" y="103" textAnchor="middle" fontSize="11" fontWeight="700" fill="#7A4A0E">
        KSh
      </text>
    </g>

    {/* phone with rising chart */}
    <g>
      <rect x="100" y="18" width="92" height="128" rx="14" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="2" />
      <rect x="110" y="32" width="72" height="92" rx="6" fill="url(#phoneScreenGradient)" />
      <circle cx="146" cy="132" r="6" fill="var(--border-color)" />

      {/* bars trending up */}
      <rect x="120" y="92" width="10" height="22" rx="2" fill={STATUS.info} opacity="0.8" />
      <rect x="136" y="80" width="10" height="34" rx="2" fill={STATUS.info} opacity="0.85" />
      <rect x="152" y="64" width="10" height="50" rx="2" fill={STATUS.success} />
      <rect x="168" y="48" width="10" height="66" rx="2" fill={STATUS.success} />

      {/* trend line over the bars */}
      <polyline
        points="120,96 136,84 152,68 168,52"
        fill="none"
        stroke={STATUS.success}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="168" cy="52" r="3.5" fill={STATUS.success} />
    </g>
  </svg>
);

// A calm, low-noise welcome banner. The previous version leaned on
// server-room language ("Engine Core Active", "Live Dynamics") that reads
// like infra status, not like something a market trader opens every
// morning to check yesterday's takings. The background is now a small
// hand-drawn finance illustration instead of abstract gradient blobs —
// see the note on `videoSrc` below for the tradeoffs if you'd rather use
// a real photo or video asset.
//
// Pass `videoSrc` (and optionally `posterSrc`) to swap the illustration for
// a background video — e.g. footage of a market or someone using the app.
// Kept opt-in rather than default because, for this audience specifically,
// video adds a real download cost on data-constrained connections; the
// illustration is the safer default and the video path degrades to it
// automatically if the source fails to load or the visitor has motion
// reduced in their OS settings.
const WelcomeBanner = ({ isLive, videoSrc, posterSrc }) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const showVideo = videoSrc && !videoFailed && !prefersReducedMotion;

  return (
    <div
      className="welcome-banner"
      style={{
        width: "100%",
        height: "9rem",
        borderRadius: "0.875rem",
        overflow: "hidden",
        position: "relative",
        marginBottom: "1.5rem",
        border: "0.0625rem solid var(--border-color)",
        background: "var(--bg-secondary)",
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
      }}
    >
      {showVideo ? (
        <video
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          poster={posterSrc}
          onError={() => setVideoFailed(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.5,
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <div
          className="welcome-illustration"
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-0.5rem",
            top: "50%",
            transform: "translateY(-50%)",
            width: "14rem",
            height: "10.5rem",
            opacity: 0.95,
          }}
        >
          <FinanceIllustration />
        </div>
      )}

      {showVideo && (
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: "var(--bg-secondary)", opacity: 0.55 }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: "26rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4375rem",
            background: "var(--bg-primary)",
            border: "0.0625rem solid var(--border-color)",
            borderRadius: "2rem",
            padding: "0.25rem 0.75rem",
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: isLive ? STATUS.success : "var(--text-secondary)",
            marginBottom: "0.625rem",
          }}
        >
          <span
            aria-hidden="true"
            className={isLive ? "pulse-dot" : undefined}
            style={{
              width: "0.4375rem",
              height: "0.4375rem",
              borderRadius: "50%",
              background: isLive ? STATUS.success : "var(--text-tertiary)",
            }}
          />
          {isLive ? "Updated just now" : "Sample data"}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: "1.375rem",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Welcome back
        </h2>
        <p
          style={{
            margin: "0.25rem 0 0 0",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          Here's how your business is doing today.
        </p>
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

  // Describes the action the toggle will perform next, rather than the
  // state it's currently in — a button should tell you what happens when
  // you press it.
  const modeToggleConfig = {
    live: {
      next: "preview",
      label: "View sample data",
      Icon: Database,
      color: STATUS.success,
    },
    preview: {
      next: "empty",
      label: "Clear sample data",
      Icon: EyeOff,
      color: STATUS.danger,
    },
    empty: {
      next: "live",
      label: "Show my data",
      Icon: CheckCircle,
      color: STATUS.accent,
    },
  }[dashboardState];

  const statusBadgeText = {
    live: "Your data",
    preview: "Sample data",
    empty: "Empty",
  }[dashboardState];

  return (
    <div data-fedha-dashboard>
      <DashboardStyles />

      {/* Page header + data-mode control */}
      <div
        className="toolbar-row"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.25rem",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
              Business overview
            </h1>
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                padding: "0.125rem 0.5rem",
                borderRadius: "1rem",
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
            style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}
          >
            {dashboardState === "preview" &&
              "This is sample data so you can see how the dashboard looks."}
            {dashboardState === "empty" &&
              "No transactions yet. They'll show up here once you add some."}
            {dashboardState === "live" &&
              (isLoading ? "Updating your numbers…" : "Your real, up-to-date business data.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDashboardState(modeToggleConfig.next)}
          className="mode-toggle-btn"
          aria-label={`${modeToggleConfig.label} (currently showing ${statusBadgeText.toLowerCase()})`}
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
            background: `${modeToggleConfig.color}1a`,
            border: `0.0625rem solid ${modeToggleConfig.color}`,
            color: modeToggleConfig.color,
          }}
        >
          <modeToggleConfig.Icon
            aria-hidden="true"
            style={{ width: "0.9375rem", height: "0.9375rem" }}
          />
          {modeToggleConfig.label}
        </button>
      </div>

      <WelcomeBanner isLive={dashboardState === "live" && !isLoading} />

      {/* Key figures */}
      <div className="stat-card-grid" style={{ marginBottom: "1.5rem" }}>
        {[
          {
            label: "Total income",
            value: KES(summary.totalIncome),
            color: STATUS.success,
            Icon: TrendingUp,
          },
          {
            label: "Total expenses",
            value: KES(summary.totalExpenses),
            color: STATUS.danger,
            Icon: TrendingDown,
          },
          {
            label: "Net profit",
            value: KES(summary.netProfit),
            color: summary.netProfit >= 0 ? STATUS.info : STATUS.danger,
            Icon: Wallet,
          },
          {
            label: "Profit margin",
            value: `${profitMargin}%`,
            color: profitMargin >= 20 ? STATUS.success : STATUS.warning,
            Icon: Percent,
          },
        ].map((c) => (
          <div
            key={c.label}
            role="group"
            aria-label={`${c.label}: ${c.value}`}
            style={{
              background: "var(--bg-secondary)",
              border: "0.0625rem solid var(--border-color)",
              borderRadius: "0.75rem",
              padding: "0.875rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.75rem",
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                {c.label}
              </span>
              <c.Icon
                aria-hidden="true"
                style={{ width: "0.9375rem", height: "0.9375rem", color: "var(--text-tertiary)" }}
              />
            </div>
            <p
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                margin: 0,
                color: c.color,
                letterSpacing: "-0.02em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Health meter */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "0.0625rem solid var(--border-color)",
          borderRadius: "0.875rem",
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity aria-hidden="true" className="w-4 h-4 text-slate-400" />
            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)" }}>
              Business health score
            </span>
          </div>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: summary.transactionCount === 0 ? "var(--text-tertiary)" : healthColor,
              textAlign: "right",
            }}
          >
            {summary.transactionCount === 0 ? "No transactions yet" : `${healthScore}/100 · ${healthLabel}`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Business health score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={summary.transactionCount === 0 ? 0 : healthScore}
          style={{
            height: "0.5rem",
            background: "var(--border-color)",
            borderRadius: "0.375rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: summary.transactionCount === 0 ? "0%" : `${healthScore}%`,
              background: summary.transactionCount === 0 ? "var(--text-tertiary)" : healthColor,
              borderRadius: "0.375rem",
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>

      {/* Income vs expenses chart */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>Income vs expenses</p>
        <div
          role="group"
          aria-label="Chart type"
          style={{
            display: "flex",
            gap: "0.25rem",
            background: "var(--bg-secondary)",
            padding: "0.1875rem",
            borderRadius: "0.5rem",
            border: "0.0625rem solid var(--border-color)",
          }}
        >
          {["area", "bar"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setChartType(t)}
              disabled={chartData.length === 0}
              aria-pressed={chartType === t}
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
        <div
          style={{
            height: "13.75rem",
            background: "var(--bg-secondary)",
            border: "0.0625rem dashed var(--border-color)",
            borderRadius: "0.875rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "2rem",
            gap: "0.5rem",
            padding: "1.25rem",
            textAlign: "center",
          }}
        >
          <PlusCircle aria-hidden="true" style={{ width: "1.75rem", height: "1.75rem", color: "var(--text-tertiary)" }} />
          <p style={{ fontSize: "0.8125rem", fontWeight: 500, margin: 0, color: "var(--text-primary)" }}>
            No transactions yet
          </p>
          <p style={{ fontSize: "0.71875rem", margin: 0, color: "var(--text-secondary)", maxWidth: "21.25rem" }}>
            Add an income or expense to see your chart here, or tap{" "}
            <strong>View sample data</strong> above to see how it looks.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "0.875rem",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              flexWrap: "wrap",
            }}
          >
            {[
              ["income", COLORS.income],
              ["expense", COLORS.expense],
              ["profit", COLORS.profit],
            ].map(([k, c]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: "0.875rem",
                    height: "0.1875rem",
                    background: c,
                    display: "inline-block",
                    borderRadius: "0.125rem",
                  }}
                />
                <span style={{ textTransform: "capitalize" }}>{k}</span>
              </span>
            ))}
          </div>

          <div style={{ position: "relative", height: "13.75rem", marginBottom: "2rem", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" stroke={COLORS.income} strokeWidth={2} fill="url(#gi)" dot={false} />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke={COLORS.expense}
                    strokeWidth={2}
                    fill="url(#ge)"
                    dot={false}
                    strokeDasharray="5 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke={COLORS.profit}
                    strokeWidth={1.5}
                    fill="none"
                    dot={false}
                    strokeDasharray="2 2"
                  />
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" fill={COLORS.income} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses" fill={COLORS.expense} radius={[2, 2, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Category breakdown */}
      <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>Spending by category</p>
      <div
        className="breakdown-grid"
        style={{
          gridTemplateColumns: pieData.length === 0 ? "1fr" : undefined,
          alignItems: "center",
          marginBottom: "2rem",
          background: "var(--bg-secondary)",
          padding: "1rem",
          borderRadius: "0.875rem",
          border: "0.0625rem solid var(--border-color)",
          minHeight: "7.5rem",
        }}
      >
        {pieData.length === 0 ? (
          <p style={{ fontSize: "0.78125rem", color: "var(--text-secondary)", textAlign: "center", margin: 0, fontStyle: "italic" }}>
            Add transactions to see your spending by category.
          </p>
        ) : (
          <>
            <div style={{ position: "relative", height: "10rem" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name] || COLORS.other} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => KES(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                justifyContent: "center",
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {pieData.slice(0, 5).map((p) => {
                const totalDenominator = summary.totalIncome + summary.totalExpenses || 1;
                const pct = Math.round((p.value / totalDenominator) * 100);
                const IconComponent = renderCategoryIcon(p.name);
                return (
                  <li key={p.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "1.5rem" }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: "0.5rem",
                        height: "0.5rem",
                        borderRadius: "50%",
                        background: COLORS[p.name] || COLORS.other,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        flex: 1,
                        minWidth: 0,
                        color: "var(--text-secondary)",
                        fontSize: "0.75rem",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", color: "var(--text-tertiary)", flexShrink: 0 }}>
                        <IconComponent aria-hidden="true" className="w-3.5 h-3.5" />
                      </span>
                      <span
                        style={{
                          textTransform: "capitalize",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", flexShrink: 0 }}>
                      {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* AI insights */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "0.0625rem solid var(--border-color)",
          borderRadius: "0.875rem",
          padding: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Sparkles aria-hidden="true" className="w-4 h-4 text-amber-500" />
            <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>AI insights</p>
          </div>
          {!insight && !insightError && (
            <button
              type="button"
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
              style={{
                background: "var(--bg-primary)",
                border: "0.0625rem solid var(--border-color)",
                borderRadius: "0.5rem",
                padding: "0.375rem 0.875rem",
                fontSize: "0.75rem",
                cursor: isPreviewMode || insightLoading ? "not-allowed" : "pointer",
                color: "var(--text-secondary)",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                transition: "opacity 0.2s",
                opacity: isPreviewMode || insightLoading ? 0.5 : 1,
              }}
            >
              {insightLoading ? "Analyzing…" : "Generate"}
            </button>
          )}
        </div>
        {!insight && !insightLoading && !insightError && (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            {isPreviewMode
              ? "Insights need your real data. Switch off sample data to generate one."
              : "Get a quick, plain-language read on how your business is doing."}
          </p>
        )}
        {insightLoading && (
          <div role="status" style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.5rem 0" }}>
            <span
              aria-hidden="true"
              className="pulse-dot"
              style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: STATUS.success }}
            />
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Looking at your numbers…</span>
          </div>
        )}
        {insightError && (
          <div
            role="alert"
            style={{
              display: "flex",
              gap: "0.625rem",
              padding: "0.75rem",
              background: "rgba(216, 90, 48, 0.08)",
              border: "0.0625rem solid rgba(216, 90, 48, 0.3)",
              borderRadius: "0.5rem",
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle aria-hidden="true" className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0, color: STATUS.danger }}>
                We're a bit busy
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>
                {insightError} Please try again in a few minutes.
              </p>
            </div>
          </div>
        )}
        {insight && !insightError && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
              {insight.summary}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {insight.insights?.map((ins, i) => {
                const isPos = ins.type === "positive";
                const isWarn = ins.type === "warning";
                const alertBg = isPos ? "rgba(29,158,117,0.1)" : isWarn ? "rgba(216,90,48,0.1)" : "rgba(55,138,221,0.1)";
                const alertColor = isPos ? STATUS.success : isWarn ? STATUS.danger : STATUS.info;
                const AlertIcon = isPos ? CheckCircle : isWarn ? AlertTriangle : Lightbulb;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "0.625rem",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "0.625rem",
                      background: alertBg,
                      border: `0.0625rem solid ${alertBg}`,
                      alignItems: "flex-start",
                    }}
                  >
                    <AlertIcon
                      aria-hidden="true"
                      style={{ width: "1rem", height: "1rem", color: alertColor, flexShrink: 0, marginTop: "0.0625rem" }}
                    />
                    <span style={{ fontSize: "0.78125rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                      {ins.message}
                    </span>
                  </div>
                );
              })}
            </div>
            {insight.recommendation && (
              <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", marginTop: "0.125rem", paddingLeft: "0.125rem" }}>
                <Info aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, fontStyle: "italic" }}>
                  Tip: {insight.recommendation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}