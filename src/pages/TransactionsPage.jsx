import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { KES, API_BASE } from "../constants";
import { generateData, normalizeTransaction, renderCategoryIcon, renderSourceIcon } from "../utils";

export default function TransactionsPage() {
  const { getToken } = useAuth();
  const [recentTxns, setRecentTxns] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const token = await getToken();
        const resp = await fetch(`${API_BASE}/api/transactions?limit=100`, {  // Increased limit for better client-side pagination/search
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          const txns = (data.transactions || []).map(normalizeTransaction);
          setRecentTxns(txns);
        } else {
          setRecentTxns([]);
        }
      } catch {
        setRecentTxns([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, [getToken]);

  // Combined filtering (type + search)
  const filteredTxns = useMemo(() => {
    return recentTxns.filter((t) => {
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Income" && t.type === "income") ||
        (activeFilter === "Expense" && t.type === "expense");

      const matchesSearch =
        !searchTerm ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.source?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [recentTxns, activeFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredTxns.length / ITEMS_PER_PAGE);
  const paginatedTxns = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTxns.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTxns, currentPage]);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is live (onChange), but you can keep this for "Search" button if desired
  };

  return (
    <>
      {/* Header with search and filters */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: "280px" }}>
            <div style={{
              display: "flex",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: "4px",
            }}>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  padding: "8px 12px",
                  fontSize: 14,
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: 10,
                  padding: "6px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters */}
          <div style={{
            display: "flex",
            gap: 4,
            background: "var(--bg-secondary)",
            padding: 2,
            borderRadius: 20,
            border: "1px solid var(--border-color)",
          }}>
            {["All", "Income", "Expense"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  background: f === activeFilter ? "var(--bg-primary)" : "transparent",
                  border: "none",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 13,
                  cursor: "pointer",
                  color: f === activeFilter ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: f === activeFilter ? 600 : 500,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>
          {loading ? "Loading..." : `${filteredTxns.length} records found`}
        </p>
      </div>

      {/* Transactions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
            Loading transactions...
          </div>
        ) : paginatedTxns.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px", 
            color: "var(--text-secondary)",
            fontSize: 14
          }}>
            No transactions found. Try adjusting your search or filters.
          </div>
        ) : (
          paginatedTxns.map((t) => {
            const isInc = t.type === "income";
            const IconComponent = renderCategoryIcon(t.category);
            const SourceIconComponent = renderSourceIcon(t.source);

            return (
              <div
                key={t.id || t._id}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 12,
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxSizing: "border-box",
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: isInc ? "rgba(29,158,117,0.1)" : "rgba(216,90,48,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isInc ? "#1D9E75" : "#D85A30",
                }}>
                  <IconComponent className="w-4 h-4" />
                </div>

                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <p style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    margin: 0,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
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
          })
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          marginTop: "2rem",
          flexWrap: "wrap",
        }}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid var(--border-color)",
              background: currentPage === 1 ? "var(--bg-secondary)" : "var(--bg-primary)",
              color: currentPage === 1 ? "var(--text-secondary)" : "var(--text-primary)",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            Previous
          </button>

          <div style={{ display: "flex", gap: "4px" }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages));
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    background: pageNum === currentPage ? "var(--bg-primary)" : "transparent",
                    color: pageNum === currentPage ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: pageNum === currentPage ? 600 : 500,
                    cursor: "pointer",
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid var(--border-color)",
              background: currentPage === totalPages ? "var(--bg-secondary)" : "var(--bg-primary)",
              color: currentPage === totalPages ? "var(--text-secondary)" : "var(--text-primary)",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            Next
          </button>

          <span style={{ marginLeft: "12px", fontSize: 13, color: "var(--text-secondary)" }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
    </>
  );
}