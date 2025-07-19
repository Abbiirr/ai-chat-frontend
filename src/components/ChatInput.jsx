// src/components/ChatInput.jsx
import React, { useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

export default function ChatInput({ input, setInput, onSend, isStreaming }) {
    const textareaRef = useRef(null)

    // Automatically adjust textarea height based on content
    useEffect(() => {
        const ta = textareaRef.current
        if (ta) {
            ta.style.height = 'auto'
            ta.style.height = `${ta.scrollHeight}px`
        }
    }, [input])

    const handleChange = e => {
        setInput(e.target.value)
    }

    return (
        <footer className="input-container">
            <div className="input-wrapper">
                <div className="input-field">
          <textarea
              ref={textareaRef}
              className="message-input"
              value={input}
              onChange={handleChange}
              placeholder="Describe your banking transaction issue..."
              onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      onSend()
                  }
              }}
              disabled={isStreaming}
              rows={1}
              style={{ resize: 'none', overflow: 'hidden' }}
          />
                    <button
                        className={`send-button ${input.trim() && !isStreaming ? 'active' : 'disabled'}`}
                        onClick={onSend}
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
    )
}