import React from "react";
import "./Sidebar.css";
import ChatList from "./ChatList";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <header className="sidebar-header">Chats</header>
      <ChatList />
    </aside>
  );
}
