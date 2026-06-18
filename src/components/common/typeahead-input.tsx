"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TypeaheadInputProps = {
  label: string;
  placeholder: string;
  value?: string;
  disabled?: boolean;
  options: string[];
  allowCustomValue?: boolean;
  onQueryChange?: (query: string) => void;
  onSelect: (value: string) => void;
};

export function TypeaheadInput({
  label,
  placeholder,
  value,
  disabled = false,
  options,
  allowCustomValue = false,
  onQueryChange,
  onSelect,
}: TypeaheadInputProps) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectionCommittedRef = useRef(false);

  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const handle = window.setTimeout(() => onQueryChange?.(query), 150);
    return () => window.clearTimeout(handle);
  }, [query, onQueryChange]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (!raw) return options;
    const starts = options.filter((entry) => entry.toLowerCase().startsWith(raw));
    const contains = options.filter((entry) => entry.toLowerCase().includes(raw) && !entry.toLowerCase().startsWith(raw));
    return [...starts, ...contains];
  }, [options, query]);

  function resolveTypedValue() {
    const typed = query.trim();
    if (!typed) return;
    const exact = options.find((entry) => entry.toLowerCase() === typed.toLowerCase());
    if (exact) {
      setQuery(exact);
      onSelect(exact);
      return;
    }
    if (filtered.length === 1) {
      setQuery(filtered[0]);
      onSelect(filtered[0]);
      return;
    }
    if (allowCustomValue) {
      setQuery(typed);
      onSelect(typed);
    }
  }

  function commitSelection(selected: string) {
    selectionCommittedRef.current = true;
    setQuery(selected);
    onSelect(selected);
    setOpen(false);
  }

  return (
    <div className="tm-field relative" ref={rootRef}>
      <span className="tm-field-label">{label}</span>
      <input
        className="tm-input"
        disabled={disabled}
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (selectionCommittedRef.current) {
            selectionCommittedRef.current = false;
            setOpen(false);
            return;
          }
          resolveTypedValue();
          setOpen(false);
        }}
        onKeyDown={(event) => {
          if (!open || filtered.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            const selected = filtered[activeIndex];
            if (selected) {
              commitSelection(selected);
            }
          }
        }}
      />
      {open && filtered.length > 0 ? (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          {filtered.map((entry, index) => (
            <button
              key={entry}
              className={`w-full px-3 py-2 text-left text-sm ${
                index === activeIndex ? "bg-slate-100 text-slate-900" : "text-slate-700"
              }`}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                commitSelection(entry);
              }}
            >
              {entry}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
