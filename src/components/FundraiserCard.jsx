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

  const fundraiserLink = `/fundraiser/${id}`;

  // Nice human label for your status field
  const statusLabel = status ? status.replaceAll("_", " ") : (is_open ? "open" : "closed");

  // Goal is a string like "2500.00"
  const goalNumber = goal ? Number(goal) : null;

  // We don't have "raised" yet in your JSON, so we show a "setup" bar:
  // - Draft = small
  // - Open = medium
  // - Closed = full
  const progressPct = status === "draft" ? 20 : is_open ? 55 : 100;

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
            <span className={`fundraiser-card__pill ${is_open ? "is-open" : "is-closed"}`}>
              {is_open ? "Open" : "Closed"}
            </span>

            {status ? (
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
              {location ? <span className="fundraiser-card__metaItem">{location}</span> : null}
              {(start_date || end_date) ? (
                <span className="fundraiser-card__metaItem">
                  {formatDate(start_date)}{end_date ? ` → ${formatDate(end_date)}` : ""}
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
