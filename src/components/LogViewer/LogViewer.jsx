import React from "react";
import LogTable from "./LogTable";
import ParsedView from "./ParsedView";
import SummaryView from "./SummaryView";
import "./LogViewer.css";

export default function LogViewer() {
  return (
    <div className="log-viewer">
      <div className="log-main">
        <LogTable />
        <ParsedView />
      </div>
      <SummaryView />
    </div>
  );
}
