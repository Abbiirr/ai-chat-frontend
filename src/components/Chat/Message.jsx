import React from "react";
import PropTypes from "prop-types";

export default function Message({ author = "bot", text = "" }) {
  return (
    <div className={`message ${author}`}>
      <div className="message-text">{text}</div>
    </div>
  );
}

Message.propTypes = {
  author: PropTypes.string,
  text: PropTypes.string,
};
