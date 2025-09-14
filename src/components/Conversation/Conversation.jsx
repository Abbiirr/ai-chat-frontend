// components/Conversation/Conversation.jsx
import React, { useState } from "react";
import { Send } from "lucide-react";
import "./Conversation.css";

const Conversation = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="main-content">
      <div className="conversation-area">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">
              How can I help you check logs today?
            </div>
            <div className="empty-subtitle">
              Start a conversation by asking about traces, errors, or log
              analysis
            </div>
          </div>
        ) : (
          <div className="messages-container">
            {messages.map((msg, idx) => (
              <div key={msg.id ?? idx} className={`message ${msg.from}`}>
                <div className="message-avatar">
                  {msg.from === "user" ? "U" : "AI"}
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    <div className="message-text">{msg.text}</div>
                  </div>
                  <div className="message-time">
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="input-area">
        <div className="input-container">
          <div className="input-field">
            <input
              type="text"
              placeholder="Ask about traces..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            Send
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Conversation;

import PropTypes from "prop-types";

Conversation.propTypes = {
  messages: PropTypes.array,
  onSendMessage: PropTypes.func,
};
