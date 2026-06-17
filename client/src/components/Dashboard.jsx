import { useState, useEffect } from "react";
import { Users, MessageSquare, AlertTriangle, TrendingUp, Check, LayoutGrid, Type, BookMarked, Lightbulb, RefreshCw } from "lucide-react";
import { api } from "../hooks/useApi";

const RUBRIC_META = {
  Organization: { color: "#3b82f6", Icon: LayoutGrid },
  Clarity:      { color: "#8b5cf6", Icon: Type },
  Evidence:     { color: "#059669", Icon: BookMarked },
  "Critical Thinking": { color: "#d97706", Icon: Lightbulb },
};

function RubricTag({ rubric }) {
  const m = RUBRIC_META[rubric];
  if (!m) return <span style={{ fontSize: 11, color: "#cbd5e1" }}>—</span>;
  const Icon = m.Icon;
  return (
    <span className="rubric-tag" style={{ background: m.color + "14", color: m.color }}>
      <Icon size={11} /> {rubric}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="stat-card" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
      <div style={{ height: 12, background: "var(--color-border)", borderRadius: 6, width: "60%", marginBottom: 12 }} />
      <div style={{ height: 28, background: "var(--color-border)", borderRadius: 6, width: "40%", marginBottom: 8 }} />
      <div style={{ height: 10, background: "var(--color-border)", borderRadius: 6, width: "50%" }} />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
      {[80, 60, 200, 100, 70].map((w, i) => (
        <td key={i}>
          <div style={{ height: 12, background: "var(--color-border)", borderRadius: 4, width: w }} />
        </td>
      ))}
      <td />
    </tr>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getLogs()
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [refreshKey]);

  const handleResolve = async (id) => {
    try {
      await api.resolveLog(id);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <h2 className="dashboard-title">Instructor Dashboard</h2>
        <p className="dashboard-subtitle">Monitor student usage, review flagged interactions, and track rubric engagement.</p>
        <div className="stats-grid">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="engagement-card">
          <div className="engagement-title">Rubric Area Engagement</div>
          <div className="engagement-bars">
            {["Organization", "Clarity", "Evidence", "Critical Thinking"].map((k) => (
              <div key={k} className="engagement-bar">
                <div className="engagement-bar-header">
                  <span className="engagement-bar-label" style={{ color: "var(--color-text-muted)" }}>{k}</span>
                </div>
                <div className="engagement-bar-track" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
                  <div className="engagement-bar-fill" style={{ width: "40%", background: "var(--color-border)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="log-card">
          <div className="log-header"><span className="log-title">Conversation Log</span></div>
          <table className="log-table">
            <thead><tr><th>Student</th><th>Time</th><th>Message</th><th>Rubric Area</th><th>Status</th><th></th></tr></thead>
            <tbody><SkeletonRow /><SkeletonRow /><SkeletonRow /></tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, paddingTop: 80 }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ fontWeight: 600, color: "var(--color-text)" }}>Could not load dashboard</div>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", maxWidth: 340, textAlign: "center" }}>
          The server may be starting up — please try again in a moment.
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", background: "var(--color-surface)", padding: "6px 12px", borderRadius: 6 }}>
          {error}
        </div>
        <button
          className="btn-secondary"
          style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  const { logs, stats } = data;
  const unresolvedFlags = stats.integrity_flags;

  const statCards = [
    { label: "Active Students", value: stats.active_students, change: "+3 this week", color: "#3b82f6", Icon: Users },
    { label: "Conversations Today", value: stats.conversations_today, change: "Live count", color: "#6366f1", Icon: MessageSquare },
    { label: "Integrity Flags", value: unresolvedFlags, change: `${unresolvedFlags} unreviewed`, color: "#ef4444", Icon: AlertTriangle },
    { label: "Avg Rubric Coverage", value: "78%", change: "↑ 5% this week", color: "#059669", Icon: TrendingUp },
  ];

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Instructor Dashboard</h2>
      <p className="dashboard-subtitle">Monitor student usage, review flagged interactions, and track rubric engagement.</p>

      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon-wrap" style={{ background: s.color + "18" }}>
              <s.Icon size={18} color={s.color} />
            </div>
            <span className="stat-label">{s.label}</span>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="engagement-card">
        <div className="engagement-title">Rubric Area Engagement</div>
        <div className="engagement-bars">
          {Object.entries(stats.rubric_engagement).map(([key, pct]) => {
            const m = RUBRIC_META[key] || { color: "#94a3b8" };
            return (
              <div key={key} className="engagement-bar">
                <div className="engagement-bar-header">
                  <span className="engagement-bar-label">{key}</span>
                  <span className="engagement-bar-value" style={{ color: m.color }}>{pct}%</span>
                </div>
                <div className="engagement-bar-track">
                  <div className="engagement-bar-fill" style={{ width: `${pct}%`, background: m.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="log-card">
        <div className="log-header">
          <span className="log-title">Conversation Log</span>
          {unresolvedFlags > 0 && (
            <span className="log-flag-count">{unresolvedFlags} flagged</span>
          )}
        </div>
        <table className="log-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Time</th>
              <th>Message</th>
              <th>Rubric Area</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="log-empty">No conversations logged yet.</div>
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="student">{log.student}</td>
                <td className="time">{log.time}</td>
                <td className="msg">{log.msg}</td>
                <td><RubricTag rubric={log.rubric} /></td>
                <td>
                  {log.flagged ? (
                    log.resolved ? (
                      <span className="status-pill resolved"><Check size={10} style={{ marginRight: 3, verticalAlign: -1 }} />Resolved</span>
                    ) : (
                      <span className="status-pill flagged">⚠ Flagged</span>
                    )
                  ) : (
                    <span className="status-pill normal"><Check size={10} style={{ marginRight: 3, verticalAlign: -1 }} />Normal</span>
                  )}
                </td>
                <td>
                  {log.flagged && !log.resolved && (
                    <button className="btn-resolve" onClick={() => handleResolve(log.id)}>Resolve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
