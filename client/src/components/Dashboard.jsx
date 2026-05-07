import { useState, useEffect } from "react";
import { Users, MessageSquare, AlertTriangle, TrendingUp, Check, LayoutGrid, Type, BookMarked, Lightbulb } from "lucide-react";
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

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.getLogs().then(setData).catch(console.error);
  }, [refreshKey]);

  const handleResolve = async (id) => {
    try {
      await api.resolveLog(id);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
    }
  };

  if (!data) {
    return (
      <div className="dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
        Loading dashboard...
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

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="stat-label">{s.label}</span>
              <s.Icon size={16} color={s.color} style={{ opacity: 0.6 }} />
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      {/* Rubric Engagement */}
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

      {/* Conversation Log */}
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
