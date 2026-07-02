import { ChevronsUpDown } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface SelectOption {
  value: string;
  label: string;
  badge?: React.ReactNode;
  badgeTooltip?: string;
}
interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "ghost" | "pill";
  endAdornment?: React.ReactNode;
  compact?: boolean;
}

export function Select({
  value,
  options,
  onChange,
  disabled,
  className = "",
  style,
  variant = "default",
  endAdornment,
  compact = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !btnRef.current) return;

    const updatePosition = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div
      ref={containerRef}
      className={`select-container ${className}`}
      style={{ position: "relative", ...style }}
    >
      <div
        ref={btnRef as any}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        className={variant === "default" ? "input" : ""}
        data-disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onMouseDown={(e) => e.preventDefault()}
        style={{
          userSelect: "none",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          background:
            variant === "ghost"
              ? isOpen
                ? "var(--bg-tertiary)"
                : "transparent"
              : variant === "pill"
                ? isOpen
                  ? "var(--bg-tertiary)"
                  : "var(--bg-secondary)"
                : isOpen
                  ? "var(--bg-tertiary)"
                  : "var(--bg-primary)",
          border:
            variant === "ghost"
              ? "none"
              : variant === "pill"
                ? `1px solid ${isOpen ? "var(--border-highlight)" : "var(--border-color)"}`
                : `1px solid ${isOpen ? "var(--border-highlight)" : "var(--border-color)"}`,
          padding:
            variant === "ghost"
              ? "6px 12px"
              : variant === "pill"
                ? compact
                  ? "0 12px"
                  : "0 16px"
                : "0 12px",
          paddingRight:
            variant === "pill" ? (compact ? "12px" : "16px") : "12px",
          height: variant === "pill" ? (compact ? 32 : 40) : compact ? 32 : 40,
          borderRadius:
            variant === "ghost" ? "6px" : variant === "pill" ? "8px" : "6px",
          fontSize:
            variant === "ghost"
              ? "14px"
              : variant === "pill"
                ? compact
                  ? "12px"
                  : "13px"
                : undefined,
          fontWeight:
            variant === "ghost" ? 600 : variant === "pill" ? 600 : undefined,
          color: "var(--text-primary)",
          outline: "none",
          transition: "all var(--transition-fast)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "var(--bg-tertiary)";
            e.currentTarget.style.borderColor = "var(--border-highlight)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background =
              variant === "pill"
                ? "var(--bg-secondary)"
                : variant === "ghost"
                  ? "transparent"
                  : "var(--bg-primary)";
            e.currentTarget.style.borderColor =
              variant === "ghost" ? "transparent" : "var(--border-color)";
          }
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            textAlign: "left",
          }}
        >
          {selectedOption?.label}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          {selectedOption?.badge && (
            <span
              className={selectedOption.badgeTooltip ? "tooltip-trigger" : ""}
              data-tooltip={selectedOption.badgeTooltip}
              style={
                typeof selectedOption.badge === "string"
                  ? {
                      flexShrink: 0,
                      border: "1px solid rgba(99, 102, 241, 0.34)",
                      borderRadius: 999,
                      padding: "2px 8px",
                      background: "rgba(99, 102, 241, 0.12)",
                      color: "var(--text-secondary)",
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                    }
                  : {
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      color: "var(--text-secondary)",
                    }
              }
            >
              {selectedOption.badge}
            </span>
          )}
          {endAdornment && (
            <div
              style={{ display: "flex", alignItems: "center", gap: 4 }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {endAdornment}
            </div>
          )}
          <ChevronsUpDown
            size={14}
            style={{
              opacity: 0.4,
              marginLeft: 4,
            }}
          />
        </span>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="syncarts-select-dropdown animate-fade-in"
            style={{
              position: "fixed",
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              minWidth: `${dropdownPos.width}px`,
              maxWidth: 360,
              width: "max-content",
              zIndex: 9999,
              background: "rgba(15, 15, 15, 0.98)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border-highlight)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              overflow: "hidden",
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  color:
                    option.value === value
                      ? "var(--accent-primary)"
                      : "var(--text-primary)",
                  background:
                    option.value === value
                      ? "var(--bg-tertiary)"
                      : "transparent",
                  cursor: "pointer",
                  transition: "background var(--transition-fast)",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => {
                  if (option.value !== value)
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.08)";
                }}
                onMouseLeave={(e) => {
                  if (option.value !== value)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {option.label}
                  </span>
                  {option.badge && (
                    <span
                      className={option.badgeTooltip ? "tooltip-trigger" : ""}
                      data-tooltip={option.badgeTooltip}
                      style={
                        typeof option.badge === "string"
                          ? {
                              flexShrink: 0,
                              border: "1px solid rgba(99, 102, 241, 0.34)",
                              borderRadius: 999,
                              padding: "2px 7px",
                              background: "rgba(99, 102, 241, 0.12)",
                              color: "var(--text-secondary)",
                              fontSize: 10,
                              fontWeight: 700,
                              lineHeight: 1,
                            }
                          : {
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              color: "var(--text-secondary)",
                            }
                      }
                    >
                      {option.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
