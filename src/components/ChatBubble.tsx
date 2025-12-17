import type { DownloadLink, Message } from "../types";
import "./ChatBubble.css";

type ChatBubbleProps = {
  message: Message;
  index: number;
  downloadLinks?: DownloadLink[];
};

export default function ChatBubble({
  message,
  index: _index, // kept for possible keyed animations
  downloadLinks = [],
}: ChatBubbleProps) {
  const isUser = message.from === "user";
  const isBot = message.from === "bot";
  const showDownloads = isBot && downloadLinks.length > 0;

  const groupedLinks = downloadLinks.reduce<
    Record<DownloadLink["type"], DownloadLink[]>
  >((acc, link) => {
    const category = link.type;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(link);
    return acc;
  }, {} as Record<DownloadLink["type"], DownloadLink[]>);

  const categoryConfig: Record<
    DownloadLink["type"],
    { title: string; className: string }
  > = {
    relevant: { title: "dYZ_ Highly Relevant", className: "relevant-links" },
    less_relevant: {
      title: "ƒsÿ‹,? Less Relevant",
      className: "less-relevant-links",
    },
    not_relevant: {
      title: "ƒ?O Not Relevant",
      className: "not-relevant-links",
    },
    trace_analysis: {
      title: 'dY", Trace Analysis',
      className: "trace-analysis-links",
    },
    master_summary: {
      title: 'dY"S Master Summary',
      className: "master-summary-links",
    },
    verification: {
      title: "ƒo. Verification",
      className: "verification-links",
    },
  };

  return (
    <div className={`chat-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
      <div className="bubble-content">
        <div className="bubble-avatar">
          <span className="avatar-text">{isUser ? "You" : "AI"}</span>
        </div>
        <div className="bubble-message">
          <div className="message-text" style={{ whiteSpace: "pre-wrap" }}>
            {message.text || (message.isStreaming ? "Analyzing..." : "")}
          </div>
          {message.isStreaming && (
            <div className="typing-indicator">
              <span />
              <span />
              <span />
            </div>
          )}
          {showDownloads && (
            <div className="embedded-downloads">
              {Object.entries(groupedLinks).map(
                ([category, categoryLinks]) => {
                  const config =
                    categoryConfig[category as DownloadLink["type"]] || {
                      title: `dY"? ${category.charAt(0).toUpperCase()}${category.slice(
                        1,
                      )}`,
                      className: "default-links",
                    };

                  return (
                    <div
                      key={category}
                      className={`download-category ${config.className}`}
                    >
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
                            <span className="link-icon">dY",</span>
                            <span className="link-name">{link.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
