// src/pages/FundraiserPage.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import useFundraiser from "../hooks/use-fundraiser";
import useFundraiserPledgesReport from "../hooks/use-fundraiser-pledges-report";
import getCurrentUser from "../api/get-current-user";
import RewardTierList from "../components/RewardTierList";
import getTimeNeedByNeedId from "../api/get-time-need-by-need-id";
import getItemNeedByNeedId from "../api/get-item-need-by-need-id";

import "./FundraiserPage.css";

/* =========================
   Formatting + helpers
   ========================= */

function formatAUD(value) {
  const n = Number(value);
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
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


function formatShiftLineAU(startIso, endIso) {
  if (!startIso && !endIso) return null;

  const d = new Date(startIso || endIso);
  if (Number.isNaN(d.getTime())) return null;

  const day = new Intl.DateTimeFormat("en-AU", { weekday: "long" }).format(d);
  const datePart = d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const fmtTime = (iso) => {
    if (!iso) return null;
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return null;

    // "5:00 pm" -> "5.00pm"
    const raw = new Intl.DateTimeFormat("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(t);

    return raw.replace(":", ".").replace(" am", "am").replace(" pm", "pm");
  };

  const startT = fmtTime(startIso);
  const endT = fmtTime(endIso);

  if (startT && endT) return `${day} ${datePart} — ${startT} - ${endT}`;
  if (startT) return `${day} ${datePart} ${startT}`;
  return `${day} ${datePart}`;
}

function safeLower(v) {
  return String(v ?? "").toLowerCase();
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * If your backend returns relative image paths, resolve them.
 */
function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url);

  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  const base = import.meta.env.VITE_API_URL || "";
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;
  const clean = s.startsWith("/") ? s.slice(1) : s;
  return `${baseWithSlash}${clean}`;
}

/**
 * Defensive targets (time + item totals)
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

  // Hooks must always run
  const { fundraiser, isLoading, error } = useFundraiser(id);
  const { report, isLoading: isReportLoading, error: reportError } =
    useFundraiserPledgesReport(id);

  const [currentUser, setCurrentUser] = useState(null);
  const [openGroups, setOpenGroups] = useState({
    money: true,
    time: true,
    item: true,
  });

  // Map of needId -> time-need object
  const [timeNeedMap, setTimeNeedMap] = useState({});
  const [itemNeedMap, setItemNeedMap] = useState({});


  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) return;

    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const needs = useMemo(() => fundraiser?.needs ?? [], [fundraiser?.needs]);
  const reward_tiers = useMemo(
    () => fundraiser?.reward_tiers ?? [],
    [fundraiser?.reward_tiers]
  );

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

  // Fetch time-need rows keyed by need.id
  useEffect(() => {
    let alive = true;

    async function loadTimeNeeds() {
      const needIds = timeNeeds.map((n) => n.id).filter(Boolean);
      if (needIds.length === 0) return;

      // fetch only missing
      const missing = needIds.filter((nid) => timeNeedMap[nid] == null);
      if (missing.length === 0) return;

      try {
        const pairs = await Promise.all(
          missing.map(async (nid) => {
            const td = await getTimeNeedByNeedId(nid);
            return [nid, td];
          })
        );

        if (!alive) return;

        setTimeNeedMap((prev) => {
          const next = { ...prev };
          for (const [nid, td] of pairs) {
            // store even null so we don't re-fetch forever
            next[nid] = td ?? null;
          }
          return next;
        });
      } catch {
        if (!alive) return;
        // If something fails, still mark as null to avoid spam refetch
        setTimeNeedMap((prev) => {
          const next = { ...prev };
          for (const nid of missing) next[nid] = null;
          return next;
        });
      }
    }

    loadTimeNeeds();
    return () => {
      alive = false;
    };
    // include timeNeedMap so missing calc is correct
  }, [timeNeeds, timeNeedMap]);

  useEffect(() => {
  let alive = true;

  async function loadItemNeeds() {
    const needIds = itemNeeds.map((n) => n.id).filter(Boolean);
    if (needIds.length === 0) return;

    const missing = needIds.filter((nid) => itemNeedMap[nid] == null);
    if (missing.length === 0) return;

    try {
      const pairs = await Promise.all(
        missing.map(async (nid) => [nid, await getItemNeedByNeedId(nid)])
      );
      if (!alive) return;

      setItemNeedMap((prev) => {
        const next = { ...prev };
        for (const [nid, obj] of pairs) next[nid] = obj ?? null;
        return next;
      });
    } catch {
      if (!alive) return;
      setItemNeedMap((prev) => {
        const next = { ...prev };
        for (const nid of missing) next[nid] = null;
        return next;
      });
    }
  }

  loadItemNeeds();
  return () => {
    alive = false;
  };
}, [itemNeeds, itemNeedMap]);


  // Early returns AFTER hooks
  if (isLoading) return <p className="fundraiser__state">Loading…</p>;
  if (error) return <p className="fundraiser__state">{error.message}</p>;
  if (!fundraiser) return <p className="fundraiser__state">Fundraiser not found.</p>;

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

  const heroImg = resolveImageUrl(image_url) || "https://picsum.photos/1200/700";

  const totals = report?.totals;
  const pledges = report?.pledges ?? [];

  const moneyPledged = totals?.total_money_pledged ?? 0;
  const timeHoursPledged = totals?.total_time_hours_pledged ?? 0;
  const itemQtyPledged = totals?.total_item_quantity_pledged ?? 0;

  const moneyTarget = Number(goal) > 0 ? Number(goal) : null;

  const timeTargetSum = timeNeeds.reduce(
    (acc, n) => acc + (getTimeTargetHours(n) ?? 0),
    0
  );
  const timeTarget = timeTargetSum > 0 ? timeTargetSum : null;

  const itemTargetSum = itemNeeds.reduce(
    (acc, n) => acc + (getItemTargetQty(n) ?? 0),
    0
  );
  const itemTarget = itemTargetSum > 0 ? itemTargetSum : null;

  const moneyPercent = moneyTarget ? moneyPledged / moneyTarget : null;
  const timePercent = timeTarget ? timeHoursPledged / timeTarget : null;
  const itemPercent = itemTarget ? itemQtyPledged / itemTarget : null;

  const canShowTotals = !reportError && !isReportLoading;

  const dateRangeLabel =
    start_date || end_date
      ? `${formatDateAU(start_date)}${end_date ? ` → ${formatDateAU(end_date)}` : ""}`
      : "TBA";

  return (
    <div className="fundraiser">
      <Link className="fundraiser__back" to="/fundraisers">
        ← Back to fundraisers
      </Link>

      {/* TOP GRID (Hero + Goal) */}
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
                    note={moneyTarget ? null : "No money goal set."}
                  />

                  <ProgressRow
                    label="Time pledged"
                    valueText={`${formatHours(timeHoursPledged)} hrs`}
                    percent={timePercent}
                    note={
                      timeTarget
                        ? `Target: ${formatHours(timeTarget)} hrs`
                        : "No total time target set on needs."
                    }
                  />

                  <ProgressRow
                    label="Items pledged"
                    valueText={`${Number(itemQtyPledged) || 0}`}
                    percent={itemPercent}
                    note={itemTarget ? `Target: ${Number(itemTarget)}` : "No total item target set on needs."}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BELOW GRID (Left + Rewards) */}
      <div className="fundraiser__belowGrid">
        {/* LEFT */}
        <div className="fundraiser__leftCol">
          <div className="panel headerMetaPanel">
            <h1 className="fundraiser__title">{title}</h1>

            <div className="metaGrid">
              <div className="metaGrid__label">Location</div>
              <div className="metaGrid__value">{location || "—"}</div>

              <div className="metaGrid__label">Backyard Dates</div>
              <div className="metaGrid__value">{dateRangeLabel}</div>

              <div className="metaGrid__label">Fundraiser status</div>
              <div className="metaGrid__value">
                <span className={`statusPill ${is_open ? "statusPill--open" : "statusPill--closed"}`}>
                  <span className={`statusDot ${is_open ? "statusDot--open" : "statusDot--closed"}`} />
                  {is_open ? "Open" : "Closed"}
                </span>
              </div>
            </div>

            {isOwner ? (
              <div className="headerMetaPanel__actions">
                <Link className="fundraiser__editLink" to={`/fundraisers/${id}/edit`}>
                  Edit fundraiser
                </Link>
              </div>
            ) : null}
          </div>

          {/* STORY */}
          <div className="panel storyPanel">
            <h2 className="panel__title">Story / Description</h2>
            <p className="fundraiser__desc">{description}</p>
          </div>

          {/* NEEDS */}
          <section className="fundraiser__section">
            <div className="panel needsPanel">
              <div className="needsPanel__head">
                <div>
                  <h2 className="panel__title" style={{ marginBottom: 6 }}>
                    What this fundraiser needs
                  </h2>
                  <p className="needsPanel__note muted">
                    Choose a need to pledge against. Keep sections open while you work; collapse when you want a cleaner
                    view.
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
            const td = timeNeedMap[n.id] ?? null;
            const whenLabel = td
              ? formatShiftLineAU(td.start_datetime, td.end_datetime)
              : null;

            return (
              <div key={n.id} className="needRow">
                <div>
                  <div className="needRow__title">{n.title}</div>

                  {whenLabel ? (
                    <div className="needRow__desc">
                      <strong>Time:</strong> {whenLabel}
                    </div>
                  ) : (
                    <div className="needRow__desc muted">Time: TBA</div>
                  )}

                  {n.description ? (
                    <div className="needRow__desc">{n.description}</div>
                  ) : null}

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
  const idetail = itemNeedMap[n.id] ?? null;

  const mode = String(idetail?.mode ?? "").toLowerCase();
  const hasDonation = idetail?.donation_reward_tier != null;
  const hasLoan = idetail?.loan_reward_tier != null;

  const baseTo = `/fundraisers/${id}/needs/${n.id}/pledge`;

  // ✅ define the label FIRST so your pill can use it
  let itemModeLabel = null;

  // ✅ build buttons
  let buttons = [{ label: "Pledge item", to: baseTo }];

  if (mode.includes("donat") || (hasDonation && !hasLoan)) {
    itemModeLabel = "Donation";
    buttons = [{ label: "Donate item", to: `${baseTo}?mode=donation` }];
  } else if (mode.includes("loan") || (!hasDonation && hasLoan)) {
    itemModeLabel = "Loan";
    buttons = [{ label: "Loan item", to: `${baseTo}?mode=loan` }];
  } else if (mode.includes("either") || (hasDonation && hasLoan)) {
    itemModeLabel = "Either";
    buttons = [
      { label: "Donate item", to: `${baseTo}?mode=donation` },
      { label: "Loan item", to: `${baseTo}?mode=loan` },
    ];
  }

return (
  <div key={n.id} className="needRow">
    <div className="needRow__left">
      <div className="needRow__title">{n.title}</div>

      {n.description ? (
        <div className="needRow__desc">{n.description}</div>
      ) : null}

      <div className="needRow__meta">
        {itemModeLabel ? (
          <span className={`needPill needPill--type is-${safeLower(itemModeLabel)}`}>
            Type: {itemModeLabel}
          </span>
        ) : null}

        <span className={`needPill needPill--status is-${safeLower(n.status)}`}>
          Status: {n.status ?? "—"}
        </span>

        <span className={`needPill needPill--priority is-${safeLower(n.priority)}`}>
          Priority: {n.priority ?? "—"}
        </span>
      </div>
    </div>

    <div className="needRow__actions">
      {buttons.map((b) => (
        <Link key={b.to} className="btn btn--small" to={b.to}>
          {b.label}
        </Link>
      ))}
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
          </section>

          {/* PLEDGES */}
          <section className="fundraiser__section">
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
          </section>
        </div>

        {/* RIGHT */}
        <aside className="fundraiser__rightCol">
          <div className="panel rewardsPanel">
            <h3 className="panel__title">Rewards</h3>

            {!enable_rewards ? (
              <p className="muted">Rewards are disabled for this fundraiser.</p>
            ) : reward_tiers.length > 0 ? (
              <RewardTierList tiers={reward_tiers} disabled={true} onDeleteTier={null} onUpdateTier={null} />
            ) : (
              <p className="muted">No reward tiers yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
