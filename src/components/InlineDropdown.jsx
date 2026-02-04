import "./InlineDropdown.css";

export default function InlineDropdown({
  value,
  onChange,
  options = [],
  disabled = false,
  className = "",
}) {
  return (
    <div className={`inlineDD ${className}`}>
      <select
        className="inlineDD__select"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <span className="inlineDD__chev" aria-hidden="true">
        ▾
      </span>
    </div>
  );
}
