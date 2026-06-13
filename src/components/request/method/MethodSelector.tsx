import "./MethodSelector.css";

import { ChevronDown, Circle } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useWorkspace } from "../../../contexts/WorkspaceContext";

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export function MethodSelector() {
  const { activeTab, updateActiveTab } = useWorkspace();
  const method = activeTab?.method || "GET";

  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !btnRef.current) return;

    const updatePosition = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        className={`method-pill ${method.toLowerCase()}`}
        onClick={() => setIsOpen((open) => !open)}
        disabled={!activeTab}
      >
        <span>{method}</span>
        <ChevronDown
          size={14}
          style={{
            opacity: 0.6,
            transition: "transform 0.15s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
          }}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="method-dropdown animate-fade-in"
            style={{
              position: "fixed",
              zIndex: 50,
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
            }}
          >
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                className={`method-dropdown-item ${method === m ? "active" : ""}`}
                style={{ color: `var(--status-${m.toLowerCase()})` }}
                onClick={() => {
                  updateActiveTab({ method: m });
                  setIsOpen(false);
                }}
              >
                <Circle size={8} fill="currentColor" />
                {m}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
