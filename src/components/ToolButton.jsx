// src/components/ToolButton.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import './ToolButton.css';

export default function ToolButton({
                                       options = [],          // e.g. ['NCC','ABBL','GIGLY']
                                       onSelect = () => {},   // receives the selected option
                                       disabled,
                                       title = 'Settings',
                                   }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggle = () => {
        if (!disabled) setIsOpen(open => !open);
    };

    return (
        <div className="tool-button-container" ref={containerRef}>
            <button
                type="button"
                className="tool-button"
                onClick={toggle}
                disabled={disabled}
                title={title}
            >
                <Settings2 size={16} />
            </button>

            {isOpen && (
                <ul className="tool-menu">
                    {options.map(opt => (
                        <li key={opt}>
                            <button
                                type="button"
                                className="tool-menu-item"
                                onClick={() => {
                                    onSelect(opt);
                                    setIsOpen(false);
                                }}
                            >
                                {opt}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
