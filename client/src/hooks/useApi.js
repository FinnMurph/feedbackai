/**
 * FeedbackAI — API hooks
 * Centralized API calls to the Flask backend.
 */

const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getMode: () => request("/mode"),
  sendMessage: (message, history) =>
    request("/chat", { method: "POST", body: JSON.stringify({ message, history }) }),
  getHighlights: () => request("/highlights"),
  getRubric: () => request("/rubric"),
  getSettings: () => request("/settings"),
  updateSettings: (data) =>
    request("/settings", { method: "PUT", body: JSON.stringify(data) }),
  getLogs: () => request("/logs"),
  resolveLog: (id) => request(`/logs/${id}/resolve`, { method: "POST" }),
};
