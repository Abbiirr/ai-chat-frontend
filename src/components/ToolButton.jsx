// src/components/ToolButton.jsx
import React from 'react';
import {Plus, Settings2} from 'lucide-react';
import './ToolButton.css'

export default function ToolButton({ onClick, disabled, title = 'More options' }) {
    return (
        <button
            type="button"
            className="tool-button"
            onClick={onClick}
            disabled={disabled}
            title={title}
        >
            <Settings2 size={16} />
        </button>
    );
}
