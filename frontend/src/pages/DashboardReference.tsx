import { useState, useEffect } from "react";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
type BatchStatus = "Processing" | "Flagged" | "Ready";
 
interface Batch {
  id: string;
  client: string;
  status: BatchStatus;
  progress: number;
  hasError?: boolean;
}
 
interface AIMetric {
  label: string;
  value: number;
  subtitle: string;
  color: string;
}
 
// ─── Data ─────────────────────────────────────────────────────────────────────
 
const BATCHES: Batch[] = [
  { id: "#QB-88291", client: "Global Identity Corp", status: "Processing", progress: 65 },
  { id: "#QB-88304", client: "SecurePass Systems", status: "Flagged", progress: 8, hasError: true },
  { id: "#QB-88310", client: "NextGen Fintech", status: "Ready", progress: 100 },
];
 
const AI_METRICS: AIMetric[] = [
  { label: "Neural Face Verify", value: 88, subtitle: "1,240 faces matching against database...", color: "#a855f7" },
  { label: "OCR Text Extraction", value: 42, subtitle: "Processing latin-1 character set templates...", color: "#a855f7" },
  { label: "Security Threading", value: 12, subtitle: "", color: "#a855f7" },
];
 
// NAV_ITEMS removed — nav items are built inline in Sidebar component
 
// ─── Icons ────────────────────────────────────────────────────────────────────
 
function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IDBuilderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="8" x2="6" y2="8" />
      <line x1="2" y1="12" x2="6" y2="12" /><line x1="2" y1="16" x2="6" y2="16" />
      <path d="M9 5l3-3 3 3" />
    </svg>
  );
}
function BatchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function ClientIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
function AnalyticsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
function ChartBarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
function SupportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IDLayoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}
function ReviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function CheckboxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
 
// ─── Sub-components ───────────────────────────────────────────────────────────
 
function StatusBadge({ status }: { status: BatchStatus }) {
  const config = {
    Processing: { bg: "#1a1a2e", border: "#6366f1", text: "#818cf8", dot: "#6366f1" },
    Flagged: { bg: "#2d1515", border: "#ef4444", text: "#f87171", dot: "#ef4444" },
    Ready: { bg: "#0d2218", border: "#22c55e", text: "#4ade80", dot: "#22c55e" },
  }[status];
 
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: config.bg, border: `1px solid ${config.border}`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, color: config.text, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}
 
function ProgressBar({ value, hasError }: { value: number; hasError?: boolean }) {
  const color = hasError ? "#ef4444" : value === 100 ? "#22c55e" : "#a855f7";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#2a2a3a", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          width: `${value}%`, height: "100%", borderRadius: 99,
          background: hasError ? "#ef4444" : `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: "width 1s ease",
        }} />
      </div>
      <span style={{ fontSize: 12, color: hasError ? "#ef4444" : "#9ca3af", minWidth: 32, textAlign: "right" }}>
        {hasError ? "ERR" : `${value}%`}
      </span>
    </div>
  );
}
 
function AIProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 4, background: "#2a2a3a", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        width: `${value}%`, height: "100%", borderRadius: 99,
        background: `linear-gradient(90deg, ${color}, #7c3aed)`,
        transition: "width 1.2s ease",
      }} />
    </div>
  );
}
 
function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: "#fff", border: "2px solid #1c1c2e",
    }}>
      {initials}
    </div>
  );
}
 
// ─── Sidebar ──────────────────────────────────────────────────────────────────
 
