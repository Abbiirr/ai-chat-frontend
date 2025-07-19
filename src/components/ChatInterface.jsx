import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">Chat Assistant</h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-8 px-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-32">
              <div className="text-2xl mb-2">Welcome!</div>
              <div>Start a conversation by typing a message below</div>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`mb-6 flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${m.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${m.from === 'user' ? 'ml-3' : 'mr-3'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold
                    ${m.from === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
                    {m.from === 'user' ? 'U' : 'A'}
                  </div>
                </div>
                
                {/* Message */}
                <div className={`px-4 py-2 rounded-lg ${
                  m.from === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-gray-400 rounded-sm animate-pulse ml-1" />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center bg-gray-100 rounded-lg">
            <input
              className="flex-1 bg-transparent px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={isStreaming}
            />
            <button
              className={`mr-2 p-2 rounded-md transition-colors ${
                input.trim() && !isStreaming
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
            >
              <Send size={20} />
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">
            Press Enter to send
          </div>
        </div>
      </div>
    </div>
  )
}