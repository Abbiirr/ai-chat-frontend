// services/sseHandler.js
export class SSEHandler {
  constructor() {
    this.eventSource = null;
    this.processedEvents = new Set();
    this.handlers = new Map();
  }

  parseEventMessage(raw) {
    const result = { event: "", data: "" };
    raw
      .trim()
      .split(/\r?\n/)
      .forEach((line) => {
        const [prefix, ...rest] = line.split(": ");
        const value = rest.join(": ");
        if (prefix === "event") result.event = value;
        else if (prefix === "data") result.data += value;
      });
    return result;
  }

  registerHandler(eventType, handler) {
    this.handlers.set(eventType, handler);
  }

  connect(url, onMessage, onError, onDone) {
    this.disconnect();
    this.processedEvents.clear();
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => console.log("✅ SSE Connected");

    this.eventSource.onerror = (e) => {
      console.error("❌ SSE Error", e);
      this.disconnect();
      onError?.(e);
    };

    this.eventSource.onmessage = (e) => {
      const { event: eventType, data: rawData } = this.parseEventMessage(
        e.data
      );
      const eventKey = `${eventType}-${rawData}`;

      if (this.processedEvents.has(eventKey)) return;
      this.processedEvents.add(eventKey);

      let parsed;
      try {
        parsed = JSON.parse(rawData);
      } catch {
        parsed = rawData;
      }

      const handler = this.handlers.get(eventType);
      if (handler) {
        handler(parsed, rawData);
      } else {
        onMessage?.(eventType, parsed, rawData);
      }
    };

    this.eventSource.addEventListener("done", () => {
      console.log("✅ SSE Done");
      this.disconnect();
      onDone?.();
    });
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Event type constants
export const SSE_EVENTS = {
  EXTRACTED_PARAMS: "Extracted Parameters",
  DOWNLOADED_LOGS: "Downloaded logs in file",
  FOUND_TRACES: "Found trace id(s)",
  COMPILED_TRACES: "Compiled Request Traces",
  COMPILED_SUMMARY: "Compiled Summary",
  VERIFICATION_RESULTS: "Verification Results",
  DONE: "done",
};