function Sidebar() {
  const [activeItem, setActiveItem] = useState("Dashboard");
 
  const navItems = [
    { icon: <DashboardIcon />, label: "Dashboard" },
    { icon: <IDBuilderIcon />, label: "ID Builder" },
    { icon: <BatchIcon />, label: "Batch Processing" },
    { icon: <ClientIcon />, label: "Client Portal" },
    { icon: <AnalyticsIcon />, label: "Analytics" },
    { icon: <UserIcon />, label: "User Management" },
  ];
 
  return (
    <aside style={{
      width: 230, minWidth: 230, height: "100vh", background: "#13131f",
      display: "flex", flexDirection: "column", padding: "0 0 16px 0",
      borderRight: "1px solid #1e1e2e", position: "fixed", left: 0, top: 0, zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 24px", borderBottom: "1px solid #1e1e2e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: "#7c3aed", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff",
          }}>Q</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>Queuebits</div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 1 }}>ID Management System</div>
          </div>
        </div>
      </div>
 
      {/* New Batch Button */}
      <div style={{ padding: "16px 12px 8px" }}>
        <button style={{
          width: "100%", padding: "10px 0", background: "#7c3aed",
          border: "none", borderRadius: 10, color: "#fff", fontWeight: 600,
          fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6, transition: "background 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#6d28d9")}
          onMouseLeave={e => (e.currentTarget.style.background = "#7c3aed")}
        >
          <PlusIcon /> New Batch Upload
        </button>
      </div>
 
      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => (
          <button key={item.label}
            onClick={() => setActiveItem(item.label)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
              borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
              background: activeItem === item.label ? "#7c3aed" : "transparent",
              color: activeItem === item.label ? "#fff" : "#9ca3af",
              fontSize: 13, fontWeight: 500, transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (activeItem !== item.label) e.currentTarget.style.background = "#1e1e2e"; }}
            onMouseLeave={e => { if (activeItem !== item.label) e.currentTarget.style.background = "transparent"; }}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>
 
      {/* Bottom */}
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ height: 1, background: "#1e1e2e", margin: "8px 0" }} />
        {[{ icon: <SupportIcon />, label: "Support" }, { icon: <SignOutIcon />, label: "Sign Out" }].map(item => (
          <button key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: "#6b7280", fontSize: 13, fontWeight: 500,
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1e1e2e"; e.currentTarget.style.color = "#9ca3af"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; }}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
 
// ─── Topbar ───────────────────────────────────────────────────────────────────
 
function Topbar() {
  return (
    <header style={{
      position: "fixed", top: 0, left: 230, right: 0, zIndex: 9,
      height: 60, background: "#13131f", borderBottom: "1px solid #1e1e2e",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px",
    }}>
      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#1a1a2a", border: "1px solid #2a2a3a", borderRadius: 10,
        padding: "8px 14px", width: 300, color: "#6b7280",
      }}>
        <SearchIcon />
        <input placeholder="Search orders or batches..." style={{
          background: "transparent", border: "none", outline: "none",
          color: "#9ca3af", fontSize: 13, width: "100%",
        }} />
      </div>
 
      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {[<BellIcon />, <GearIcon />].map((icon, i) => (
          <button key={i} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "#6b7280", padding: 6, borderRadius: 8,
            transition: "color 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#a855f7")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
          >
            {icon}
          </button>
        ))}
        <div style={{ width: 1, height: 24, background: "#2a2a3a" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: "#7c3aed",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>AU</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Vincent</div>
            <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600, letterSpacing: "0.5px" }}>SUPER ADMIN</div>
          </div>
        </div>
      </div>
    </header>
  );
}
 
// ─── Dashboard Header ─────────────────────────────────────────────────────────
 
function DashboardHeader() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", margin: 0, letterSpacing: "-1px" }}>
          Operator Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "6px 0 0", fontWeight: 400 }}>
          Welcome back. You have{" "}
          <span style={{ color: "#f1f5f9", fontWeight: 700 }}>12</span>{" "}
          assigned batches requiring review.
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {[{ i: "JD", c: "#7c3aed" }, { i: "AS", c: "#06b6d4" }].map((a, idx) => (
            <div key={a.i} style={{ marginLeft: idx === 0 ? 0 : -8 }}>
              <Avatar initials={a.i} color={a.c} />
            </div>
          ))}
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: "#2a2a3a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "#9ca3af", fontWeight: 600, marginLeft: -8,
            border: "2px solid #1c1c2e",
          }}>+3</div>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
          background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8,
          color: "#d1d5db", fontSize: 13, fontWeight: 500, cursor: "pointer",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#2a2a3a"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#1e1e2e"; }}
        >
          <ShareIcon /> Share View
        </button>
      </div>
    </div>
  );
}
 
// ─── Active Queue Table ───────────────────────────────────────────────────────
 
