import {useState, useRef, useEffect} from 'react'
import {Send} from 'lucide-react'
import './ChatInterface.css'
import ChatInput from './ChatInput'
import ChatBubble from './ChatBubble'

function parseEventMessage(raw) {
    const result = {event: '', data: ''};
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
    const lastChunkRef = useRef('')
    const processedEventsRef = useRef(new Set()) // Track processed events

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, []);

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
                        copy[i] = {...copy[i], downloadLinks}
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

        // Reset processed events for new message
        processedEventsRef.current.clear();
        lastChunkRef.current = '';

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

            // Close any existing SSE connection first
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const {streamUrl} = await response.json()

            setMessages(m => [...m, {from: 'bot', text: '', isStreaming: true}])

            eventSourceRef.current = new EventSource(`http://localhost:8000${streamUrl}`)

            eventSourceRef.current.onopen = () => {
                console.log('✅ SSE Opened')
            }

            eventSourceRef.current.onerror = (e) => {
                console.error('❌ SSE Error', e)
                if (eventSourceRef.current) {
                    eventSourceRef.current.close()
                    eventSourceRef.current = null
                }
                setIsStreaming(false)
                setMessages(m => m.map(msg => msg.isStreaming ? {...msg, isStreaming: false} : msg))
            }

            eventSourceRef.current.onmessage = e => {
                const {event, data: rawData} = parseEventMessage(e.data);

                // Create a unique identifier for this event
                const eventId = `${event}-${Date.now()}-${Math.random()}`;

                // Skip if we've already processed this exact event content recently
                const eventKey = `${event}-${rawData}`;
                if (processedEventsRef.current.has(eventKey)) {
                    console.log('Skipping duplicate event:', event);
                    return;
                }
                processedEventsRef.current.add(eventKey);

                // Clean up old processed events (keep only last 20)
                if (processedEventsRef.current.size > 20) {
                    const entries = Array.from(processedEventsRef.current);
                    processedEventsRef.current = new Set(entries.slice(-10));
                }

                let parsed;
                try {
                    parsed = JSON.parse(rawData);
                } catch {
                    parsed = rawData;
                }

                // Handle "Extracted Parameters" specially
                if (event === 'Extracted Parameters' && typeof parsed === 'object') {
                    console.log('Extracted Parameters:', parsed)
                    const {time_frame, domain, query_keys} = parsed.parameters
                    const keywords = Array.isArray(query_keys)
                        ? query_keys.join(', ')
                        : query_keys

                    const chunk = [
                        "I have found the following parameters from your request",
                        `Time Frame: ${time_frame}`,
                        `Domain: ${domain}`,
                        `Keywords to search for: ${keywords}`
                    ].join("\n") + "\n\n"

                    // Use functional update to prevent race conditions
                    setMessages(prev => {
                        const copy = [...prev]
                        const lastMsg = copy[copy.length - 1]
                        if (lastMsg && lastMsg.from === 'bot') {
                            // Check if this content is already in the message
                            if (!lastMsg.text.includes("I have found the following parameters")) {
                                lastMsg.text += chunk
                            }
                        }
                        return copy
                    })
                    return
                }

                // Handle "Downloaded logs in file"
                if (event === 'Downloaded logs in file') {
                    const chunk = 'Downloaded logs\n\n';
                    setMessages(prev => {
                        const copy = [...prev];
                        const lastMsg = copy[copy.length - 1];
                        if (lastMsg && lastMsg.from === 'bot' && !lastMsg.text.includes('Downloaded logs')) {
                            lastMsg.text += chunk;
                        }
                        return copy;
                    });
                    return;
                }

                // Handle "Found trace id(s)"
                if (event === 'Found trace id(s)' && typeof parsed === 'object' && parsed.count != null) {
                    const chunk = `Found ${parsed.count} requests\n\n`;
                    setMessages(prev => {
                        const copy = [...prev];
                        const lastMsg = copy[copy.length - 1];
                        if (lastMsg && lastMsg.from === 'bot' && !lastMsg.text.includes(`Found ${parsed.count} requests`)) {
                            lastMsg.text += chunk;
                        }
                        return copy;
                    });
                    return;
                }

                if (event === 'Compiled Request Traces') {
                    const chunk = 'Compiled Request Traces\n\n';
                    setMessages(prev => {
                        const copy = [...prev];
                        const lastMsg = copy[copy.length - 1];
                        if (lastMsg && lastMsg.from === 'bot' && !lastMsg.text.includes('Compiled Request Traces')) {
                            lastMsg.text += chunk;
                        }
                        return copy;
                    });
                    return;
                }

                // Handle "done" event
                if (event === 'done') {
                    let messageText = '';
                    if (parsed && typeof parsed === 'object') {
                        if (parsed.message) {
                            messageText = parsed.message;
                        } else if (parsed.status === 'complete') {
                            messageText = 'Analysis complete.';
                        }
                    }
                    if (!messageText && typeof rawData === 'string') {
                        messageText = rawData;
                    }

                    const chunk = messageText + '\n\n';
                    setMessages(prev => {
                        const copy = [...prev];
                        const lastMsg = copy[copy.length - 1];
                        if (lastMsg && lastMsg.from === 'bot' && !lastMsg.text.includes(messageText)) {
                            lastMsg.text += chunk;
                        }
                        return copy;
                    });
                    return;
                }

                // Handle "Compiled Summary"
                if (event === 'Compiled Summary' && typeof parsed === 'object') {
                    console.log('Compiled Summary:', parsed)
                    setDownloadLinks(buildDownloadLinks(parsed));
                    return;
                }

                // Handle other regular events
                const chunk = `${event}\n${JSON.stringify(parsed, null, 2)}\n\n`
                console.log('Processing regular event:', event, chunk)

                setMessages(prev => {
                    const lastIndex = prev.length - 1;
                    const lastMsg = prev[lastIndex];
                    if (!lastMsg || lastMsg.from !== 'bot') return prev;

                    // Check if this chunk is already in the message
                    if (lastMsg.text.includes(chunk.trim())) {
                        return prev;
                    }

                    return [
                        ...prev.slice(0, lastIndex),
                        {...lastMsg, text: lastMsg.text + chunk},
                    ];
                });
            };

            // Handle the 'done' event properly
            eventSourceRef.current.addEventListener('done', () => {
                console.log('✅ SSE Done')
                if (eventSourceRef.current) {
                    eventSourceRef.current.close()
                    eventSourceRef.current = null
                }
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
                        const isLastBotMessage =
                            message.from === 'bot' && (
                                index === messages.length - 1 ||
                                (index < messages.length - 1 && messages[index + 1].from === 'user')
                            )

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

            <ChatInput input={input} setInput={setInput} onSend={sendMessage} isStreaming={isStreaming}/>
        </div>
    )
}