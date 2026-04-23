import React, { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export default function SearchableEntitySelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Search and select...",
  disabled = false,
  allowClear = true,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const selected = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;

    return options.filter((opt) => {
      const labelText = String(opt.label || "").toLowerCase();
      const descText = String(opt.description || "").toLowerCase();
      return labelText.includes(q) || descText.includes(q);
    });
  }, [options, query]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (!next) {
      setQuery("");
    } else {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="space-y-1.5">
      {label ? (
        <div className="text-sm font-medium text-slate-700">{label}</div>
      ) : null}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm"
        >
          <span className={selected ? "text-slate-900" : "text-slate-400"}>
            {selected?.label || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {open ? (
          <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full border-0 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {allowClear && value ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.("");
                    setOpen(false);
                    setQuery("");
                  }}
                  className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  Clear selection
                </button>
              ) : null}

              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-500">No results found.</div>
              ) : (
                filtered.map((opt) => {
                  const active = String(opt.value) === String(value);

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange?.(opt.value, opt);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm ${
                        active ? "bg-indigo-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">{opt.label}</div>
                        {opt.description ? (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {opt.description}
                          </div>
                        ) : null}
                      </div>
                      {active ? <Check className="mt-0.5 h-4 w-4 text-indigo-600" /> : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}