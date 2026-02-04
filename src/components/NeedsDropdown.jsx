import { useEffect, useMemo, useRef, useState } from "react";
import "./RewardTypeDropdown.css"; // ✅ reuse the exact same css

export default function NeedsDropdown({
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = "Select…",
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found?.label ?? "";
  }, [options, value]);

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const isDisabled = Boolean(disabled);

  return (
    <div
      className={`rtdrop ${isDisabled ? "is-disabled" : ""}`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="rtdrop__button"
        onClick={() => !isDisabled && setOpen((v) => !v)}
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedLabel || placeholder}
        <span className="rtdrop__chev" aria-hidden="true" />
      </button>

      {open && !isDisabled && (
        <div className="rtdrop__menu" role="listbox">
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`rtdrop__item ${selected ? "is-selected" : ""}`}
                onClick={() => {
                  onChange?.(opt.value);
                  setOpen(false);
                }}
                role="option"
                aria-selected={selected}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
