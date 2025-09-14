// components/Sidebar/LeftSidebar.jsx
import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MessageSquare,
} from "lucide-react";
import PropTypes from "prop-types";

const LeftSidebar = ({
  isOpen,
  toggleSidebar,
  conversations = [],
  activeConv,
  setActiveConv,
}) => {
  return (
    <div style={{ display: "flex", position: "relative" }}>
      {/* Sidebar Content */}
      <div
        style={{
          width: isOpen ? "260px" : "0",
          background: "#1a1d29",
          borderRight: isOpen ? "1px solid #2a2d3a" : "none",
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
            Chats
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Search size={16} style={{ cursor: "pointer", color: "#9ca3af" }} />
            <Filter size={16} style={{ cursor: "pointer", color: "#9ca3af" }} />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.5rem",
          }}
        >
          {conversations.map((conv) => (
            <div
              key={conv.id}
              style={{
                marginBottom: "0.25rem",
              }}
            >
              <button
                onClick={() => setActiveConv(conv.id)}
                style={{
                  width: "100%",
                  background:
                    activeConv === conv.id ? "#374151" : "transparent",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  transition: "background 0.2s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (activeConv !== conv.id) {
                    e.currentTarget.style.background = "#2a2d3a";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeConv !== conv.id) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{ color: "#9ca3af", flexShrink: 0 }}>
                  <MessageSquare size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "#e5e7eb",
                      fontSize: "14px",
                      fontWeight: "500",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {conv.title}
                  </div>
                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "12px",
                      marginTop: "2px",
                    }}
                  >
                    {conv.time}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle Button - Always Visible */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "absolute",
          left: isOpen ? "260px" : "0",
          top: "50%",
          transform: "translateY(-50%)",
          width: "32px",
          height: "64px",
          background: "#374151",
          border: "1px solid #4b5563",
          borderLeft: "none",
          borderRadius: "0 8px 8px 0",
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
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </div>
  );
};

LeftSidebar.propTypes = {
  isOpen: PropTypes.bool,
  toggleSidebar: PropTypes.func,
  conversations: PropTypes.array,
  activeConv: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setActiveConv: PropTypes.func,
};

export default LeftSidebar;
