import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { KES, API_BASE } from "../constants";
import { generateData, normalizeTransaction, renderCategoryIcon, renderSourceIcon } from "../utils";

const fallbackData = generateData();

export default function TransactionsPage() {
  const { getToken } = useAuth();
  const [recentTxns, setRecentTxns] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const token = await getToken();
        const resp = await fetch(`${API_BASE}/api/transactions?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          const txns = (data.transactions || []).map(normalizeTransaction);
          setRecentTxns(txns.length ? txns : fallbackData.transactions.slice(0, 20));
        } else {
          setRecentTxns(fallbackData.transactions.slice(0, 20));
        }
      } catch {
        setRecentTxns(fallbackData.transactions.slice(0, 20));
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const filteredTxns = recentTxns.filter((t) => {
    if (activeFilter === "Income") return t.type === "income";
    if (activeFilter === "Expense") return t.type === "expense";
    return true;
  });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>
          {loading ? "Loading..." : `${filteredTxns.length} records logged`}
        </p>
        <div style={{
          display: "flex", gap: 4, background: "var(--bg-secondary)",
          padding: 2, borderRadius: 20, border: "1px solid var(--border-color)",
        }}>
          {["All", "Income", "Expense"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: f === activeFilter ? "var(--bg-primary)" : "transparent",
                border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 11.5, cursor: "pointer",
                color: f === activeFilter ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: f === activeFilter ? 600 : 500,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredTxns.map((t) => {
          const isInc = t.type === "income";
          const IconComponent = renderCategoryIcon(t.category);
          const SourceIconComponent = renderSourceIcon(t.source);

          return (
            <div
              key={t.id || t._id}
              style={{
                background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                borderRadius: 12, padding: "12px", display: "flex", alignItems: "center",
                gap: 12, boxSizing: "border-box",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: isInc ? "rgba(29,158,117,0.1)" : "rgba(216,90,48,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isInc ? "#1D9E75" : "#D85A30",
              }}>
                <IconComponent className="w-4 h-4" />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <p style={{
                  fontSize: 13.5, fontWeight: 600, margin: 0, color: "var(--text-primary)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {t.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--text-tertiary)", fontSize: 11 }}>
                    <SourceIconComponent className="w-3.5 h-3.5" />
                    <span style={{ textTransform: "capitalize" }}>{t.source.replace("_", " ")}</span>
                  </div>
                  <span style={{ color: "var(--border-color)", fontSize: 10 }}>•</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "capitalize" }}>{t.category}</span>
                  <span style={{ color: "var(--border-color)", fontSize: 10 }}>•</span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{t.date}</span>
                </div>
              </div>

              <p style={{ fontSize: 14, fontWeight: 700, margin: 0, flexShrink: 0, color: isInc ? "#1D9E75" : "#D85A30" }}>
                {isInc ? "+" : "−"}{KES(t.amount)}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}