/* UPDATED LAYOUT COMPONENT */
import { useLocation, Link } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { Wallet, Sun, Moon } from "lucide-react";
import { NAV_ITEMS, THEME_STYLES } from "../constants";

export default function Layout({ children, darkMode, setDarkMode }) {
  const location = useLocation();

  return (
    <div className={`app-theme-container ${darkMode ? "theme-dark" : "theme-light"}`}>
      {/* Global CSS Overrides */}
      <style>{`
        ${THEME_STYLES}
        
        .nav-tooltip {
          position: relative;
        }
        .nav-tooltip::after {
          content: attr(data-label);
          position: absolute;
          bottom: -2.2rem;
          left: 50%;
          transform: translateX(-50%) scale(0.85);
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 0.0625rem solid var(--border-color);
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: transform 0.15s ease, opacity 0.15s ease;
          box-shadow: 0 0.25rem 0.75rem rgba(0,0,0,0.15);
          z-index: 10;
        }
        .nav-tooltip:hover::after {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }

        /* Tablet Viewports */
        @media (max-width: 48rem) { 
          .brand-text { display: none !important; }
          .nav-link-text { display: none !important; }
          .nav-container { gap: 0.5rem !important; }
          .navbar-wrapper { padding: 0.5rem 0.75rem !important; }
        }

        /* Mobile Viewports Fix: Repositions center links and anchors the Profile icon */
        @media (max-width: 34rem) {
          .navbar-wrapper {
            flex-wrap: wrap !important;
            padding: 0.75rem !important;
            gap: 0.75rem !important;
          }
          
          /* Forces center nav-container onto its own full-width row below the logo and profile */
          .nav-container {
            order: 3 !important;
            width: 100% !important;
            justify-content: space-around !important;
            margin-top: 0.25rem;
          }

          .nav-tooltip {
            flex: 1 !important;
            justify-content: center !important;
            padding: 0.5rem !important;
          }
        }
      `}</style>

      <div style={{
        fontFamily: "var(--font-sans)",
        padding: "1rem 2rem 3rem",
        maxWidth: "90rem", 
        margin: "0 auto",
        minHeight: "100vh",
        color: "var(--text-primary)",
        background: "var(--bg-primary)",
        transition: "background 0.2s ease, color 0.2s ease",
      }}>
        
        {/* Navbar */}
        <nav className="navbar-wrapper" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.625rem 0.875rem",
          background: "var(--bg-secondary)",
          border: "0.0625rem solid var(--border-color)",
          borderRadius: "1rem",
          marginBottom: "2rem",
          gap: "1rem",
        }}>
          
          {/* Brand Ingestion Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ 
              width: "2.125rem", height: "2.125rem", borderRadius: "0.5rem", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" 
            }}>
              <Wallet style={{ width: "1.125rem", height: "1.125rem" }} />
            </div>
            <span className="brand-text" style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>
              FedhaJamii
            </span>
          </div>

          {/* Navigation Link Segment Container */}
          <div className="nav-container" style={{
            display: "flex", alignItems: "center", gap: "0.375rem", background: "var(--bg-primary)", padding: "0.25rem", borderRadius: "0.75rem", border: "0.0625rem solid var(--border-color)",
          }}>
            {NAV_ITEMS?.map(({ key, label, Icon }) => {
              const targetPath = key === "dashboard" ? "/dashboard" : `/dashboard/${key}`;
              const isActive = location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);

              return (
                <Link key={key} to={targetPath} className="nav-tooltip" data-label={label} style={{
                  padding: "0.375rem 0.75rem", fontSize: "0.78rem", textDecoration: "none", fontWeight: isActive ? 600 : 500, color: isActive ? "#fff" : "var(--text-secondary)", background: isActive ? "#1D9E75" : "transparent", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem", transition: "all 0.15s ease"
                }}>
                  <Icon style={{ width: "0.875rem", height: "0.875rem" }} />
                  <span className="nav-link-text">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Action Controllers + Profile Icon Wrapper */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: "var(--bg-primary)", border: "0.0625rem solid var(--border-color)", padding: "0.4375rem", borderRadius: "50%", cursor: "pointer", display: "flex", color: "var(--text-secondary)", alignItems: "center", justifyContent: "center" }}>
              {darkMode ? <Sun style={{ width: "0.875rem", height: "0.875rem" }} className="text-amber-400" /> : <Moon style={{ width: "0.875rem", height: "0.875rem" }} />}
            </button>
            <div style={{ display: "flex", alignItems: "center", borderLeft: "0.0625rem solid var(--border-color)", paddingLeft: "0.75rem", height: "1.5rem" }}>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </nav>

        <div style={{ animation: "fadeIn 0.2s ease", padding: "0 0.25rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
}