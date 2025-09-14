import React from "react";
import "./ContextPanel.css";
import TraceDetails from "./TraceDetails";
import QuickTools from "./QuickTools";

export default function ContextPanel() {
  return (
    <aside className="context-panel">
      <QuickTools />
      <TraceDetails />
    </aside>
  );
}
