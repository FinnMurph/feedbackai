/**
 * FeedbackAI — API hooks
 * Centralized API calls to the Flask backend.
 */

const BASE = (import.meta.env.VITE_API_URL || "") + "/api";

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

  async streamMessage(message, history, onToken, onDone) {
    const res = await fetch(`${BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.token !== undefined) onToken(event.token);
          else if (event.done) onDone(event);
        } catch { /* incomplete JSON fragment */ }
      }
    }
  },
};
