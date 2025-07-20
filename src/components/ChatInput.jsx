// src/components/ChatInput.jsx
import React from 'react';
import {Send} from 'lucide-react';
import ToolButton from './ToolButton';

export default function ChatInput({input, setInput, onSend, isStreaming, onToolClick}) {
    return (
        <footer className="input-container">
            <div className="input-wrapper">
                <div className="input-field">
                    <ToolButton
                        onClick={onToolClick}
                        disabled={isStreaming}
                        title="Additional settings"
                    />
                    <textarea
                        className="message-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type your message…"
                    />
                    <button
                        className={`send-button ${input.trim() && !isStreaming ? 'active' : 'disabled'}`}
                        onClick={onSend}
                        disabled={!input.trim() || isStreaming}
                    >
                        <Send size={16}/>
                    </button>

                </div>
                <div className="input-hint">
                    Chat Assistant – check console for debug info.
                </div>
            </div>
        </footer>
    );
}
