import React from "react";

export default function ChatList() {
  const items = [
    { id: 1, title: "General" },
    { id: 2, title: "Support" },
  ];

  return (
    <ul className="chat-list">
      {items.map((it) => (
        <li key={it.id} className="chat-list-item">
          {it.title}
        </li>
      ))}
    </ul>
  );
}
