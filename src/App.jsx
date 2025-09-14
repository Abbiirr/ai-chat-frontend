import React, { useState } from "react";
import { useChatStore } from "./store/chatStore";
import { useChat } from "./hooks/useChat";
import LeftSidebar from "./components/Sidebar/LeftSidebar";
import RightSidebar from "./components/Sidebar/RightSidebar";
import PropTypes from "prop-types";

const MainPanel = ({ messages, onSend, isStreaming }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <div className="main-panel">
      <div className="conversation">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={msg.id ?? idx} className={`message ${msg.from}`}>
              <div className="message-content">{msg.text}</div>
              {msg.isStreaming && <span className="typing-indicator">...</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about traces..."
          disabled={isStreaming}
        />
        <button onClick={handleSend} disabled={isStreaming}>
          Send
        </button>
      </div>
    </div>
  );
};

MainPanel.propTypes = {
  messages: PropTypes.array,
  onSend: PropTypes.func,
  isStreaming: PropTypes.bool,
};

export default function App() {
  const { messages, isStreaming, currentTrace, sendMessage } = useChat();

  // Sidebar toggle states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    addConversation,
  } = useChatStore();

  // Initialize with a default conversation
  const initRef = React.useRef(false);
  React.useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    if (conversations.length === 0) {
      const defaultConv = {
        id: "1",
        title: "New Chat",
        messages: [],
        time: "4:35:58 PM",
      };
      addConversation(defaultConv);
      setActiveConversation("1");
    }
  }, [conversations.length, addConversation, setActiveConversation]);

  // Format conversations for sidebar
  const formattedConversations = conversations.map((conv) => ({
    ...conv,
    time:
      conv.time || new Date(conv.timestamp || Date.now()).toLocaleTimeString(),
  }));

  return (
    <div className="app-container">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        .app-container {
          display: flex;
          height: 100vh;
          background: #0f111a;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        }
        
        .main-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #1a1d29;
        }
        
        .conversation {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }
        
        .messages {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .message {
          margin-bottom: 1.5rem;
          padding: 1rem;
          border-radius: 0.5rem;
        }
        
        .message.user {
          background: #2a2d3a;
          margin-left: 20%;
        }
        
        .message.bot {
          background: #1e2129;
          margin-right: 20%;
        }
        
        .typing-indicator {
          opacity: 0.5;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .input-area {
          padding: 1rem 2rem;
          border-top: 1px solid #2a2d3a;
          display: flex;
          gap: 1rem;
          background: #1a1d29;
        }
        
        .input-area input {
          flex: 1;
          padding: 0.75rem;
          background: #0f111a;
          border: 1px solid #2a2d3a;
          border-radius: 0.5rem;
          color: #fff;
          font-size: 1rem;
        }
        
        .input-area input:focus {
          outline: none;
          border-color: #4a9eff;
        }
        
        .input-area button {
          padding: 0.75rem 2rem;
          background: #4a9eff;
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }
        
        .input-area button:hover:not(:disabled) {
          background: #3a8eef;
        }
        
        .input-area button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <LeftSidebar
        isOpen={leftSidebarOpen}
        toggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        conversations={formattedConversations}
        activeConv={activeConversationId}
        setActiveConv={setActiveConversation}
      />

      <MainPanel
        messages={messages}
        onSend={sendMessage}
        isStreaming={isStreaming}
      />

      <RightSidebar
        isOpen={rightSidebarOpen}
        toggleSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
        selectedTrace={currentTrace}
        totalLogs={messages.length}
      />
    </div>
  );
}
