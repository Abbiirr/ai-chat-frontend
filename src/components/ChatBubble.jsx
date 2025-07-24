import React from 'react'
import PropTypes from 'prop-types'
import './ChatBubble.css'

/**
 * ChatBubble
 * Renders a single chat message bubble with embedded download links
 * Props:
 *  - message: { from, text, isStreaming }
 *  - index: number (for key/animation purposes)
 *  - downloadLinks: array of download links
 */
export default function ChatBubble({ message, index, downloadLinks = [] }) {
    const isUser = message.from === 'user'
    const isBot = message.from === 'bot'
    // Show downloads whenever they exist for bot messages, not just the last one
    const showDownloads = isBot && downloadLinks.length > 0

    // Group links by type/category
    const groupedLinks = downloadLinks.reduce((acc, link) => {
        const category = link.type;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(link);
        return acc;
    }, {});

    // Define category display names
    const categoryConfig = {
        'relevant': { title: '🎯 Highly Relevant', className: 'relevant-links' },
        'less_relevant': { title: '⚠️ Less Relevant', className: 'less-relevant-links' },
        'not_relevant': { title: '❌ Not Relevant', className: 'not-relevant-links' },
        'trace_analysis': { title: '📄 Trace Analysis', className: 'trace-analysis-links' },
        'master_summary': { title: '📊 Master Summary', className: 'master-summary-links' },
        'verification': { title: '✅ Verification', className: 'verification-links' }
    };

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
                        <div className="embedded-downloads">
                            {Object.entries(groupedLinks).map(([category, categoryLinks]) => {
                                const config = categoryConfig[category] || {
                                    title: `📁 ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                                    className: 'default-links'
                                };

                                return (
                                    <div key={category} className={`download-category ${config.className}`}>
                                        <div className="category-header">{config.title}</div>
                                        <div className="download-links-grid">
                                            {categoryLinks.map((link, idx) => (
                                                <a
                                                    key={`${category}-${idx}`}
                                                    href={link.url}
                                                    download={link.name}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="download-link-pill"
                                                    title={link.name}
                                                >
                                                    <span className="link-icon">📄</span>
                                                    <span className="link-name">{link.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
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
}