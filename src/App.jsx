import React from "react";
import { useChatStore } from "./store/chatStore";
import { useChat } from "./hooks/useChat";

// Simplified components for now - will be replaced with new UI
const Sidebar = ({ conversations, activeId, onSelect }) => (
  <div className="sidebar">
    <div className="sidebar-header">
      <h3>Chats</h3>
    </div>
    <div className="chat-list">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={`chat-item ${conv.id === activeId ? "active" : ""}`}
          onClick={() => onSelect(conv.id)}
        >
          <div className="chat-title">{conv.title}</div>
          <div className="chat-time">
            {new Date(conv.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MainPanel = ({ messages, onSend, isStreaming }) => {
  const [input, setInput] = React.useState("");
  const [project, setProject] = React.useState("NCC");
  const [env, setEnv] = React.useState("DEV");
  const [domain, setDomain] = React.useState("General");

  const handleSend = () => {
    if (input.trim()) {
      onSend(input, project, env, domain);
      setInput("");
    }
  };

  return (
    <div className="main-panel">
      <div className="conversation">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.from}`}>
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

const ContextPanel = ({ trace, details }) => (
  <div className="context-panel">
    <h3>Context</h3>
    {trace && (
      <div className="trace-info">
        <div className="info-item">
          <span>Selected Trace:</span>
          <strong>{trace}</strong>
        </div>
        {details && (
          <div className="trace-details">
            <pre>{JSON.stringify(details, null, 2)}</pre>
          </div>
        )}
      </div>
    )}
  </div>
);

export default function App() {
  const { messages, isStreaming, currentTrace, sendMessage } = useChat();

  const {
    conversations,
    activeConversationId,
    isSidebarOpen,
    isContextPanelOpen,
    setActiveConversation,
    addConversation,
  } = useChatStore();

  // Initialize with a default conversation
  React.useEffect(() => {
    if (conversations.length === 0) {
      const defaultConv = {
        id: "1",
        title: "New Chat",
        messages: [],
      };
      addConversation(defaultConv);
      setActiveConversation("1");
    }
  }, []);

  return (
    <div className="app-container">
      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          background: #1a1a2e;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .sidebar {
          width: 260px;
          background: #0f0f23;
          border-right: 1px solid #2a2a3e;
          padding: 1rem;
        }
        
        .sidebar-header {
          margin-bottom: 1rem;
        }
        
        .chat-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .chat-item {
          padding: 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .chat-item:hover {
          background: #1a1a2e;
        }
        
        .chat-item.active {
          background: #2a2a3e;
        }
        
        .chat-title {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }
        
        .chat-time {
          font-size: 0.75rem;
          opacity: 0.6;
        }
        
        .main-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
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
          background: #2a2a3e;
          margin-left: 20%;
        }
        
        .message.bot {
          background: #1a1a2e;
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
          border-top: 1px solid #2a2a3e;
          display: flex;
          gap: 1rem;
        }
        
        .input-area input {
          flex: 1;
          padding: 0.75rem;
          background: #0f0f23;
          border: 1px solid #2a2a3e;
          border-radius: 0.5rem;
          color: #fff;
          font-size: 1rem;
        }
        
        .input-area button {
          padding: 0.75rem 2rem;
          background: #4a9eff;
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
        }
        
        .input-area button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .context-panel {
          width: 320px;
          background: #0f0f23;
          border-left: 1px solid #2a2a3e;
          padding: 1rem;
        }
        
        .trace-info {
          margin-top: 1rem;
        }
        
        .info-item {
          padding: 0.5rem;
          background: #1a1a2e;
          border-radius: 0.25rem;
          margin-bottom: 0.5rem;
          display: flex;
          justify-content: space-between;
        }
        
        .trace-details {
          margin-top: 1rem;
          padding: 1rem;
          background: #1a1a2e;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }
        
        .trace-details pre {
          margin: 0;
          white-space: pre-wrap;
        }
      `}</style>

      {isSidebarOpen && (
        <Sidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversation}
        />
      )}

      <MainPanel
        messages={messages}
        onSend={sendMessage}
        isStreaming={isStreaming}
      />

      {isContextPanelOpen && (
        <ContextPanel trace={currentTrace} details={null} />
      )}
    </div>
  );
}
