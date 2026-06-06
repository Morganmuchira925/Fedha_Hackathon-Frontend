import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Wallet, Sun, Moon } from "lucide-react";
import { NAV_ITEMS, THEME_STYLES } from "../constants";
import { buildHealth } from "../utils";

export default function Layout({ children, darkMode, setDarkMode, summary, initialData }) {
  const location = useLocation();
  const { healthScore, healthLabel, healthColor } = buildHealth(summary, initialData);

  return (
    <div className={`app-theme-container ${darkMode ? "theme-dark" : "theme-light"}`}>
      <div style={{
        fontFamily: "var(--font-sans)",
        padding: "1.5rem 1.5rem 3rem",
        maxWidth: 720,
        margin: "0 auto",
        minHeight: "100vh",
        color: "var(--text-primary)",
        background: "var(--bg-primary)",
        transition: "background 0.2s frame, color 0.2s",
      }}>
        <h2 className="sr-only">Fedha — Financial Health Dashboard for informal traders</h2>

        {/* Brand Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#1D9E75",
              display: "flex",
              alignItems: "center",
              justifyItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p style={{
                fontWeight: 700,
                fontSize: 18,
                margin: 0,
                trackingTight: "-0.025em",
              }}>FedhaJamii</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Dark Mode Control Toggle button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                padding: "8px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
              }}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-secondary)",
              padding: "6px 12px",
              borderRadius: 20,
              border: "1px solid var(--border-color)",
            }}>
              <div style={{
                height: 8,
                width: 8,
                borderRadius: "50%",
                background: healthColor,
                shrink: 0,
              }} />
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: healthColor,
              }}>{healthLabel}</span>
            </div>
          </div>
        </div>

        {/* Layout Navigation Tabs */}
        <div style={{
          display: "flex",
          gap: 4,
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--border-color)",
          overflowX: "auto",
        }}>
          {NAV_ITEMS.map(({ key, label, Icon }) => {
            const isActive = location.pathname === `/${key}` || (key === "dashboard" && location.pathname === "/");
            return (
              <Link
                key={key}
                to={key === "dashboard" ? "/" : `/${key}`}
                style={{
                  background: "none",
                  border: "none",
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--accent-color)" : "var(--text-secondary)",
                  borderBottom: isActive ? "2px solid var(--accent-color)" : "2px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                  marginBottom: -1,
                  transition: "color 0.15s, border-color 0.15s",
                  textDecoration: "none",
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Page content */}
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          {children}
        </div>

        {/* CSS Custom Injectors representing configuration scopes */}
        <style>{THEME_STYLES}</style>
      </div>
    </div>
  );
}
