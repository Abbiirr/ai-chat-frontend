// services/api.js
const API_BASE = "http://localhost:8000";

export const api = {
  async sendMessage(prompt, project, env, domain) {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, project, env, domain }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  async downloadFile(filename) {
    return `${API_BASE}/download/?filename=${encodeURIComponent(filename)}`;
  },

  createSSEConnection(streamUrl) {
    return new EventSource(`${API_BASE}${streamUrl}`);
  },

  async getTraceDetails(traceId) {
    const response = await fetch(`${API_BASE}/api/trace/${traceId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  async searchLogs(query, filters) {
    const params = new URLSearchParams({ query, ...filters });
    const response = await fetch(`${API_BASE}/api/logs?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};
