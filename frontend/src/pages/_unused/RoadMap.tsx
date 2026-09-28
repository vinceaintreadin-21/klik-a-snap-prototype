import { useState } from "react";

const ROLES = [
  {
    id: "admin",
    label: "Admin",
    badge: "SUPER ADMIN",
    accent: "#7c3aed",
    accentLight: "#a855f7",
    accentBg: "rgba(124,58,237,0.08)",
    accentBorder: "rgba(124,58,237,0.3)",
    icon: "⬡",
    description: "Full platform control — manages operators, institutions, system-wide analytics, and processing infrastructure.",
    phases: [
      {
        phase: "Phase 1",
        label: "Core Shell",
        status: "in-progress",
        items: [
          { name: "Dashboard Overview", desc: "Stats cards: total orders, active operators, institutions, anomalies. System health monitor.", done: true },
          { name: "Sidebar + Topbar", desc: "Fixed navigation with role-specific nav items, admin avatar badge, notification bell.", done: true },
          { name: "Design System Tokens", desc: "CSS variables, typography scale, color palette, spacing, border radius, shadows.", done: true },
        ],
      },
      {
        phase: "Phase 2",
        label: "Operator & Institution Management",
        status: "in-progress",
        items: [
          { name: "Manage Operators", desc: "Table: operator ID, name, assigned batches, status. Invite, deactivate, reassign actions.", done: false },
          { name: "Manage Institutions", desc: "Institution list with order volume, active status, last activity. Create & edit institution modal.", done: false },
          { name: "User Management", desc: "Full user table with role assignment, account status toggle, reset password.", done: false },
        ],
      },
      {
        phase: "Phase 3",
        label: "Orders & Processing",
        status: "planned",
        items: [
          { name: "System Orders", desc: "Global order queue: all roles, all institutions. Filter by status, institution, date range.", done: false },
          { name: "Processing Logs", desc: "Timestamped audit trail: batch events, AI decisions, operator actions, system errors.", done: false },
          { name: "Batch Monitoring", desc: "Real-time view of all active batches. Neural Face Verify, OCR, Security Threading metrics.", done: false },
        ],
      },
      {
        phase: "Phase 4",
        label: "Analytics & Reporting",
        status: "planned",
        items: [
          { name: "Analytics Dashboard", desc: "Charts: orders over time, processing success rate, anomaly frequency, operator throughput.", done: false },
          { name: "Export Reports", desc: "CSV/PDF export for system logs, order summaries, institution activity.", done: false },
          { name: "Alert Configuration", desc: "Set thresholds for anomaly alerts, storage warnings, latency spikes.", done: false },
        ],
      },
      {
        phase: "Phase 5",
        label: "System Config",
        status: "future",
        items: [
          { name: "Role Permission Matrix", desc: "Granular permissions editor — toggle capabilities per role.", done: false },
          { name: "AI Model Settings", desc: "Configure Face Verify sensitivity, OCR language sets, security threading parameters.", done: false },
          { name: "Infrastructure Monitor", desc: "GPU nodes, server latency, storage capacity gauges with alerting.", done: false },
        ],
      },
    ],
  },
  {
    id: "operator",
    label: "Operator",
    badge: "OPERATOR",
    accent: "#6366f1",
    accentLight: "#818cf8",
    accentBg: "rgba(99,102,241,0.08)",
    accentBorder: "rgba(99,102,241,0.3)",
    icon: "◈",
    description: "Processes assigned ID batches — runs AI pipelines, reviews flagged items, and builds ID layouts.",
    phases: [
      {
        phase: "Phase 1",
        label: "Core Shell",
        status: "in-progress",
        items: [
          { name: "Operator Dashboard", desc: "Active queue table: batch ID, client, status, progress. Assigned batches count.", done: true },
          { name: "Real-time AI Panel", desc: "Live Neural Face Verify, OCR Text Extraction, Security Threading metrics with pulse indicator.", done: true },
          { name: "Quick Action Cards", desc: "ID Layout Builder shortcut, Review Queue shortcut with hover states.", done: true },
        ],
      },
      {
        phase: "Phase 2",
        label: "Batch Processing",
        status: "in-progress",
        items: [
          { name: "Batch Upload Interface", desc: "Drag-and-drop file upload zone, batch naming, client assignment, format validation.", done: false },
          { name: "Batch Detail View", desc: "Per-batch breakdown: individual ID entries, photo thumbnails, processing status per record.", done: false },
          { name: "Processing History", desc: "Completed batches log with timestamps, success rate, error count, downloadable summary.", done: false },
        ],
      },
      {
        phase: "Phase 3",
        label: "Manual Review",
        status: "planned",
        items: [
          { name: "Flagged Items Queue", desc: "Side-by-side photo comparison: submitted vs processed. Approve, reject, or request resubmission.", done: false },
          { name: "Anomaly Inspector", desc: "Face match confidence score breakdown, OCR field extraction review, manual override.", done: false },
          { name: "Batch Approval Flow", desc: "Final review step before batch is marked Ready — sign-off with operator credential.", done: false },
        ],
      },
      {
        phase: "Phase 4",
        label: "ID Layout Builder",
        status: "planned",
        items: [
          { name: "Canvas Editor", desc: "Drag-and-drop canvas for ID card layout — photo zone, text fields, barcode/QR placement.", done: false },
          { name: "Template Library", desc: "Pre-built ID templates by institution type. Save, duplicate, archive templates.", done: false },
          { name: "Field Mapping", desc: "Map data fields (name, ID number, photo) to canvas zones. Preview with sample data.", done: false },
        ],
      },
      {
        phase: "Phase 5",
        label: "Reporting",
        status: "future",
        items: [
          { name: "Operator Performance Stats", desc: "Personal metrics: batches processed, avg processing time, error rate, approval rate.", done: false },
          { name: "Error Pattern Analysis", desc: "Common failure types, recurring flagged patterns, suggested workflow improvements.", done: false },
        ],
      },
    ],
  },
  {
    id: "institution",
    label: "Institution",
    badge: "INSTITUTION",
    accent: "#06b6d4",
    accentLight: "#22d3ee",
    accentBg: "rgba(6,182,212,0.08)",
    accentBorder: "rgba(6,182,212,0.3)",
    icon: "◉",
    description: "Submits and tracks ID orders — manages student photo submissions, proofing, and final ID downloads.",
    phases: [
      {
        phase: "Phase 1",
        label: "Core Shell",
        status: "planned",
        items: [
          { name: "Institution Dashboard", desc: "My Orders summary: active orders, pending proofing, completed this month. Recent activity feed.", done: false },
          { name: "Sidebar Navigation", desc: "Cyan-accented nav: My Orders, Create Order, Order History, Proofing Queue, Download IDs, Settings.", done: false },
        ],
      },
      {
        phase: "Phase 2",
        label: "Order Management",
        status: "planned",
        items: [
          { name: "Create Order Form", desc: "Multi-step form: institution details, student list upload (CSV), ID template selection, submission.", done: false },
          { name: "Order History Table", desc: "All orders with status pipeline: PENDING → PROCESSING → PROOFING → APPROVED → PRINTING → COMPLETED.", done: false },
          { name: "Order Detail View", desc: "Per-order breakdown: individual student records, photo status, processing notes from operator.", done: false },
        ],
      },
      {
        phase: "Phase 3",
        label: "Proofing Queue",
        status: "planned",
        items: [
          { name: "Proofing Gallery", desc: "Grid of processed ID proofs. Approve individually or bulk-approve. Flag issues with comments.", done: false },
          { name: "Proof Comparison", desc: "Side-by-side: submitted photo vs processed ID card preview. Zoom, annotate, approve or reject.", done: false },
          { name: "Revision Requests", desc: "Request reprocessing per student with typed reason. Tracks revision rounds.", done: false },
        ],
      },
      {
        phase: "Phase 4",
        label: "Downloads & Delivery",
        status: "future",
        items: [
          { name: "Download IDs", desc: "Bulk download completed IDs as ZIP. Filter by batch, date, or individual student.", done: false },
          { name: "Delivery Status Tracker", desc: "Track physical ID card delivery status if printing + shipping is enabled.", done: false },
          { name: "Re-order Interface", desc: "Re-order lost/damaged IDs for specific students from existing approved records.", done: false },
        ],
      },
      {
        phase: "Phase 5",
        label: "Settings",
        status: "future",
        items: [
          { name: "Institution Profile", desc: "Edit institution name, logo, contact info. Manage sub-accounts (coordinators).", done: false },
          { name: "Notification Preferences", desc: "Configure email/in-app alerts for order status changes, proofing ready, downloads available.", done: false },
        ],
      },
    ],
  },
  {
    id: "coordinator",
    label: "Coordinator",
    badge: "COORDINATOR",
    accent: "#22c55e",
    accentLight: "#4ade80",
    accentBg: "rgba(34,197,94,0.08)",
    accentBorder: "rgba(34,197,94,0.3)",
    icon: "◎",
    description: "On-the-ground operations — registers walk-in students, looks up photo status, and scans QR codes.",
    phases: [
      {
        phase: "Phase 1",
        label: "Core Shell",
        status: "planned",
        items: [
          { name: "Coordinator Dashboard", desc: "Active orders for their institution, today's registration count, walk-in queue size.", done: false },
          { name: "Mobile-First Layout", desc: "Responsive sidebar collapses on mobile. Optimized for tablet/phone use at registration desks.", done: false },
        ],
      },
      {
        phase: "Phase 2",
        label: "Student Management",
        status: "planned",
        items: [
          { name: "Student Search", desc: "Search by name, student ID, or order number. Returns photo status, ID readiness.", done: false },
          { name: "Walk-in Registration", desc: "Quick registration form: student details, photo capture or upload, order assignment.", done: false },
          { name: "Photo Status Tracker", desc: "Per-student photo pipeline: UPLOADED → PROCESSING → PROCESSED → MANUAL_REVIEW → FAILED.", done: false },
        ],
      },
      {
        phase: "Phase 3",
        label: "QR & Verification",
        status: "planned",
        items: [
          { name: "QR Code Lookup", desc: "Scan or enter QR code to pull up student ID record instantly. Verify ID authenticity.", done: false },
          { name: "ID Verification View", desc: "Full ID card preview with validity status, issue date, expiry, institution watermark check.", done: false },
        ],
      },
      {
        phase: "Phase 4",
        label: "Coordination Tools",
        status: "future",
        items: [
          { name: "Daily Registration Report", desc: "End-of-day summary: registrations completed, photos uploaded, issues flagged.", done: false },
          { name: "Bulk Photo Upload", desc: "Upload multiple student photos at once with CSV mapping for batch registration events.", done: false },
          { name: "Offline Mode", desc: "Cache recent records for use in low-connectivity environments. Sync when reconnected.", done: false },
        ],
      },
    ],
  },
];

