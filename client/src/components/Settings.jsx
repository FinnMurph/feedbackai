import { useState, useEffect } from "react";
import { api } from "../hooks/useApi";

function Toggle({ on, onToggle, label }) {
  return (
    <div className="toggle-row">
      <span className="toggle-label">{label}</span>
      <div className={`toggle-switch ${on ? "on" : "off"}`} onClick={onToggle}>
        <div className="toggle-knob" />
      </div>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const toggle = async (section, key) => {
    if (!settings) return;
    const updated = {
      ...settings,
      [section]: { ...settings[section], [key]: !settings[section][key] },
    };
    setSettings(updated);
    setSaving(true);
    try {
      await api.updateSettings({ [section]: updated[section] });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSaving(false), 600);
    }
  };

  if (!settings) {
    return (
      <div className="settings" style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div className="settings">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 className="dashboard-title">Settings</h2>
          <p className="dashboard-subtitle" style={{ marginBottom: 0 }}>Configure feedback types, guardrails, and system behavior.</p>
        </div>
        {saving && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
            background: "var(--color-green-light)", color: "var(--color-green)",
            animation: "fadeIn 0.2s ease",
          }}>
            ✓ Saved
          </span>
        )}
      </div>

      {/* Feedback Types */}
      <div className="settings-section">
        <div className="settings-section-title">Allowed Feedback Types</div>
        <div className="settings-section-desc">Control which rubric areas students can receive feedback on.</div>
        <Toggle
          label="Structure & Organization"
          on={settings.feedback_types.organization}
          onToggle={() => toggle("feedback_types", "organization")}
        />
        <Toggle
          label="Clarity & Style"
          on={settings.feedback_types.clarity}
          onToggle={() => toggle("feedback_types", "clarity")}
        />
        <Toggle
          label="Citation & Evidence"
          on={settings.feedback_types.evidence}
          onToggle={() => toggle("feedback_types", "evidence")}
        />
        <Toggle
          label="Critical Thinking"
          on={settings.feedback_types.critical_thinking}
          onToggle={() => toggle("feedback_types", "critical_thinking")}
        />
      </div>

      {/* Guardrails */}
      <div className="settings-section">
        <div className="settings-section-title">Academic Integrity Guardrails</div>
        <div className="settings-section-desc">Enforce boundaries to prevent misuse and ensure ethical AI use.</div>
        <Toggle
          label="Block answer generation requests"
          on={settings.guardrails.block_answers}
          onToggle={() => toggle("guardrails", "block_answers")}
        />
        <Toggle
          label="Log all student conversations"
          on={settings.guardrails.log_conversations}
          onToggle={() => toggle("guardrails", "log_conversations")}
        />
        <Toggle
          label={`Flag excessive usage (>${settings.guardrails.max_messages_per_session} messages / session)`}
          on={settings.guardrails.flag_excessive_usage}
          onToggle={() => toggle("guardrails", "flag_excessive_usage")}
        />
      </div>

      {/* System Prompt */}
      <div className="settings-section">
        <div className="settings-section-title">System Prompt Preview</div>
        <div className="settings-section-desc">The active instructions sent to the AI before each student interaction.</div>
        <div className="system-prompt">
          You are a formative feedback assistant. Your role is to help students improve their writing by asking clarifying questions and pointing to rubric criteria.
          <span className="never"> NEVER </span>
          write complete sentences, paragraphs, or answers for the student. Use the Socratic method: ask guiding questions that help students discover improvements themselves. Reference the assignment rubric in every response. If a student asks you to generate content, politely decline and redirect with a question.
        </div>
      </div>
    </div>
  );
}
