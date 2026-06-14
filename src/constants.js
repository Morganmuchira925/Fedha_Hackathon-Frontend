import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  LayoutDashboard,
  Mic,
  Camera,
  ClipboardList,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  UploadCloud,
  Search,
  ScanBarcode,
  Moon,
  Sun,
  ChevronRight,
  Info,
  Car,
  ShoppingBag,
  Home,
  Lightbulb as UtilityIcon,
  Briefcase,
  Package,
  FileText,
  MousePointer,
  HelpCircle,
  Apple,
} from "lucide-react";

export const API_BASE = import.meta.env.VITE_API_URL || "";
// export const USER_ID = "demo_user";

export const KES = (n) => `KES ${Math.round(n).toLocaleString()}`;

export const COLORS = {
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

export const CATEGORY_ICONS = {
  produce: Apple,
  groceries: ShoppingBag,
  transport: Car,
  livestock: HelpCircle,
  services: UtilityIcon,
  rent: Home,
  utilities: UtilityIcon,
  salary: Briefcase,
  other: Package,
};

export const SOURCE_ICONS = {
  voice: Mic,
  receipt_scan: Camera,
  manual: MousePointer,
};

export const THEME_STYLES = `
  /* Dynamic Theme System Variables Configuration */
  .theme-dark {
    --bg-primary: #0B0F19;
    --bg-secondary: #131A2C;
    --border-color: #1E293B;
    --text-primary: #F8FAFC;
    --text-secondary: #94A3B8;
    --text-tertiary: #64748B;
    --accent-color: #1D9E75;
    --grid-color: rgba(255, 255, 255, 0.04);
  }

  .theme-light {
    --bg-primary: #FAFAFA;
    --bg-secondary: #FFFFFF;
    --border-color: #E5E7EB;
    --text-primary: #111827;
    --text-secondary: #4B5563;
    --text-tertiary: #9CA3AF;
    --accent-color: #1D9E75;
    --grid-color: rgba(0, 0, 0, 0.04);
  }

  /* Transitions and Global Classes */
  .app-theme-container {
    min-height: 100vh;
    background: var(--bg-primary);
  }
  
  .sr-only { 
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; 
    overflow: hidden; clip: rect(0,0,0,0); border: 0; 
  }

  button {
    transition: opacity 0.15s ease, transform 0.1s ease;
  }

  button:hover { 
    opacity: 0.9; 
  }

  button:active {
    transform: scale(0.98);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(2px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse { 
    0%, 100% { opacity: 1; } 
    50% { opacity: 0.4; } 
  }

  .pulse-indicator {
    animation: pulse 1.6s infinite ease-in-out;
  }

  /* Responsive Scrollbar configurations for inner Tab tracking lists */
  div::-webkit-scrollbar {
    height: 4px;
  }
  div::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }
`;

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "voice", label: "Voice log", Icon: Mic },
  { key: "receipts", label: "Receipts", Icon: Camera },
  { key: "transactions", label: "Transactions", Icon: ClipboardList },
];
