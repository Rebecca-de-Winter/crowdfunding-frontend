import { useEffect, useRef, useState } from "react";
import "./RewardTypeDropdown.css";

const OPTIONS = [
  { value: "money", label: "Money" },
  { value: "time", label: "Time" },
  { value: "item", label: "Item" },
];

function RewardTypeDropdown({ value, onChange, disabled = false }) {
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
    <div className={`rtdrop ${disabled ? "is-disabled" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="rtdrop__button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="rtdrop__label">{current.label}</span>
        <span className="rtdrop__chev" aria-hidden="true" />
      </button>

      {open && (
        <div className="rtdrop__menu" role="listbox">
          {OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={`rtdrop__item ${opt.value === value ? "is-selected" : ""}`}
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
export default RewardTypeDropdown;
