import { Link } from "react-router-dom";
import "./FundraiserCard.css";

function FundraiserCard({ fundraiserData }) {
  const {
    id,
    image_url,
    title,
    description,
    is_open,
    status,
    goal,
    location,
    start_date,
    end_date,
    owner,
    date_created,
  } = fundraiserData;

  // UPDATED ROUTE to match main.jsx
  const fundraiserLink = `/fundraisers/${id}`;

  /**
   * Status display
   * Your backend Fundraiser model uses:
   * - draft
   * - active
   * - closed
   * - cancelled
   *
   * `is_open` is a computed convenience property (true when status === "active")
   */
  const statusLabel = status ? status.replaceAll("_", " ") : null;
  const openLabel = is_open ? "Open" : "Closed";

  // Goal comes back as a string like "2500.00" sometimes
  const goalNumber = goal !== null && goal !== undefined ? Number(goal) : null;

  /**
   * Placeholder progress bar:
   * (You don't have "raised" yet, so we give a visual indicator based on status.)
   */
  const progressPct =
    status === "draft" ? 20 : status === "active" ? 55 : status === "closed" ? 100 : 10;

  const excerpt =
    description && description.length > 120
      ? `${description.slice(0, 120)}…`
      : description;

  const formatDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString();
  };

  const formatMoney = (n) => {
    if (typeof n !== "number" || Number.isNaN(n)) return null;
    return n.toLocaleString(undefined, { style: "currency", currency: "AUD" });
  };

  return (
    <article className="fundraiser-card">
      <Link to={fundraiserLink} className="fundraiser-card__link">
        <div className="fundraiser-card__imageWrap">
          <img
            className="fundraiser-card__image"
            src={image_url || "https://picsum.photos/800/500"}
            alt={title}
            loading="lazy"
          />

          <div className="fundraiser-card__badges">
            {/* Open/Closed pill (based on computed property) */}
            <span className={`fundraiser-card__pill ${is_open ? "is-open" : "is-closed"}`}>
              {openLabel}
            </span>

            {/* Raw status pill (draft/active/closed/cancelled) */}
            {statusLabel ? (
              <span className="fundraiser-card__pill fundraiser-card__pill--muted">
                {statusLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="fundraiser-card__body">
          <h3 className="fundraiser-card__title">{title}</h3>

          {excerpt ? (
            <p className="fundraiser-card__excerpt">{excerpt}</p>
          ) : (
            <p className="fundraiser-card__excerpt fundraiser-card__excerpt--muted">
              A community event fundraiser.
            </p>
          )}

          <div className="fundraiser-card__meta">
            <div className="fundraiser-card__metaLeft">
              {location ? (
                <span className="fundraiser-card__metaItem">{location}</span>
              ) : null}

              {(start_date || end_date) ? (
                <span className="fundraiser-card__metaItem">
                  {formatDate(start_date)}
                  {end_date ? ` → ${formatDate(end_date)}` : ""}
                </span>
              ) : null}
            </div>

            <div className="fundraiser-card__metaRight">
              {goalNumber ? (
                <span className="fundraiser-card__goal">{formatMoney(goalNumber)}</span>
              ) : null}
            </div>
          </div>

          <div className="fundraiser-card__progressRow">
            <div className="fundraiser-card__progressTrack" aria-hidden="true">
              <div
                className="fundraiser-card__progressFill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="fundraiser-card__progressText">{progressPct}%</span>
          </div>

          <div className="fundraiser-card__fine">
            <span>Host #{owner ?? "—"}</span>
            {date_created ? <span>Created {formatDate(date_created)}</span> : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default FundraiserCard;
