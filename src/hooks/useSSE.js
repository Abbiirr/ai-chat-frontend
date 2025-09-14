// Minimal SSE hook placeholder
import { useEffect, useRef } from "react";

export default function useSSE(url) {
  const evtRef = useRef(null);
  useEffect(() => {
    if (!url) return;
    // placeholder - real implementation would create EventSource
    return () => {
      /* cleanup */
    };
  }, [url]);
  return evtRef;
}
