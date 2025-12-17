import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Settings2 } from "lucide-react";
import "./ToolButton.css";

type ToolButtonProps = {
  options?: string[];
  onSelect?: (option: string) => void;
  disabled?: boolean;
  title?: string;
  icon?: LucideIcon;
};

export default function ToolButton({
  options = [],
  onSelect = () => {},
  disabled = false,
  title = "Settings",
  icon = Settings2,
}: ToolButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = () => {
    if (!disabled) setIsOpen((open) => !open);
  };

  const IconComponent = icon;

  return (
    <div className="tool-button-container" ref={containerRef}>
      <button
        type="button"
        className="tool-button"
        onClick={toggle}
        disabled={disabled}
        title={title}
      >
        <IconComponent size={16} />
      </button>

      {isOpen && (
        <ul className="tool-menu">
          {options.map((opt) => (
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
