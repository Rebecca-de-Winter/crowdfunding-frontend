// src/pages/FundraiserPage.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import useFundraiser from "../hooks/use-fundraiser";
import useFundraiserPledgesReport from "../hooks/use-fundraiser-pledges-report";
import getCurrentUser from "../api/get-current-user";
import RewardTierList from "../components/RewardTierList";
import "./FundraiserPage.css";

/* =========================
   Formatting helpers
   ========================= */

function formatAUD(value) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

function formatHours(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function formatDateAU(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTimeAU(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeLower(v) {
  return String(v ?? "").toLowerCase();
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Defensive targets (time + item totals)
 * Adjust keys once API shape is confirmed.
 */
function getTimeTargetHours(need) {
  const td = need?.time_detail || need?.time_need_detail || null;
  const raw =
    td?.hours_needed ||
    td?.hours_required ||
    td?.hours ||
    td?.quantity_hours ||
    null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function getItemTargetQty(need) {
  const id = need?.item_detail || need?.item_need_detail || null;
  const raw =
    id?.quantity_needed ||
    id?.quantity_required ||
    id?.quantity ||
    id?.qty ||
    null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Time window label
 */
function getTimeWindowLabel(need) {
  const td = need?.time_detail || need?.time_need_detail || null;

  const start =
    td?.start_datetime || td?.start_at || td?.start || td?.start_time || null;
  const end =
    td?.end_datetime || td?.end_at || td?.end || td?.end_time || null;

  const startLabel = formatDateTimeAU(start);
  const endLabel = formatDateTimeAU(end);

  if (startLabel && endLabel) return `${startLabel} → ${endLabel}`;
  if (startLabel) return startLabel;

  const dateOnly = td?.date || td?.shift_date || td?.event_date || null;
  const dateLabel = dateOnly ? formatDateAU(dateOnly) : null;
  return dateLabel;
}

/**
 * Item type label (donation/loan/either)
 */
function getItemTypeLabel(need) {
  const id = need?.item_detail || need?.item_need_detail || null;

  const mode =
    id?.fulfilment ||
    id?.fulfillment ||
    id?.item_type ||
    id?.acquisition_type ||
    id?.loan_or_donation ||
    null;

  if (!mode) return null;

  const s = safeLower(mode);
  if (s.includes("donat")) return "Donation";
  if (s.includes("loan")) return "Loan";
  if (s.includes("either") || s.includes("any")) return "Loan or donation";
  return String(mode);
}

/* =========================
   Tiny UI helper
   ========================= */

function ProgressRow({ label, valueText, percent, note }) {
  const pct = percent == null ? null : clamp01(percent);

  return (
    <div className="progressRow">
      <div className="progressRow__top">
        <div className="progressRow__label">{label}</div>
        <div className="progressRow__value">{valueText}</div>
      </div>

      <div className="progressBar" aria-hidden="true">
        <div
          className="progressBar__fill"
          style={{ width: `${pct == null ? 0 : pct * 100}%` }}
        />
      </div>

      {note ? <div className="progressRow__note muted">{note}</div> : null}
    </div>
  );
}

/* =========================
   Component
   ========================= */

export default function FundraiserPage() {
  const { id } = useParams();

  // Hooks FIRST (always)
  const { fundraiser, isLoading, error } = useFundraiser(id);
  const { report, isLoading: isReportLoading, error: reportError } =
    useFundraiserPledgesReport(id);

  const [currentUser, setCurrentUser] = useState(null);

  const [openGroups, setOpenGroups] = useState({
    money: true,
    time: true,
    item: true,
  });

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) return;

    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  // Safe stable refs (no crashes if fundraiser is null)
  const rawNeeds = fundraiser?.needs;
  const rawRewardTiers = fundraiser?.reward_tiers;

  const needs = useMemo(() => rawNeeds ?? [], [rawNeeds]);
  const rewardTiers = useMemo(() => rawRewardTiers ?? [], [rawRewardTiers]);

  const moneyNeeds = useMemo(
    () => needs.filter((n) => n.need_type === "money"),
    [needs]
  );
  const timeNeeds = useMemo(
    () => needs.filter((n) => n.need_type === "time"),
    [needs]
  );
  const itemNeeds = useMemo(
    () => needs.filter((n) => n.need_type === "item"),
    [needs]
  );

  // Now safe to early-return
  if (isLoading) return <p className="fundraiser__state">Loading…</p>;
  if (error) return <p className="fundraiser__state">{error.message}</p>;
  if (!fundraiser)
    return <p className="fundraiser__state">Fundraiser not found.</p>;

  const {
    title,
    description,
    image_url,
    goal,
    location,
    start_date,
    end_date,
    is_open,
    enable_rewards,
    owner,
  } = fundraiser;

  const isOwner = currentUser?.id === owner;

  // --- Hero image: robust handling for null/""/relative paths
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";

function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  // common DRF/media relative path
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
}

const heroImg =
  resolveImageUrl(image_url) ||
  "https://picsum.photos/800/500";


  // Report / totals
  const totals = report?.totals;
  const pledges = report?.pledges ?? [];

  const moneyPledged = totals?.total_money_pledged ?? 0;
  const timeHoursPledged = totals?.total_time_hours_pledged ?? 0;
  const itemQtyPledged = totals?.total_item_quantity_pledged ?? 0;

  // Targets (computed directly to avoid useMemo lint noise)
  const moneyTarget = Number(goal) > 0 ? Number(goal) : null;

  const timeTargetSum = timeNeeds.reduce(
    (acc, n) => acc + (getTimeTargetHours(n) ?? 0),
    0
  );
  const itemTargetSum = itemNeeds.reduce(
    (acc, n) => acc + (getItemTargetQty(n) ?? 0),
    0
  );

  const timeTarget = timeTargetSum > 0 ? timeTargetSum : null;
  const itemTarget = itemTargetSum > 0 ? itemTargetSum : null;

  const moneyPercent = moneyTarget ? moneyPledged / moneyTarget : null;
  const timePercent = timeTarget ? timeHoursPledged / timeTarget : null;
  const itemPercent = itemTarget ? itemQtyPledged / itemTarget : null;

  const canShowTotals = !reportError && !isReportLoading;

  const dateRangeLabel =
    start_date || end_date
      ? `${formatDateAU(start_date)}${
          end_date ? ` → ${formatDateAU(end_date)}` : ""
        }`
      : "TBA";

  return (
    <div className="fundraiser">
      <Link className="fundraiser__back" to="/fundraisers">
        ← Back to fundraisers
      </Link>

      {/* TOP GRID (Hero + Goal panel) */}
      <div className="fundraiser__topGrid">
        <div className="fundraiser__hero">
          <img className="fundraiser__heroImg" src={heroImg} alt={title} />
        </div>

        <div className="fundraiser__sidebarTop">
          <div className="panel goalPanel">
            <div className="goalPanel__head">
              <div className="goalPanel__label">Goal (AUD)</div>
              <div className="goalPanel__value">{formatAUD(goal).replace("$", "")}</div>
            </div>

            <div className="goalPanel__divider" />

            <div className="goalPanel__progress">
              {!canShowTotals ? (
                <p className="muted">Loading totals…</p>
              ) : (
                <>
                  <ProgressRow
                    label="Money pledged"
                    valueText={formatAUD(moneyPledged)}
                    percent={moneyPercent}
                    note={!moneyTarget ? "No money goal set." : null}
                  />

                  <ProgressRow
                    label="Time pledged"
                    valueText={`${formatHours(timeHoursPledged)} hrs`}
                    percent={timePercent}
                    note={
                      !timeTarget
                        ? "No total time target set on needs."
                        : `Target: ${formatHours(timeTarget)} hrs`
                    }
                  />

                  <ProgressRow
                    label="Items pledged"
                    valueText={`${Number(itemQtyPledged) || 0}`}
                    percent={itemPercent}
                    note={
                      !itemTarget
                        ? "No total item target set on needs."
                        : `Target: ${Number(itemTarget)}`
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BELOW GRID (Left content + Rewards) */}
      <div className="fundraiser__belowGrid">
        <div className="fundraiser__leftCol">
          {/* MERGED header + meta panel (aligned with Rewards top) */}
          <div className="panel headerPanel">
  <h1 className="headerPanel__title">{title}</h1>

  <div className="headerPanel__meta">
    {location ? (
      <div className="metaLine">
        <span className="metaLabel">Location:</span>
        <span className="metaValue">{location}</span>
      </div>
    ) : null}

    <div className="metaLine">
      <span className="metaLabel">Backyard Dates:</span>
      <span className="metaValue">{dateRangeLabel}</span>
    </div>

    <div className="metaLine metaLine--status">
      <span className="metaLabel">Fundraiser status:</span>
      <span className={`statusPill ${is_open ? "statusPill--open" : "statusPill--closed"}`}>
        <span className={`statusDot ${is_open ? "statusDot--open" : "statusDot--closed"}`} />
        {is_open ? "Open" : "Closed"}
      </span>
    </div>

    {isOwner ? (
      <div className="headerPanel__actions">
        <Link className="fundraiser__editLink" to={`/fundraisers/${id}/edit`}>
          Edit fundraiser
        </Link>
      </div>
    ) : null}
  </div>
</div>


          {/* Description */}
          <div className="panel storyPanel">
            <h2 className="panel__title">Story / Description</h2>
            <p className="fundraiser__desc">{description}</p>
          </div>

          {/* Needs accordion (forced to EditFestival/NeedsPanel palette) */}
          <div className="panel needsPanel">
            <div className="needsPanel__head">
              <div>
                <h2 className="panel__title" style={{ marginBottom: 6 }}>
                  What this fundraiser needs
                </h2>
                <p className="needsPanel__note muted">
                  Choose a need to pledge against. Keep sections open while you work; collapse when you want a cleaner view.
                </p>
              </div>
            </div>

            <div className="needsPanel__groups">
              {/* Money */}
              <div className="needAcc">
                <button
                  type="button"
                  className="needAcc__head"
                  onClick={() => setOpenGroups((p) => ({ ...p, money: !p.money }))}
                  aria-expanded={openGroups.money}
                >
                  <span className="needAcc__left">
                    <span className="needAcc__chev">{openGroups.money ? "▾" : "▸"}</span>
                    <span className="needAcc__title">Money needs</span>
                    <span className="needAcc__count">{moneyNeeds.length}</span>
                  </span>
                  <span className="needAcc__hint">{openGroups.money ? "Collapse" : "Expand"}</span>
                </button>

                {openGroups.money ? (
                  <div className="needAcc__body">
                    {moneyNeeds.length === 0 ? (
                      <div className="needsEmpty">No money needs yet.</div>
                    ) : (
                      <div className="needsList">
                        {moneyNeeds.map((n) => (
                          <div key={n.id} className="needRow">
                            <div>
                              <div className="needRow__title">{n.title}</div>
                              {n.description ? <div className="needRow__desc">{n.description}</div> : null}

                              <div className="needRow__meta">
                                <span className={`needPill needPill--status is-${safeLower(n.status)}`}>
                                  Status: {n.status ?? "—"}
                                </span>
                                <span className={`needPill needPill--priority is-${safeLower(n.priority)}`}>
                                  Priority: {n.priority ?? "—"}
                                </span>
                              </div>
                            </div>

                            <div className="needRow__actions">
                              <Link className="btn btn--small" to={`/fundraisers/${id}/needs/${n.id}/pledge`}>
                                Pledge money
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Time */}
              <div className="needAcc">
                <button
                  type="button"
                  className="needAcc__head"
                  onClick={() => setOpenGroups((p) => ({ ...p, time: !p.time }))}
                  aria-expanded={openGroups.time}
                >
                  <span className="needAcc__left">
                    <span className="needAcc__chev">{openGroups.time ? "▾" : "▸"}</span>
                    <span className="needAcc__title">Time needs</span>
                    <span className="needAcc__count">{timeNeeds.length}</span>
                  </span>
                  <span className="needAcc__hint">{openGroups.time ? "Collapse" : "Expand"}</span>
                </button>

                {openGroups.time ? (
                  <div className="needAcc__body">
                    {timeNeeds.length === 0 ? (
                      <div className="needsEmpty">No time needs yet.</div>
                    ) : (
                      <div className="needsList">
                        {timeNeeds.map((n) => {
                          const when = getTimeWindowLabel(n);

                          return (
                            <div key={n.id} className="needRow">
                              <div>
                                <div className="needRow__title">{n.title}</div>

                                {when ? (
                                  <div className="needRow__desc">
                                    <strong>When:</strong> {when}
                                  </div>
                                ) : null}

                                {n.description ? <div className="needRow__desc">{n.description}</div> : null}

                                <div className="needRow__meta">
                                  <span className={`needPill needPill--status is-${safeLower(n.status)}`}>
                                    Status: {n.status ?? "—"}
                                  </span>
                                  <span className={`needPill needPill--priority is-${safeLower(n.priority)}`}>
                                    Priority: {n.priority ?? "—"}
                                  </span>
                                </div>
                              </div>

                              <div className="needRow__actions">
                                <Link className="btn btn--small" to={`/fundraisers/${id}/needs/${n.id}/pledge`}>
                                  Volunteer time
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Items */}
              <div className="needAcc">
                <button
                  type="button"
                  className="needAcc__head"
                  onClick={() => setOpenGroups((p) => ({ ...p, item: !p.item }))}
                  aria-expanded={openGroups.item}
                >
                  <span className="needAcc__left">
                    <span className="needAcc__chev">{openGroups.item ? "▾" : "▸"}</span>
                    <span className="needAcc__title">Item needs</span>
                    <span className="needAcc__count">{itemNeeds.length}</span>
                  </span>
                  <span className="needAcc__hint">{openGroups.item ? "Collapse" : "Expand"}</span>
                </button>

                {openGroups.item ? (
                  <div className="needAcc__body">
                    {itemNeeds.length === 0 ? (
                      <div className="needsEmpty">No item needs yet.</div>
                    ) : (
                      <div className="needsList">
                        {itemNeeds.map((n) => {
                          const itemType = getItemTypeLabel(n);

                          return (
                            <div key={n.id} className="needRow">
                              <div>
                                <div className="needRow__title">{n.title}</div>

                                {itemType ? (
                                  <div className="needRow__desc">
                                    <strong>Item type:</strong> {itemType}
                                  </div>
                                ) : null}

                                {n.description ? <div className="needRow__desc">{n.description}</div> : null}

                                <div className="needRow__meta">
                                  <span className={`needPill needPill--status is-${safeLower(n.status)}`}>
                                    Status: {n.status ?? "—"}
                                  </span>
                                  <span className={`needPill needPill--priority is-${safeLower(n.priority)}`}>
                                    Priority: {n.priority ?? "—"}
                                  </span>
                                </div>
                              </div>

                              <div className="needRow__actions">
                                <Link className="btn btn--small" to={`/fundraisers/${id}/needs/${n.id}/pledge`}>
                                  Pledge item
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Pledges */}
          <div className="panel pledgesPanel">
            <h3 className="panel__title">Pledges</h3>

            {reportError ? (
              <p className="muted">Couldn’t load pledges.</p>
            ) : isReportLoading ? (
              <p className="muted">Loading pledges…</p>
            ) : pledges.length === 0 ? (
              <p className="muted">No pledges yet.</p>
            ) : (
              <ul className="pledgeList">
                {pledges.map((p) => (
                  <li key={p.id} className="pledgeRow">
                    <div className="pledgeRow__top">
                      <strong className="pledgeRow__need">{p.need_title}</strong>
                      <span className="pledgeRow__who">
                        {p.supporter_username ? p.supporter_username : "anonymous"}
                      </span>
                    </div>
                    <div className="pledgeRow__comment">{p.comment ?? "—"}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Rewards */}
        <aside className="fundraiser__rightCol">
          <div className="panel rewardsPanel">
            <h3 className="panel__title">Rewards</h3>

            {!enable_rewards ? (
              <p className="muted">Rewards are disabled for this fundraiser.</p>
            ) : rewardTiers.length > 0 ? (
              <RewardTierList tiers={rewardTiers} disabled={true} onDeleteTier={null} onUpdateTier={null} />
            ) : (
              <p className="muted">No reward tiers yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
