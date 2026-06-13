import { useState, useEffect } from "react";
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
  Eye,
  EyeOff,
  PlusCircle,
} from "lucide-react";
import { COLORS, KES } from "../constants";
import {
  generateData,
  buildHealth,
  loadDashboard,
  fetchInsights,
  renderCategoryIcon,
} from "../utils";

const initialData = generateData();

// Absolute clean slate state for brand-new profiles
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
      border: "0.5px solid var(--border-color)",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 13,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    }}>
      <p style={{
        color: "var(--text-secondary)",
        marginBottom: 6,
        marginTop: 0,
      }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 3,
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: 2,
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

export default function DashboardPage() {
  const [chartType, setChartType] = useState("area");
  const [period, setPeriod] = useState("30d");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  
  // FIXED: Moved state string initialization inside the component body 
  // Options: "empty" | "preview" | "live"
  const [dashboardState, setDashboardState] = useState("empty"); 

  // FIXED: Removed conflicting redundant `isPreviewMode` boolean tracking structures
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

  // Determine current working data baseline based on unified 3-state system
  const currentBaseline = dashboardState === "preview" ? initialData : zeroStateData;

  const { healthScore, healthLabel, healthColor } = buildHealth(summary, currentBaseline);
  const profitMargin =
    summary.totalIncome > 0
      ? Math.round((summary.netProfit / summary.totalIncome) * 100)
      : 0;

  // FIXED: Combined unified standalone state handling watcher effect inside component body
  useEffect(() => {
    if (dashboardState === "preview") {
      loadDashboard(
        period, 
        setSummary, 
        setChartData, 
        setPieData, 
        () => {}, 
        initialData
      );
    } else if (dashboardState === "live") {
      // Future Integration: loadDashboard(period, setSummary, setChartData, setPieData, () => {}, realUserData);
    } else {
      // "empty" state resets everything back to perfect zero parameters
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
    }
  }, [period, dashboardState]);

  return (
    <>
      {/* Interactive Upper Utility Ribbon */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Performance Hub</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
            {dashboardState === "preview" && "Viewing mock transactional dashboard preview"}
            {dashboardState === "empty" && "No transaction pipelines loaded"}
            {dashboardState === "live" && "Real-time production ledger values"}
          </p>
        </div>

        {/* Dynamic 3-State Demo & Production Controller Button */}
        <button
          onClick={() => {
            if (dashboardState === "empty") {
              setDashboardState("preview");
            } else if (dashboardState === "preview") {
              setDashboardState("empty");
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            background: 
              dashboardState === "preview" ? "rgba(216, 90, 48, 0.1)" : 
              dashboardState === "live"    ? "rgba(29, 158, 117, 0.1)"  : 
                                             "rgba(192, 132, 252, 0.15)", 
            border: 
              dashboardState === "preview" ? "1px solid #D85A30" : 
              dashboardState === "live"    ? "1px solid #1D9E75" : 
                                             "1px solid #c084fc",
            color: 
              dashboardState === "preview" ? "#D85A30" : 
              dashboardState === "live"    ? "#1D9E75" : 
                                             "#c084fc",
          }}
        >
          {dashboardState === "empty" && (
            <>
              <Eye style={{ width: 15, height: 15 }} />
              Preview Demo Visuals
            </>
          )}

          {dashboardState === "preview" && (
            <>
              <EyeOff style={{ width: 15, height: 15 }} />
              Clear Sample Metrics
            </>
          )}

          {dashboardState === "live" && (
            <>
              <CheckCircle style={{ width: 15, height: 15 }} />
              Viewing Live Uploads
            </>
          )}
        </button>
      </div>

      {/* Stat Cards Grid Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12,
        marginBottom: "1.5rem",
      }}>
        {[
          {
            label: "Total income",
            value: KES(summary.totalIncome),
            color: "#1D9E75",
            Icon: TrendingUp,
          },
          {
            label: "Total expenses",
            value: KES(summary.totalExpenses),
            color: "#D85A30",
            Icon: TrendingDown,
          },
          {
            label: "Net profit",
            value: KES(summary.netProfit),
            color: summary.netProfit >= 0 ? "#378ADD" : "#D85A30",
            Icon: Wallet,
          },
          {
            label: "Profit margin",
            value: `${profitMargin}%`,
            color: profitMargin >= 20 ? "#1D9E75" : "#BA7517",
            Icon: Percent,
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary)",
              }}>{c.label}</span>
              <c.Icon style={{
                width: 15,
                height: 15,
                color: "var(--text-tertiary)",
              }} />
            </div>
            <p style={{
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              color: c.color,
              letterSpacing: "-0.02em",
            }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Health Meter Container */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 14,
        padding: "16px",
        marginBottom: "1.5rem",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity className="w-4 h-4 text-slate-400" />
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}>Financial health score</span>
          </div>
          
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: chartData.length === 0 ? "var(--text-tertiary)" : healthColor,
          }}>
            {chartData.length === 0 ? "No Transactions Added" : `${healthScore}/100 · ${healthLabel}`}
          </span>
        </div>

        <div style={{
          height: 8,
          background: "var(--border-color)",
          borderRadius: 6,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: chartData.length === 0 ? "0%" : `${healthScore}%`,
            background: chartData.length === 0 ? "var(--text-tertiary)" : healthColor,
            borderRadius: 6,
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }} />
        </div>
      </div>

      {/* Main Interactive Chart Section Controls */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
          Income vs expenses
        </p>
        <div style={{
          display: "flex",
          gap: 4,
          background: "var(--bg-secondary)",
          padding: 3,
          borderRadius: 8,
          border: "1px solid var(--border-color)",
        }}>
          {["area", "bar"].map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              disabled={chartData.length === 0}
              style={{
                background: chartType === t ? "var(--bg-primary)" : "transparent",
                border: "none",
                borderRadius: 6,
                textTransform: "capitalize",
                padding: "4px 12px",
                fontSize: 12,
                cursor: chartData.length === 0 ? "not-allowed" : "pointer",
                fontWeight: chartType === t ? 600 : 500,
                color: chartType === t ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: chartType === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                opacity: chartData.length === 0 ? 0.4 : 1,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Rendering: Empty States placeholders */}
      {chartData.length === 0 ? (
        <div style={{
          height: 220,
          background: "var(--bg-secondary)",
          border: "1px dashed var(--border-color)",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "2rem",
          gap: 8,
          padding: 20,
          textAlign: "center"
        }}>
          <PlusCircle style={{ width: 28, height: 28, color: "var(--text-tertiary)" }} />
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--text-primary)" }}>No transaction streams found</p>
          <p style={{ fontSize: 11.5, margin: 0, color: "var(--text-secondary)", maxWidth: 340 }}>
            Process your records via Voice Log pipelines or activate the <strong>Preview Demo Visuals</strong> switch above to inspect structural layout tools.
          </p>
        </div>
      ) : (
        <>
          {/* Legend indicators */}
          <div style={{
            display: "flex",
            gap: 16,
            marginBottom: 14,
            fontSize: 12,
            color: "var(--text-secondary)",
          }}>
            {[
              ["income", COLORS.income, "solid"],
              ["expense", COLORS.expense, "dashed"],
              ["profit", COLORS.profit, "dotted"],
            ].map(([k, c, style]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  width: 14,
                  height: 3,
                  background: c,
                  display: "inline-block",
                  borderRadius: 2,
                  borderBottom: style === "dashed" ? "1px dashed #fff" : "none",
                }} />
                <span style={{ textTransform: "capitalize" }}>{k}</span>
              </span>
            ))}
          </div>

          {/* Responsive Recharts Render */}
          <div style={{
            position: "relative",
            height: 220,
            marginBottom: "2rem",
            width: "100%",
          }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
                >
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
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke={COLORS.income}
                    strokeWidth={2}
                    fill="url(#gi)"
                    dot={false}
                  />
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
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-color)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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

      {/* Breakdown Split row view */}
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
        Category breakdown
      </p>
      <div style={{
        display: "grid",
        gridTemplateColumns: pieData.length === 0 ? "1fr" : "1fr 1fr",
        gap: 16,
        alignItems: "center",
        marginBottom: "2rem",
        background: "var(--bg-secondary)",
        padding: "16px",
        borderRadius: 14,
        border: "1px solid var(--border-color)",
        minHeight: 120,
      }}>
        {pieData.length === 0 ? (
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", textAlign: "center", margin: 0, fontStyle: "italic" }}>
            No transaction distribution to chart yet.
          </p>
        ) : (
          <>
            <div style={{ position: "relative", height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[entry.name] || COLORS.other}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => KES(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              justifyContent: "center",
            }}>
              {pieData.slice(0, 5).map((p) => {
                const totalDenominator = summary.totalIncome + summary.totalExpenses || 1;
                const pct = Math.round((p.value / totalDenominator) * 100);
                const IconComponent = renderCategoryIcon(p.name);
                return (
                  <div
                    key={p.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      height: 24,
                    }}
                  >
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: COLORS[p.name] || COLORS.other,
                      flexShrink: 0,
                    }} />
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flex: 1,
                      minWidth: 0,
                      color: "var(--text-secondary)",
                      fontSize: 12,
                    }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        color: "var(--text-tertiary)",
                        flexShrink: 0,
                      }}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </span>
                      <span style={{
                        textTransform: "capitalize",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {p.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      flexShrink: 0,
                    }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* AI Insights Board panel */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 14,
        padding: "16px",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles className="w-4 h-4 text-amber-500" />
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              AI Insights
            </p>
          </div>
          {!insight && (
            <button
              onClick={() => fetchInsights(period, setInsightLoading, setInsight, healthLabel)}
              disabled={insightLoading || !isPreviewMode}
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                cursor: (!isPreviewMode || insightLoading) ? "not-allowed" : "pointer",
                color: "var(--text-secondary)",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "opacity 0.2s",
                opacity: (!isPreviewMode || insightLoading) ? 0.5 : 1
              }}
            >
              {insightLoading ? "Analyzing..." : "Generate"}
            </button>
          )}
        </div>
        {!insight && !insightLoading && (
          <p style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: 0,
            lineHeight: 1.5,
          }}>
            {!isPreviewMode 
              ? "Gemini analysis requires active log streams. Switch on the demo pipeline above to preview structural metrics."
              : "Get a comprehensive real-time financial health analysis powered directly by Gemini."}
          </p>
        )}
        {insightLoading && (
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "8px 0",
          }}>
            <div
              className="pulse-indicator"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#1D9E75",
              }}
            />
            <span style={{
              fontSize: 13,
              color: "var(--text-secondary)",
            }}>Gemini is scanning transaction metrics...</span>
          </div>
        )}
        {insight && isPreviewMode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{
              fontSize: 13,
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.5,
            }}>
              {insight.summary}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insight.insights?.map((ins, i) => {
                const isPos = ins.type === "positive";
                const isWarn = ins.type === "warning";
                const alertBg = isPos
                  ? "rgba(29,158,117,0.1)"
                  : isWarn
                    ? "rgba(216,90,48,0.1)"
                    : "rgba(55,138,221,0.1)";
                const alertColor = isPos
                  ? "#1D9E75"
                  : isWarn
                    ? "#D85A30"
                    : "#378ADD";
                const AlertIcon = isPos
                  ? CheckCircle
                  : isWarn
                    ? AlertTriangle
                    : Lightbulb;

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: alertBg,
                      border: `1px solid ${alertBg}`,
                      alignItems: "flex-start",
                    }}
                  >
                    <AlertIcon
                      style={{
                        width: 16,
                        height: 16,
                        color: alertColor,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    />
                    <span style={{
                      fontSize: 12.5,
                      color: "var(--text-primary)",
                      lineHeight: 1.4,
                    }}>
                      {ins.message}
                    </span>
                  </div>
                );
              })}
            </div>
            {insight.recommendation && (
              <div style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                marginTop: 2,
                paddingLeft: 2,
              }}>
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <p style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  margin: 0,
                  fontStyle: "italic",
                }}>
                  Tip: {insight.recommendation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}