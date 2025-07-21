import {useState, useRef, useEffect} from 'react'
import {Send} from 'lucide-react'
import './ChatInterface.css'
import ChatInput from './ChatInput'
import ChatBubble from './ChatBubble'

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
    }, [messages, downloadLinks])

    // Update the last bot message with download links when they're available
    useEffect(() => {
        if (downloadLinks.length > 0) {
            setMessages(msgs => {
                const copy = [...msgs]
                // Find the last bot message and add download links to it
                for (let i = copy.length - 1; i >= 0; i--) {
                    if (copy[i].from === 'bot') {
                        copy[i] = { ...copy[i], downloadLinks }
                        break
                    }
                }
                return copy
            })
        }
    }, [downloadLinks])

    const sendMessage = async (userMessage, project, env) => {
        if (!input.trim() || isStreaming) return
        console.log(userMessage, project, env)
        setMessages(m => [...m, {from: 'user', text: userMessage}])
        setInput('')
        setIsStreaming(true)
        setDownloadLinks([]) // Clear previous download links

        try {
            const requestBody = {
                prompt: userMessage,
                project: project,
                env: env
            };
            console.log('Request Body:', requestBody);

            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(requestBody)
            });
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
                <h1 className="chat-title">Loggy</h1>
            </header>

            <main className="messages-container">
                <div className="messages-wrapper">
                    {messages.length === 0 && (
                        <div className="welcome-message">
                            <div className="welcome-title">How can I help you check logs today?</div>
                        </div>
                    )}

                    {messages.map((message, index) => {
                        const isLastBotMessage = message.from === 'bot' &&
                            index === messages.length - 1 ||
                            (index < messages.length - 1 && messages[index + 1].from === 'user')

                        return (
                            <ChatBubble
                                key={index}
                                message={message}
                                index={index}
                                downloadLinks={message.downloadLinks || []}
                                isLastBotMessage={isLastBotMessage}
                            />
                        )
                    })}

                    <div ref={scrollRef}/>
                </div>
            </main>

            <ChatInput input={input} setInput={setInput} onSend={sendMessage} isStreaming={isStreaming} />
        </div>
    )
}