const STATUS_CONFIG = {
  "in-progress": { label: "In Progress", color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.3)" },
  planned: { label: "Planned", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)" },
  future: { label: "Future", color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
};

function CheckIcon({ done, accent }: { done: boolean; accent: string }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
      background: done ? accent : "transparent",
      border: `2px solid ${done ? accent : "#2a2a3a"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.2s",
    }}>
      {done && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function PhaseCard({ phase, accent }: {phase: (typeof ROLES)[0]['phases'][0]; accent: string }) {
  const st = STATUS_CONFIG[phase.status as keyof typeof STATUS_CONFIG];
  const doneCount = phase.items.filter(i => i.done).length;
  const total = phase.items.length;

  return (
    <div style={{
      background: "#16162a", border: "1px solid #1e1e2e", borderRadius: 12,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = accent + "55")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1e2e")}
    >
      {/* Phase header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.5px", fontFamily: "monospace" }}>{phase.phase}</span>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#2a2a3a", display: "inline-block" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{phase.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#6b7280" }}>{doneCount}/{total}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            color: st.color, background: st.bg, border: `1px solid ${st.border}`,
            letterSpacing: "0.3px",
          }}>{st.label}</span>
        </div>
      </div>

      {/* Progress track */}
      <div style={{ height: 3, background: "#1a1a2a", borderRadius: 99 }}>
        <div style={{
          height: "100%", borderRadius: 99, width: `${(doneCount / total) * 100}%`,
          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
          transition: "width 0.8s ease",
        }} />
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {phase.items.map((item: { name: string; desc: string; done: boolean }) => (
          <div key={item.name} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <CheckIcon done={item.done} accent={accent} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: item.done ? "#f1f5f9" : "#9ca3af", marginBottom: 2 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleTab({ role, active, onClick }: { role: (typeof ROLES)[0]; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer",
      background: active ? role.accentBg : "transparent",
      outline: active ? `1px solid ${role.accentBorder}` : "1px solid transparent",
      color: active ? role.accentLight : "#6b7280",
      fontSize: 13, fontWeight: 600, transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "#1a1a2a"; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.background = "transparent"; } }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{role.icon}</span>
      {role.label}
      <span style={{
        fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
        background: active ? role.accentBorder : "#1e1e2e",
        color: active ? role.accentLight : "#4b5563",
        letterSpacing: "0.5px",
      }}>{role.badge}</span>
    </button>
  );
}

function ProgressSummary({ role }: { role: (typeof ROLES)[0] }) {
  const allItems = role.phases.flatMap(p => p.items);
  const done = allItems.filter(i => i.done).length;
  const total = allItems.length;
  const pct = Math.round((done / total) * 100);
  const phasesDone = role.phases.filter(p => p.items.every(i => i.done)).length;

  return (
    <div style={{
      background: role.accentBg, border: `1px solid ${role.accentBorder}`,
      borderRadius: 12, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
      marginBottom: 24,
    }}>
      {/* Role identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: role.accent, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 20, color: "#fff",
        }}>{role.icon}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{role.label} Dashboard</div>
          <div style={{ fontSize: 11, color: role.accentLight, fontWeight: 600, letterSpacing: "0.3px" }}>{role.badge}</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#9ca3af", maxWidth: 300, lineHeight: 1.5, flex: 2 }}>{role.description}</div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
        {[
          { label: "PHASES", value: `${phasesDone}/${role.phases.length}` },
          { label: "FEATURES", value: `${done}/${total}` },
          { label: "PROGRESS", value: `${pct}%` },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: role.accentLight }}>{s.value}</div>
            <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700, letterSpacing: "0.8px", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {Object.entries(STATUS_CONFIG).map(([key, val]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: val.color }} />
          <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{val.label}</span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2a2a3a", border: "2px solid #2a2a3a" }} />
        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Not Started</span>
      </div>
    </div>
  );
}

export default function KlikASnapRoadmap() {
  const [activeRole, setActiveRole] = useState("admin");
  const role = ROLES.find(r => r.id === activeRole);

  if (!role) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0f1a; font-family: 'DM Sans', sans-serif; color: #e2e8f0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 99px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0f0f1a", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{
          background: "#13131f", borderBottom: "1px solid #1e1e2e",
          padding: "20px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, background: "#7c3aed", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#fff",
            }}>Q</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Klik-a-Snap</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>ID Management Platform</div>
            </div>
            <div style={{ width: 1, height: 28, background: "#1e1e2e", margin: "0 8px" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" }}>Dashboard Roadmap</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>v1.0 · May 2026</div>
            </div>
          </div>
          <Legend />
        </div>

        <div style={{ padding: "28px 32px", maxWidth: 1280, margin: "0 auto" }}>

          {/* Role Tabs */}
          <div style={{
            display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap",
            background: "#13131f", padding: 6, borderRadius: 12,
            border: "1px solid #1e1e2e", width: "fit-content",
          }}>
            {ROLES.map(r => (
              <RoleTab key={r.id} role={r} active={activeRole === r.id} onClick={() => setActiveRole(r.id)} />
            ))}
          </div>

          {/* Summary Banner */}
          <ProgressSummary role={role} />

          {/* Phase Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}>
            {role.phases.map(phase => (
              <PhaseCard key={phase.phase} phase={phase} accent={role.accent} />
            ))}
          </div>

          {/* All Roles Overview */}
          <div style={{ marginTop: 48 }}>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 700, letterSpacing: "1px", marginBottom: 16, textTransform: "uppercase" }}>
              All Roles — Feature Progress
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ROLES.map(r => {
                const allItems = r.phases.flatMap(p => p.items);
                const done = allItems.filter(i => i.done).length;
                const total = allItems.length;
                const pct = Math.round((done / total) * 100);
                return (
                  <div key={r.id}
                    onClick={() => setActiveRole(r.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 16,
                      background: "#16162a", border: `1px solid ${activeRole === r.id ? r.accentBorder : "#1e1e2e"}`,
                      borderRadius: 10, padding: "12px 16px", cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#1a1a2e")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#16162a")}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: r.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                      {r.icon}
                    </div>
                    <div style={{ width: 90, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{r.label}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: r.accentLight, letterSpacing: "0.5px" }}>{r.badge}</div>
                    </div>
                    <div style={{ flex: 1, height: 6, background: "#1a1a2a", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 99, width: `${pct}%`,
                        background: `linear-gradient(90deg, ${r.accent}, ${r.accentLight})`,
                        transition: "width 0.8s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: r.accentLight, width: 40, textAlign: "right", flexShrink: 0 }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: "#6b7280", width: 56, textAlign: "right", flexShrink: 0 }}>{done}/{total} done</div>
                    <div style={{ fontSize: 11, color: "#4b5563", width: 52, textAlign: "right", flexShrink: 0 }}>{r.phases.length} phases</div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}