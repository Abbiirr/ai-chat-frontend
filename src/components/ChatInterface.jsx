import {useState, useRef, useEffect} from 'react'
import {Send} from 'lucide-react'
import './ChatInterface.css'
import ChatInput from './ChatInput'
import DownloadPanel from './DownloadPanel'

function parseEventMessage(raw) {
    const result = { event: '', data: '' };
    raw.trim().split(/\r?\n/).forEach(line => {
        const [prefix, ...rest] = line.split(': ');
        const value = rest.join(': ');
        if (prefix === 'event') result.event = value;
        else if (prefix === 'data') result.data += value;
    });
    return result;
}

function buildDownloadLinks(payload) {
    const links = []

    if (Array.isArray(payload.created_files)) {
        payload.created_files.forEach(fullPath => {
            const name = fullPath.split(/[\\/]/).pop()
            links.push({
                name,
                url: `http://localhost:8000/download/?filename=${encodeURIComponent(name)}`,
                type: 'trace_analysis',
            })
        })
    }

    if (typeof payload.master_summary_file === 'string') {
        const name = payload.master_summary_file.split(/[\\/]/).pop()
        links.push({
            name,
            url: `http://localhost:8000/download/?filename=${encodeURIComponent(name)}`,
            type: 'master_summary',
        })
    }

    return links
}

export default function ChatInterface() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [downloadLinks, setDownloadLinks] = useState([])
    const scrollRef = useRef()
    const eventSourceRef = useRef()

    useEffect(() => {
        scrollRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [messages, downloadLinks]) // Also scroll when download links change

    const sendMessage = async () => {
        if (!input.trim() || isStreaming) return

        const userMessage = input
        setMessages(m => [...m, {from: 'user', text: userMessage}])
        setInput('')
        setIsStreaming(true)

        try {
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({prompt: userMessage})
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const {streamUrl} = await response.json()

            setMessages(m => [...m, {from: 'bot', text: '', isStreaming: true}])
            eventSourceRef.current = new EventSource(`http://localhost:8000${streamUrl}`)

            eventSourceRef.current.onopen = () => console.log('✅ SSE Opened')
            eventSourceRef.current.onerror = (e) => {
                console.error('❌ SSE Error', e)
                eventSourceRef.current.close()
                setIsStreaming(false)
                setMessages(m => m.map(msg => msg.isStreaming ? {...msg, isStreaming: false} : msg))
            }

            eventSourceRef.current.onmessage = e => {
                const { event, data: rawData } = parseEventMessage(e.data)
                let parsed
                try { parsed = JSON.parse(rawData) } catch { parsed = rawData }

                setMessages(msgs => {
                    const copy = [...msgs]
                    if (copy.length) {
                        copy[copy.length - 1].text += `${event}\n${JSON.stringify(parsed, null, 2)}\n\n`
                    }
                    return copy
                })

                if (event === 'Compiled Summary' && typeof parsed === 'object') {
                    setDownloadLinks(buildDownloadLinks(parsed))
                }
            }

            eventSourceRef.current.addEventListener('done', () => {
                eventSourceRef.current.close()
                setIsStreaming(false)
                setMessages(m => m.map(msg => msg.isStreaming ? {...msg, isStreaming: false} : msg))
            })
        } catch (err) {
            console.error('SendMessage Error', err)
            setIsStreaming(false)
            setMessages(m => {
                const copy = [...m]
                if (copy.length && copy[copy.length - 1].from === 'bot' && copy[copy.length - 1].isStreaming)
                    copy.pop()
                return copy
            })
        }
    }

    return (
        <div className="chat-container">
            <header className="chat-header">
                <h1 className="chat-title">Banking Analysis Chat</h1>
            </header>

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
                                    <span className="avatar-text">{m.from === 'user' ? 'You' : 'AI'}</span>
                                </div>
                                <div className="message-text">
                                    <div className="text-content" style={{whiteSpace: 'pre-wrap'}}>
                                        {m.text || (m.isStreaming ? 'Analyzing...' : '')}
                                    </div>
                                    {m.isStreaming && <span className="typing-indicator"/>}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Move download panel inside messages wrapper so it flows with content */}
                    <DownloadPanel links={downloadLinks} />

                    <div ref={scrollRef}/>
                </div>
            </main>

            <ChatInput input={input} setInput={setInput} onSend={sendMessage} isStreaming={isStreaming} />
        </div>
    )
}