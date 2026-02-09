import "./NeedsPanel.css"; // reuse the same pill styles

function safeLower(v) {
  return String(v ?? "").trim().toLowerCase();
}

export default function NeedPills({ typeLabel, status, priority }) {
  return (
    <div className="needRow__meta">
      {typeLabel ? (
        <span className={`needPill needPill--type is-${safeLower(typeLabel)}`}>
          Type: {typeLabel}
        </span>
      ) : null}

      <span className={`needPill needPill--status is-${safeLower(status)}`}>
        Status: {status ?? "—"}
      </span>

      <span className={`needPill needPill--priority is-${safeLower(priority)}`}>
        Priority: {priority ?? "—"}
      </span>
    </div>
  );
}
