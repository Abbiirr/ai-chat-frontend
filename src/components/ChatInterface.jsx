import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import './ChatInterface.css'

export default function ChatInterface() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef()
  const eventSourceRef = useRef()

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage = input
    setMessages(m => [...m, { from: 'user', text: userMessage }])
    setInput('')
    setIsStreaming(true)

    try {
      // Ask backend for a stream URL
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage })
      })

      const { streamUrl } = await response.json()

      // Add bot message placeholder
      setMessages(m => [...m, { from: 'bot', text: '', isStreaming: true }])

      eventSourceRef.current = new EventSource(streamUrl)
      let botMsg = ''

      eventSourceRef.current.onmessage = e => {
        const { chunk } = JSON.parse(e.data)
        botMsg += chunk
        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1].text = botMsg
          return copy
        })
      }

      eventSourceRef.current.addEventListener('done', () => {
        eventSourceRef.current.close()
        setIsStreaming(false)
        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1].isStreaming = false
          return copy
        })
      })

      eventSourceRef.current.onerror = () => {
        eventSourceRef.current.close()
        setIsStreaming(false)
        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1].isStreaming = false
          return copy
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setIsStreaming(false)
    }
  }

  return (
      <div className="chat-container">
        {/* Header */}
        <header className="chat-header">
          <h1 className="chat-title">ChatGPT</h1>
        </header>

        {/* Messages Area */}
        <main className="messages-container">
          <div className="messages-wrapper">
            {messages.length === 0 && (
                <div className="welcome-message">
                  <div className="welcome-title">How can I help you today?</div>
                </div>
            )}

            {messages.map((m, i) => (
                <div key={i} className={`message-group ${m.from === 'user' ? 'user-message' : 'bot-message'}`}>
                  <div className="message-content">
                    <div className="message-avatar">
                  <span className="avatar-text">
                    {m.from === 'user' ? 'You' : 'AI'}
                  </span>
                    </div>

                    <div className="message-text">
                      <div className="text-content">{m.text}</div>
                      {m.isStreaming && (
                          <span className="typing-indicator" />
                      )}
                    </div>
                  </div>
                </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </main>

        {/* Input Area */}
        <footer className="input-container">
          <div className="input-wrapper">
            <div className="input-field">
            <textarea
                className="message-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Message ChatGPT..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                disabled={isStreaming}
                rows={1}
            />
              <button
                  className={`send-button ${input.trim() && !isStreaming ? 'active' : 'disabled'}`}
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
              >
                <Send size={16} />
              </button>
            </div>
            <div className="input-hint">
              ChatGPT can make mistakes. Check important info.
            </div>
          </div>
        </footer>
      </div>
  )
}