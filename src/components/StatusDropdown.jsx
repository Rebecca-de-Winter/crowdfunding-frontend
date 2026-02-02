import { useEffect, useRef, useState } from "react";
import "./StatusDropdown.css";

const OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

function StatusDropdown({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  useEffect(() => {
    function onClickOutside(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggle = () => {
    if (disabled) return;
    setOpen((v) => !v);
  };

  const pick = (val) => {
    onChange?.(val);
    setOpen(false);
  };

  return (
    <div className={`statusdd ${disabled ? "is-disabled" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="statusdd__button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="statusdd__label">{current.label}</span>
        <span className="statusdd__chev" aria-hidden="true" />
      </button>

      {open && (
        <div className="statusdd__menu" role="listbox">
          {OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={`statusdd__item ${opt.value === value ? "is-selected" : ""}`}
              onClick={() => pick(opt.value)}
              role="option"
              aria-selected={opt.value === value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default StatusDropdown;
