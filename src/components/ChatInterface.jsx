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
    console.log('🚀 Sending message:', userMessage)
    setMessages(m => [...m, { from: 'user', text: userMessage }])
    setInput('')
    setIsStreaming(true)

    try {
      // Ask backend for a stream URL
      console.log('📡 Fetching stream URL from backend...')
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage })
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📡 Received data:', data)
      const { streamUrl } = data

      console.log('🔗 Stream URL:', streamUrl)

      // Add bot message placeholder
      setMessages(m => [...m, { from: 'bot', text: '', isStreaming: true }])

      // Create EventSource connection
      const fullStreamUrl = `http://localhost:8000${streamUrl}`
      console.log('🔌 Connecting to EventSource:', fullStreamUrl)

      eventSourceRef.current = new EventSource(fullStreamUrl)
      let botMsg = ''

      // Log EventSource connection status
      eventSourceRef.current.onopen = (e) => {
        console.log('✅ EventSource connection opened:', e)
      }

      eventSourceRef.current.onmessage = e => {
        console.log('📨 Raw SSE message received:', {
          data: e.data,
          type: e.type,
          lastEventId: e.lastEventId
        })

        try {
          // Try to parse as JSON first
          let chunk = null

          // Check if data is already JSON with chunk property
          try {
            const parsed = JSON.parse(e.data)
            console.log('📨 Parsed JSON:', parsed)

            if (parsed.chunk) {
              chunk = parsed.chunk
              console.log('📨 Extracted chunk:', chunk)
            } else {
              // If no chunk property, treat the whole thing as the chunk
              chunk = typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
              console.log('📨 Using full data as chunk:', chunk)
            }
          } catch (parseError) {
            // If not JSON, treat as plain text
            chunk = e.data
            console.log('📨 Using raw data as chunk:', chunk)
          }

          if (chunk) {
            botMsg += chunk
            console.log('📨 Updated bot message (length: ' + botMsg.length + '):', botMsg.substring(0, 100) + '...')

            setMessages(m => {
              const copy = [...m]
              if (copy.length > 0) {
                copy[copy.length - 1].text = botMsg
                console.log('📨 Updated message in state')
              }
              return copy
            })
          } else {
            console.log('⚠️ No chunk found in message')
          }
        } catch (parseError) {
          console.error('❌ Error parsing SSE data:', parseError, 'Raw data:', e.data)
        }
      }

      // Handle different types of events
      eventSourceRef.current.addEventListener('done', (e) => {
        console.log('✅ Stream completed with done event:', e)
        eventSourceRef.current.close()
        setIsStreaming(false)
        setMessages(m => {
          const copy = [...m]
          if (copy.length > 0) {
            copy[copy.length - 1].isStreaming = false
          }
          return copy
        })
      })

      eventSourceRef.current.addEventListener('error', (e) => {
        console.log('❌ Stream error event:', e)
        eventSourceRef.current.close()
        setIsStreaming(false)
        setMessages(m => {
          const copy = [...m]
          if (copy.length > 0) {
            copy[copy.length - 1].isStreaming = false
          }
          return copy
        })
      })

      eventSourceRef.current.onerror = (e) => {
        console.error('❌ EventSource connection error:', e)
        console.log('EventSource readyState:', eventSourceRef.current?.readyState)
        eventSourceRef.current.close()
        setIsStreaming(false)
        setMessages(m => {
          const copy = [...m]
          if (copy.length > 0) {
            copy[copy.length - 1].isStreaming = false
            if (!copy[copy.length - 1].text) {
              copy[copy.length - 1].text = 'Connection failed. Please try again.'
            }
          }
          return copy
        })
      }

    } catch (error) {
      console.error('❌ Error in sendMessage:', error)
      setIsStreaming(false)
      setMessages(m => {
        const copy = [...m]
        if (copy.length > 0 && copy[copy.length - 1].from === 'bot' && !copy[copy.length - 1].text) {
          copy.pop() // Remove empty bot message if request failed
        }
        return copy
      })
    }
  }

  return (
      <div className="chat-container">
        {/* Header */}
        <header className="chat-header">
          <h1 className="chat-title">Banking Analysis Chat</h1>
        </header>

        {/* Messages Area */}
        <main className="messages-container">
          <div className="messages-wrapper">
            {messages.length === 0 && (
                <div className="welcome-message">
                  <div className="welcome-title">How can I help you analyze banking transactions today?</div>
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
                      <div className="text-content" style={{whiteSpace: 'pre-wrap'}}>
                        {m.text || (m.isStreaming ? 'Analyzing...' : '')}
                      </div>
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
                placeholder="Describe your banking transaction issue..."
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
              Banking Analysis Assistant - Check the browser console for debug info.
            </div>
          </div>
        </footer>
      </div>
  )
}