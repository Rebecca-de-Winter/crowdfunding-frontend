import { Link } from "react-router-dom";
import "./FundraiserCard.css";

function FundraiserCard({ fundraiserData }) {
  const {
    id,
    image_url,
    title,
    description,
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

  // Goal comes back as a string like "2500.00" sometimes
  const goalNumber = goal !== null && goal !== undefined ? Number(goal) : null;

  /**
   * Placeholder progress bar:
   * (You don't have "raised" yet, so we give a visual indicator based on status.)
   */
  const progressPct =
    status === "draft"
      ? 20
      : status === "active"
      ? 55
      : status === "closed"
      ? 100
      : 10;

  const excerpt =
    description && description.length > 120
      ? `${description.slice(0, 120)}…`
      : description;

  // ✅ Force AU format so it’s consistent across devices
  const formatDateAU = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatMoney = (n) => {
    if (typeof n !== "number" || Number.isNaN(n)) return null;
    return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
  };

  // ✅ Status pill labels to match Edit Festival
  const statusLabel =
    status === "draft"
      ? "Draft"
      : status === "active"
      ? "Active"
      : status === "closed"
      ? "Closed"
      : status === "cancelled"
      ? "Cancelled"
      : "—";

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
            {/* ✅ Status pill based on Fundraiser.status */}
            <span className={`fundraiser-card__pill is-${status || "unknown"}`}>
              {statusLabel}
            </span>
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
              {/* Row 1: Location (or blank spacer) */}
              <span className="fundraiser-card__metaItem">
                {location || "\u00A0"}
              </span>

              {/* Row 2: Dates */}
              <span className="fundraiser-card__metaItem fundraiser-card__metaItem--date">
                {start_date || end_date
                  ? `${formatDateAU(start_date)}${
                      end_date ? ` → ${formatDateAU(end_date)}` : ""
                    }`
                  : "\u00A0"}
              </span>
            </div>

            <div className="fundraiser-card__metaRight">
              <span className={`fundraiser-card__goal ${goalNumber ? "" : "is-ghost"}`}>
                {goalNumber ? formatMoney(goalNumber) : "A$0.00"}
              </span>
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
            {date_created ? <span>Created {formatDateAU(date_created)}</span> : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default FundraiserCard;
