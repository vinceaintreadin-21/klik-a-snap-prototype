// Shared utilities for Processing Logs and Audit Log pages

export function logInitials(name: string | null): string {
  if (!name) return 'SY'
  const parts = name.split(/[.\s_-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function hueFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

export function logAvatarStyle(name: string | null): React.CSSProperties {
  if (!name) return { background: '#64748b' }
  const hue = hueFromString(name)
  return { background: `hsl(${hue},55%,42%)` }
}

export function fmtDate(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }
}

export const LEVEL_CFG: Record<string, { dot: string; text: string; bg: string }> = {
  INFO:     { dot: '#004ac6', text: '#004ac6', bg: '#eff4ff' },
  WARNING:  { dot: '#f97316', text: '#c2410c', bg: '#fff7ed' },
  ERROR:    { dot: '#b91c1c', text: '#b91c1c', bg: '#fee2e2' },
  CRITICAL: { dot: '#7f1d1d', text: '#7f1d1d', bg: '#fecaca' },
}

export const ACTION_COLORS: Record<string, string> = {
  OVERRIDE_ORDER_STATUS: '#f97316',
  CREATE_OPERATOR:       '#004ac6',
  UPDATE_OPERATOR:       '#004ac6',
  DELETE_OPERATOR:       '#b91c1c',
  CREATE_INSTITUTION:    '#166534',
  UPDATE_INSTITUTION:    '#166534',
  SUSPEND_INSTITUTION:   '#f97316',
  ASSIGN_OPERATOR:       '#7c3aed',
}
export function actionColor(action: string): string {
  return ACTION_COLORS[action] ?? '#64748b'
}

export const MODULE_CFG: Record<string, { bg: string; text: string }> = {
  Order:       { bg: '#eff4ff', text: '#004ac6' },
  Orders:      { bg: '#eff4ff', text: '#004ac6' },
  Operator:    { bg: '#f8f0ff', text: '#7c3aed' },
  Institution: { bg: '#f0fdf4', text: '#166534' },
  Student:     { bg: '#fff7ed', text: '#c2410c' },
  Students:    { bg: '#fff7ed', text: '#c2410c' },
  Core:        { bg: '#f1f5f9', text: '#475569' },
}
export function moduleBadge(model: string): { bg: string; text: string } {
  return MODULE_CFG[model] ?? { bg: '#f1f5f9', text: '#64748b' }
}

export const LOG_PER_PAGE = 15