function ActiveQueue() {
  return (
    <div style={{
      background: "#16162a", border: "1px solid #1e1e2e", borderRadius: 14,
      padding: 22, flex: 1,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckboxIcon />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Active Queue</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.5px" }}>FILTER BY: STATUS</span>
          <FilterIcon />
        </div>
      </div>
 
      {/* Table Header */}
      <div style={{
        display: "grid", gridTemplateColumns: "1.2fr 1.6fr 1fr 1.4fr 0.8fr",
        padding: "0 8px 10px", borderBottom: "1px solid #1e1e2e",
      }}>
        {["BATCH ID", "CLIENT", "STATUS", "PROGRESS", "ACTION"].map(col => (
          <span key={col} style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: "0.8px" }}>{col}</span>
        ))}
      </div>
 
      {/* Rows */}
      {BATCHES.map((batch, i) => (
        <div key={batch.id} style={{
          display: "grid", gridTemplateColumns: "1.2fr 1.6fr 1fr 1.4fr 0.8fr",
          padding: "14px 8px", alignItems: "center",
          borderBottom: i < BATCHES.length - 1 ? "1px solid #1a1a2a" : "none",
          transition: "background 0.15s", cursor: "pointer", borderRadius: 8,
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#1a1a2e")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: 13, color: "#a855f7", fontWeight: 600, fontFamily: "monospace" }}>{batch.id}</span>
          <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{batch.client}</span>
          <span><StatusBadge status={batch.status} /></span>
          <div style={{ paddingRight: 12 }}><ProgressBar value={batch.progress} hasError={batch.hasError} /></div>
          <button style={{
            padding: "5px 12px", background: "#1e1e2e", border: "1px solid #2a2a3a",
            borderRadius: 6, color: "#9ca3af", fontSize: 11, fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.color = "#a855f7"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3a"; e.currentTarget.style.color = "#9ca3af"; }}
          >
            View
          </button>
        </div>
      ))}
    </div>
  );
}
 
// ─── Real-time AI Panel ───────────────────────────────────────────────────────
 
function RealTimeAI() {
  const [metrics, setMetrics] = useState(AI_METRICS);
 
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: Math.min(99, Math.max(5, m.value + (Math.random() > 0.5 ? 1 : -1))),
      })));
    }, 2500);
    return () => clearInterval(interval);
  }, []);
 
  return (
    <div style={{
      width: 280, minWidth: 280, background: "#16162a",
      border: "1px solid #1e1e2e", borderRadius: 14, padding: 22,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <ChartBarIcon />
        <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Real-time AI</span>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
          boxShadow: "0 0 6px #22c55e", marginLeft: "auto",
          animation: "pulse 2s ease-in-out infinite",
        }} />
      </div>
 
      {/* Metrics */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#d1d5db", fontWeight: 500 }}>{m.label}</span>
              <span style={{ fontSize: 13, color: "#a855f7", fontWeight: 700 }}>{m.value}%</span>
            </div>
            <AIProgressBar value={m.value} color={m.color} />
            {m.subtitle && (
              <p style={{ margin: "5px 0 0", fontSize: 10, color: "#4b5563", fontStyle: "italic" }}>{m.subtitle}</p>
            )}
          </div>
        ))}
      </div>
 
      {/* Stats Row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
        padding: "16px", background: "#0f0f1a", borderRadius: 10,
        border: "1px solid #1e1e2e", marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>4.2k</div>
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, letterSpacing: "0.5px", marginTop: 2 }}>PROCESSED TODAY</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f97316" }}>12</div>
          <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, letterSpacing: "0.5px", marginTop: 2 }}>ANOMALIES</div>
        </div>
      </div>
 
      {/* System Health */}
      <div>
        <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, letterSpacing: "1px", marginBottom: 12 }}>SYSTEM HEALTH</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Server Latency", value: "14ms", color: "#22c55e" },
            { label: "GPU Node 1", value: "Active", color: "#f1f5f9", bold: true },
            { label: "Storage Capacity", value: "72%", color: "#d1d5db" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>{item.label}</span>
              <span style={{ fontSize: 13, color: item.color, fontWeight: item.bold ? 700 : 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
 
// ─── Quick Action Cards ───────────────────────────────────────────────────────
 
function QuickActionCards() {
  const cards = [
    {
      icon: <IDLayoutIcon />,
      title: "ID Layout Builder",
      description: "Design biometric cards and credential templates with drag-and-drop ease.",
    },
    {
      icon: <ReviewIcon />,
      title: "Review Queue",
      description: "Manually inspect flagged batches and approve high-priority security IDs.",
    },
  ];
 
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
      {cards.map(card => (
        <div key={card.title} style={{
          background: "#16162a", border: "1px solid #1e1e2e", borderRadius: 14,
          padding: 20, display: "flex", alignItems: "flex-start", gap: 14,
          cursor: "pointer", transition: "all 0.2s",
        }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#7c3aed";
            e.currentTarget.style.background = "#1a1a2e";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "#1e1e2e";
            e.currentTarget.style.background = "#16162a";
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 10, background: "#1e1e2e",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#a855f7", flexShrink: 0,
          }}>
            {card.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{card.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
 
// ─── Main App ─────────────────────────────────────────────────────────────────
 
export default function QueuebitsDashboard() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'DM Sans', sans-serif; background: #0f0f1a; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 99px; }
      `}</style>
 
      <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f1a", fontFamily: "'DM Sans', sans-serif" }}>
        <Sidebar />
 
        <div style={{ marginLeft: 230, flex: 1, display: "flex", flexDirection: "column" }}>
          <Topbar />
 
          <main style={{ marginTop: 60, padding: "32px 28px", flex: 1 }}>
            <DashboardHeader />
 
            {/* Main content grid */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              {/* Left column */}
              <div style={{ flex: 1 }}>
                <ActiveQueue />
                <QuickActionCards />
              </div>
 
              {/* Right panel */}
              <RealTimeAI />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}