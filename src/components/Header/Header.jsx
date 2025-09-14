// components/Header/Header.jsx
import React from "react";
import { Plus, Settings } from "lucide-react";
import "./Header.css";

const Header = () => {
  return (
    <div className="header">
      <div className="header-title">Log Assistant</div>
      <div className="header-actions">
        <button className="header-btn primary">
          <Plus size={16} />
          New
        </button>
        <button className="header-btn">
          <Settings size={16} />
          Settings
        </button>
      </div>
    </div>
  );
};

export default Header;
