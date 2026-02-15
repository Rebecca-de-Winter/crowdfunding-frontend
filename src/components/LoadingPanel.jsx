import "./LoadingPanel.css";

export default function LoadingPanel({ label = "Loading…" }) {
  return (
    <div className="loadingWrap" role="status" aria-live="polite">
      <div className="loadingCard">
        <div className="loadingGlow" aria-hidden="true" />
        <div className="loadingRow">
          <div className="loadingDots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="loadingText">{label}</p>
        </div>
      </div>
    </div>
  );
}
