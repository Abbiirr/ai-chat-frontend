// components/Sidebar/RightSidebar.jsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PropTypes from "prop-types";

const RightSidebar = ({ isOpen, toggleSidebar, selectedTrace, totalLogs }) => {
  return (
    <div style={{ display: "flex", position: "relative" }}>
      {/* Toggle Button - Always Visible */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "absolute",
          right: isOpen ? "320px" : "0",
          top: "50%",
          transform: "translateY(-50%)",
          width: "32px",
          height: "64px",
          background: "#374151",
          border: "1px solid #4b5563",
          borderRight: "none",
          borderRadius: "8px 0 0 8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e5e7eb",
          transition: "all 0.3s ease",
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#4b5563";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#374151";
        }}
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Sidebar Content */}
      <div
        style={{
          width: isOpen ? "320px" : "0",
          background: "#1a1d29",
          borderLeft: isOpen ? "1px solid #2a2d3a" : "none",
          transition: "width 0.3s ease",
          overflow: "hidden",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid #2a2d3a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: "56px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#e5e7eb",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Context
          </span>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
          }}
        >
          {/* Selected Trace Section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "0.5rem",
              }}
            >
              Selected Trace
            </div>
            <div style={{ color: "#e5e7eb", fontSize: "14px" }}>
              {selectedTrace || "No trace selected"}
            </div>
          </div>

          {/* Total Logs Section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "0.5rem",
              }}
            >
              Total Logs
            </div>
            <div style={{ color: "#e5e7eb", fontSize: "14px" }}>
              {totalLogs || 0}
            </div>
          </div>

          {/* Quick Tools Section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "0.5rem",
              }}
            >
              Quick Tools
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              {["Extract Fields", "Detect Format", "Mask PII", "Export"].map(
                (tool) => (
                  <button
                    key={tool}
                    style={{
                      background: "#2a2d3a",
                      border: "1px solid #374151",
                      color: "#e5e7eb",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#374151";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#2a2d3a";
                    }}
                  >
                    {tool}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Shortcuts Section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "0.5rem",
              }}
            >
              Shortcuts
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              {[
                { label: "Prev/Next Log", key: "J/K" },
                { label: "Search", key: "/" },
                { label: "Next Tab", key: "]" },
                { label: "Prev Tab", key: "[" },
              ].map((shortcut, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom: idx < 3 ? "1px solid #2a2d3a" : "none",
                    fontSize: "13px",
                    color: "#e5e7eb",
                  }}
                >
                  <span>{shortcut.label}</span>
                  <span
                    style={{
                      background: "#2a2d3a",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#9ca3af",
                      fontWeight: "600",
                    }}
                  >
                    {shortcut.key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

RightSidebar.propTypes = {
  isOpen: PropTypes.bool,
  toggleSidebar: PropTypes.func,
  selectedTrace: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  totalLogs: PropTypes.number,
};

export default RightSidebar;
