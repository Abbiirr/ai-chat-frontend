// src/components/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import ToolButton from './ToolButton';
import './ChatInput.css';

export default function ChatInput({ input, setInput, onSend, isStreaming }) {
    const [project, setProject] = useState('NCC');
    const [env, setEnv] = useState('DEV');
    const textareaRef = useRef(null);

    // Auto‑grow whenever `input` changes
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
    }, [input]);

    const handleChange = (e) => {
        setInput(e.target.value);
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
    };

    return (
        <footer className="input-container">
            <div className="input-wrapper">
                <div className="input-field">
                    <ToolButton
                        options={['NCC', 'ABBL', 'GIGLY']}
                        onSelect={setProject}
                        disabled={isStreaming}
                        title={`Project: ${project}`}
                    />
                    <ToolButton
                        options={['DEV', 'UAT', 'PROD']}
                        onSelect={setEnv}
                        disabled={isStreaming}
                        title={`Env: ${env}`}
                    />
                    <span className="project-pill">{project}</span>
                    <span className="project-pill">{env}</span>
                    <textarea
                        ref={textareaRef}
                        className="message-input"
                        value={input}
                        onChange={handleChange}
                        placeholder="Type your message…"
                        rows={1}
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
                    Chat Assistant – check console for debug info.
                </div>
            </div>
        </footer>
    );
}
