import React, { useState } from "react";
import PropTypes from "prop-types";

export default function MessageInput({ onSend }) {
  const [value, setValue] = useState("");
  function submit(e) {
    e.preventDefault();
    if (!value) return;
    onSend?.(value);
    setValue("");
  }
  return (
    <form className="message-input" onSubmit={submit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write a message..."
      />
      <button type="submit">Send</button>
    </form>
  );
}

MessageInput.propTypes = {
  onSend: PropTypes.func,
};
