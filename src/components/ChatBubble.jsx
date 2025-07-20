import React from 'react'
import PropTypes from 'prop-types'
import './ChatBubble.css'
import DownloadPanel from './DownloadPanel'

/**
 * ChatBubble
 * Renders a single chat message bubble
 * Props:
 *  - message: { from, text, isStreaming }
 *  - index: number (for key/animation purposes)
 *  - downloadLinks: array of download links
 *  - isLastBotMessage: boolean to show downloads
 */
export default function ChatBubble({ message, index, downloadLinks = [], isLastBotMessage = false }) {
    const isUser = message.from === 'user'
    const isBot = message.from === 'bot'
    const showDownloads = isBot && isLastBotMessage && downloadLinks.length > 0

    return (
        <div className={`chat-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
            <div className="bubble-content">
                <div className="bubble-avatar">
                    <span className="avatar-text">
                        {isUser ? 'You' : 'AI'}
                    </span>
                </div>
                <div className="bubble-message">
                    <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                        {message.text || (message.isStreaming ? 'Analyzing...' : '')}
                    </div>
                    {message.isStreaming && (
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    )}
                    {showDownloads && (
                        <div className="download-section">
                            <DownloadPanel links={downloadLinks} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

ChatBubble.propTypes = {
    message: PropTypes.shape({
        from: PropTypes.string.isRequired,
        text: PropTypes.string,
        isStreaming: PropTypes.bool,
    }).isRequired,
    index: PropTypes.number.isRequired,
    downloadLinks: PropTypes.array,
    isLastBotMessage: PropTypes.bool,
}