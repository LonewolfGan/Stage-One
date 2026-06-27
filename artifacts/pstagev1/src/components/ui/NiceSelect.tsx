import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface SelectOption {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface NiceSelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  searchable?: boolean;
  error?: string;
  disabled?: boolean;
}

export function NiceSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Sélectionner…",
  searchable = false,
  error,
  disabled = false,
}: NiceSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.id === value);

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="ds-field" ref={ref} style={{ position: "relative" }}>
      {label && <label className="ds-label">{label}</label>}

      <button
        type="button"
        className={`ds-select-trigger ${open ? "open" : ""}`}
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        style={error ? { borderColor: "var(--error)" } : undefined}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, overflow: "hidden" }}>
          {selected?.icon}
          <span style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: selected ? "var(--ink)" : "var(--ink-disabled)",
          }}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown size={14} className="chevron" />
      </button>

      {open && (
        <div className="ds-select-menu">
          {searchable && (
            <div className="ds-select-search">
              <input
                autoFocus
                type="text"
                placeholder="Rechercher…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}
          {filtered.length === 0 ? (
            <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--ink-tertiary)" }}>
              Aucun résultat
            </div>
          ) : (
            filtered.map(opt => (
              <div
                key={opt.id}
                className={`ds-select-option ${opt.id === value ? "selected" : ""}`}
                onClick={() => handleSelect(opt.id)}
              >
                {opt.icon}
                {opt.label}
                {opt.id === value && (
                  <Check size={13} style={{ marginLeft: "auto", color: "var(--accent)" }} />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {error && <p className="ds-error">{error}</p>}
    </div>
  );
}
