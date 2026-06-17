import { useState, useEffect } from "react";
import { FileText, BarChart3, Settings as SettingsIcon, BookOpen } from "lucide-react";
import { api } from "./hooks/useApi";
import StudentView from "./components/StudentView";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";

const TABS = [
  { key: "student", label: "Student View", Icon: FileText },
  { key: "dashboard", label: "Dashboard", Icon: BarChart3 },
  { key: "settings", label: "Settings", Icon: SettingsIcon },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("student");
  const [mode, setMode] = useState(null);

  useEffect(() => {
    api.getMode().then((d) => setMode(d.mode)).catch(() => setMode("demo"));
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">✦</div>
          <span className="app-logo-text">FeedbackAI</span>
          {mode && (
            <span className={`mode-badge ${mode}`}>
              {mode === "live" ? "● Live" : "◐ Demo"}
            </span>
          )}
        </div>

        <nav className="app-nav">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`nav-tab ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
              title={label}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="app-user">
          <span className="app-user-name">Finn Murphy</span>
          <div className="app-user-avatar">FM</div>
        </div>
      </header>

      <main className="app-main">
        {activeTab === "student" && <StudentView />}
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "settings" && <Settings />}
      </main>
    </div>
  );
}
