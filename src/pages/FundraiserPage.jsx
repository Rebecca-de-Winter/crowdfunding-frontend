// src/pages/FundraiserPage.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import useFundraiser from "../hooks/use-fundraiser";
import useFundraiserPledgesReport from "../hooks/use-fundraiser-pledges-report";
import getCurrentUser from "../api/get-current-user";
import RewardTierList from "../components/RewardTierList";

import getTimeNeedByNeedId from "../api/get-time-need-by-need-id";
import getItemNeedByNeedId from "../api/get-item-need-by-need-id";
import getMoneyNeedByNeedId from "../api/get-money-need-by-need-id";

import postPledgeApprove from "../api/post-pledge-approve";
import postPledgeDecline from "../api/post-pledge-decline";
import postPledgeCancel from "../api/post-pledge-cancel";

import "./FundraiserPage.css";

import { summarisePledgesForNeed, computeNeedProgress } from "../utils/need-progress";

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

function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url);

  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  const base = import.meta.env.VITE_API_URL || "";
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;
  const clean = s.startsWith("/") ? s.slice(1) : s;
  return `${baseWithSlash}${clean}`;
}

function getMoneyTargetAmount(need, moneyDetail) {
  const md = moneyDetail ?? need?.money_detail ?? need?.money_need_detail ?? null;

  const raw =
    md?.amount_needed ||
    md?.amount_required ||
    md?.target_amount ||
    md?.target ||
    md?.amount ||
    null;

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function hoursBetween(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso);
  const end = new Date(endIso);
  const ms = end - start;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return ms / (1000 * 60 * 60);
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pledgeStatusLabel(raw) {
  const s = String(raw ?? "").toLowerCase();
  if (s === "pending") return "Pending";
  if (s === "approved") return "Approved";
  if (s === "declined" || s === "rejected") return "Declined";
  if (s === "cancelled" || s === "canceled") return "Cancelled";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}

// Reserve capacity for pending + approved; not for declined/cancelled.
function shouldReserveCapacity(status) {
  const s = String(status ?? "").toLowerCase();
  if (s === "cancelled" || s === "rejected" || s === "declined") return false;
  return true;
}

// Counts pending + approved (so needs count down immediately)
function buildFilledMapsFromReport(pledges = []) {
  const timeFilledByNeedId = {};
  const itemFilledByNeedId = {};

  for (const p of pledges) {
    if (!shouldReserveCapacity(p?.status)) continue;

    const needId = p?.need_id ?? p?.need;
    if (!needId) continue;

    const type = String(p?.need_type ?? "").toLowerCase();

    if (type === "time") {
      timeFilledByNeedId[needId] = (timeFilledByNeedId[needId] ?? 0) + 1;
    }

    if (type === "item") {
      const qty =
        toNumber(p?.item_detail?.quantity) ||
        toNumber(p?.quantity_pledged) ||
        toNumber(p?.quantity) ||
        toNumber(p?.quantity_committed) ||
        1;

      itemFilledByNeedId[needId] = (itemFilledByNeedId[needId] ?? 0) + qty;
    }
  }

  return { timeFilledByNeedId, itemFilledByNeedId };
}

/* =========================
   Fundraiser status helpers
   ========================= */

function normaliseFundraiserStatus(raw) {
  const s = String(raw ?? "").toLowerCase().trim();
  if (!s) return "draft";
  if (s === "unpublished") return "draft";
  if (s === "published") return "active";
  return s;
}

function statusLabel(raw) {
  const s = normaliseFundraiserStatus(raw);
  if (s === "draft") return "Draft";
  if (s === "active") return "Active";
  if (s === "closed") return "Closed";
  if (s === "cancelled") return "Cancelled";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isAcceptingPledges(fundraiser) {
  if (typeof fundraiser?.is_open === "boolean") return fundraiser.is_open;

  const s = normaliseFundraiserStatus(fundraiser?.status);
  if (s === "draft" || s === "closed" || s === "cancelled") return false;

  const now = new Date();
  const start = fundraiser?.start_date ? new Date(fundraiser.start_date) : null;
  const end = fundraiser?.end_date ? new Date(fundraiser.end_date) : null;

  if (start && Number.isFinite(start.getTime()) && now < start) return false;
  if (end && Number.isFinite(end.getTime()) && now > end) return false;
  return true;
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
          style={{ width: pct == null ? "0%" : `${pct * 100}%` }}
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

  const { fundraiser, isLoading, error } = useFundraiser(id);
  const { report, isLoading: isReportLoading, error: reportError } =
    useFundraiserPledgesReport(id);

  const [currentUser, setCurrentUser] = useState(null);

  const [openGroups, setOpenGroups] = useState({
    money: true,
    time: true,
    item: true,
  });

  const [timeNeedMap, setTimeNeedMap] = useState({});
  const [itemNeedMap, setItemNeedMap] = useState({});
  const [moneyNeedMap, setMoneyNeedMap] = useState({});

  // Pledge actions
  const [pledgeStatusOverride, setPledgeStatusOverride] = useState({});
  const [actingOn, setActingOn] = useState(null);
  const [pledgeActionError, setPledgeActionError] = useState(null);

  // Current user
  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) return;

    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const needs = useMemo(() => fundraiser?.needs ?? [], [fundraiser?.needs]);
  const rewardTiers = useMemo(() => fundraiser?.reward_tiers ?? [], [fundraiser?.reward_tiers]);

  const moneyNeeds = useMemo(() => needs.filter((n) => n.need_type === "money"), [needs]);
  const timeNeeds = useMemo(() => needs.filter((n) => n.need_type === "time"), [needs]);
  const itemNeeds = useMemo(() => needs.filter((n) => n.need_type === "item"), [needs]);

  // Fetch time needs detail
  useEffect(() => {
    let alive = true;

    async function loadTimeNeeds() {
      const ids = timeNeeds.map((n) => n.id).filter(Boolean);
      if (ids.length === 0) {
        setTimeNeedMap({});
        return;
      }

      try {
        const pairs = await Promise.all(ids.map(async (nid) => [nid, await getTimeNeedByNeedId(nid)]));
        if (!alive) return;

        const next = {};
        for (const [nid, td] of pairs) next[nid] = td ?? null;
        setTimeNeedMap(next);
      } catch {
        if (!alive) return;
        const next = {};
        for (const nid of ids) next[nid] = null;
        setTimeNeedMap(next);
      }
    }

    loadTimeNeeds();
    return () => {
      alive = false;
    };
  }, [timeNeeds]);

  // Fetch item needs detail
  useEffect(() => {
    let alive = true;

    async function loadItemNeeds() {
      const ids = itemNeeds.map((n) => n.id).filter(Boolean);
      if (ids.length === 0) {
        setItemNeedMap({});
        return;
      }

      try {
        const pairs = await Promise.all(ids.map(async (nid) => [nid, await getItemNeedByNeedId(nid)]));
        if (!alive) return;

        const next = {};
        for (const [nid, obj] of pairs) next[nid] = obj ?? null;
        setItemNeedMap(next);
      } catch {
        if (!alive) return;
        const next = {};
        for (const nid of ids) next[nid] = null;
        setItemNeedMap(next);
      }
    }

    loadItemNeeds();
    return () => {
      alive = false;
    };
  }, [itemNeeds]);

  // Fetch money needs detail
  useEffect(() => {
    let alive = true;

    async function loadMoneyNeeds() {
      const ids = moneyNeeds.map((n) => n.id).filter(Boolean);
      if (ids.length === 0) {
        setMoneyNeedMap({});
        return;
      }

      try {
        const pairs = await Promise.all(ids.map(async (nid) => [nid, await getMoneyNeedByNeedId(nid)]));
        if (!alive) return;

        const next = {};
        for (const [nid, md] of pairs) next[nid] = md ?? null;
        setMoneyNeedMap(next);
      } catch {
        if (!alive) return;
        const next = {};
        for (const nid of ids) next[nid] = null;
        setMoneyNeedMap(next);
      }
    }

    loadMoneyNeeds();
    return () => {
      alive = false;
    };
  }, [moneyNeeds]);

  // Report inputs
  const pledgesArr = report?.pledges;
  const totals = report?.totals;

  // Patch pledge status locally so badges + counts update instantly
  const pledges = useMemo(() => {
    const arr = pledgesArr ?? [];
    return arr.map((p) => {
      const forced = pledgeStatusOverride[p.id];
      return forced ? { ...p, status: forced } : p;
    });
  }, [pledgesArr, pledgeStatusOverride]);

  const { timeFilledByNeedId, itemFilledByNeedId } = useMemo(() => {
    return buildFilledMapsFromReport(pledges);
  }, [pledges]);

  // approval rule flag
  const requiresApproval = Boolean(fundraiser?.require_pledge_approval);

  // Time progress per need
  const timeProgressByNeedId = useMemo(() => {
    const map = {};

    for (const n of timeNeeds) {
      let approved = 0;
      let pending = 0;

      for (const p of pledges) {
        if (Number(p.need_id) !== Number(n.id)) continue;
        const s = String(p.status ?? "").toLowerCase();
        if (s === "approved") approved += 1;
        else if (s === "pending") pending += 1;
      }

      const td = timeNeedMap[n.id] ?? null;
      const targetQty = toNumber(td?.volunteers_needed);

      map[n.id] = computeNeedProgress({
        targetQty,
        approvedQty: approved,
        pendingQty: pending,
        requiresApproval,
        isCancelled: safeLower(n.status) === "cancelled",
      });
    }

    return map;
  }, [pledges, timeNeeds, timeNeedMap, requiresApproval]);

  // Item progress per need
  const itemProgressByNeedId = useMemo(() => {
    const map = {};

    for (const n of itemNeeds) {
      const idetail = itemNeedMap[n.id] ?? null;
      const targetQty = toNumber(idetail?.quantity_needed);

      const sum = summarisePledgesForNeed(pledges, n.id);

      map[n.id] = computeNeedProgress({
        targetQty,
        approvedQty: sum.approvedQty,
        pendingQty: sum.pendingQty,
        requiresApproval,
        isCancelled: safeLower(n.status) === "cancelled",
      });
    }

    return map;
  }, [pledges, itemNeeds, itemNeedMap, requiresApproval]);

  // Money progress per need
  const moneyProgressByNeedId = useMemo(() => {
    const map = {};

    for (const n of moneyNeeds) {
      const md = moneyNeedMap[n.id] ?? null;
      const targetQty = toNumber(getMoneyTargetAmount(n, md));

      const sum = summarisePledgesForNeed(pledges, n.id);

      map[n.id] = computeNeedProgress({
        targetQty,
        approvedQty: sum.approvedQty,
        pendingQty: sum.pendingQty,
        requiresApproval,
        isCancelled: safeLower(n.status) === "cancelled",
      });
    }

    return map;
  }, [pledges, moneyNeeds, moneyNeedMap, requiresApproval]);

  /* =========================
     Early returns
     ========================= */

  if (isLoading) return <p className="fundraiser__state">Loading…</p>;
  if (error) return <p className="fundraiser__state">{error.message}</p>;
  if (!fundraiser) return <p className="fundraiser__state">Fundraiser not found.</p>;

  /* =========================
     ✅ Draft protection (stable)
     ========================= */

  const statusLower = String(fundraiser?.status ?? "").toLowerCase().trim();
  const isDraft = statusLower === "draft";

  const ownerIdRaw = fundraiser?.owner?.id ?? fundraiser?.owner?.pk ?? fundraiser?.owner;
  const ownerId = ownerIdRaw != null ? Number(ownerIdRaw) : null;

  const token = window.localStorage.getItem("token");
  const hasToken = Boolean(token);

  // If draft AND logged in, wait until we know who the viewer is
  if (isDraft && hasToken && currentUser === null) {
    return <p className="fundraiser__state">Loading…</p>;
  }

  const viewerId = currentUser?.id != null ? Number(currentUser.id) : null;
  const isOwner = viewerId != null && ownerId != null && viewerId === ownerId;

  // Hide drafts from everyone except the owner
  if (isDraft && !isOwner) {
    return (
      <div className="fundraiser">
        <Link className="fundraiser__back" to="/fundraisers">
          ← Back to fundraisers
        </Link>
        <p className="fundraiser__state">This fundraiser isn’t public yet.</p>
      </div>
    );
  }

  /* =========================
     Render inputs
     ========================= */

  const {
    title,
    description,
    image_url,
    goal,
    location,
    start_date,
    end_date,
    enable_rewards,
    status,
  } = fundraiser;

  const heroImg = resolveImageUrl(image_url) || "https://picsum.photos/1200/700";

  const moneyPledged = totals?.total_money_pledged ?? 0;
  const timeHoursPledged = totals?.total_time_hours_pledged ?? 0;
  const itemQtyPledged = totals?.total_item_quantity_pledged ?? 0;

  const moneyTarget = Number(goal) > 0 ? Number(goal) : null;

  // Time target (hours)
  let timeTargetSum = 0;
  let foundTimeTarget = false;

  for (const n of timeNeeds) {
    const td = timeNeedMap[n.id] ?? null;
    if (!td) continue;

    const hrs = hoursBetween(td.start_datetime, td.end_datetime);
    const volsRaw = Number(td.volunteers_needed ?? 1);
    const vols = Number.isFinite(volsRaw) && volsRaw > 0 ? volsRaw : 1;

    if (hrs > 0) {
      timeTargetSum += hrs * vols;
      foundTimeTarget = true;
    }
  }

  const timeTarget = foundTimeTarget && timeTargetSum > 0 ? timeTargetSum : null;

  // Item target
  let itemTargetSum = 0;
  let foundItemTarget = false;

  for (const n of itemNeeds) {
    const d = itemNeedMap[n.id] ?? null;
    if (!d) continue;

    const q = Number(d.quantity_needed ?? 0);
    if (Number.isFinite(q) && q > 0) {
      itemTargetSum += q;
      foundItemTarget = true;
    }
  }

  const itemTarget = foundItemTarget && itemTargetSum > 0 ? itemTargetSum : null;

  const moneyPercent = moneyTarget ? moneyPledged / moneyTarget : null;
  const timePercent = timeTarget ? timeHoursPledged / timeTarget : null;
  const itemPercent = itemTarget ? itemQtyPledged / itemTarget : null;

  const canShowTotals = !reportError && !isReportLoading;

  const dateRangeLabel =
    start_date || end_date
      ? `${formatDateAU(start_date)}${end_date ? ` → ${formatDateAU(end_date)}` : ""}`
      : "TBA";

  const lifecycle = normaliseFundraiserStatus(status);
  const accepting = isAcceptingPledges(fundraiser);

  async function runPledgeAction(pledgeId, action) {
    try {
      setPledgeActionError(null);
      setActingOn(pledgeId);

      if (action === "approve") await postPledgeApprove(pledgeId);
      else if (action === "decline") await postPledgeDecline(pledgeId);
      else if (action === "cancel") await postPledgeCancel(pledgeId);
      else throw new Error(`Unknown action: ${action}`);

      setPledgeStatusOverride((prev) => ({
        ...prev,
        [pledgeId]:
          action === "approve" ? "approved" : action === "decline" ? "declined" : "cancelled",
      }));
    } catch (e) {
      setPledgeActionError(e?.message || "Couldn’t update pledge.");
    } finally {
      setActingOn(null);
    }
  }

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
                    note={timeTarget ? `Target: ${formatHours(timeTarget)} hrs` : "No time targets set on needs yet."}
                  />

                  <ProgressRow
                    label="Items pledged"
                    valueText={`${Number(itemQtyPledged) || 0}`}
                    percent={itemPercent}
                    note={itemTarget ? `Target: ${Number(itemTarget)}` : "No item targets set on needs yet."}
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

              <div className="metaGrid__label metaGrid__label--top">Fundraiser status</div>
              <div className="metaGrid__value metaGrid__value--status">
                <div className="statusRow">
                  <span className={`statusPill statusPill--lifecycle is-${safeLower(lifecycle)}`}>
                    <span className={`statusDot statusDot--lifecycle is-${safeLower(lifecycle)}`} aria-hidden="true" />
                    <span className="statusPill__text">{statusLabel(lifecycle)}</span>
                  </span>
                </div>
              </div>

              <div className="metaGrid__label">Accepting pledges</div>
              <div className="metaGrid__value">
                <strong>{accepting ? "Yes" : "No"}</strong>
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
            <p className="fundraiser__desc">{description || "—"}</p>
          </div>

          {/* NEEDS */}
          <section className="fundraiser__section">
            <div className="panel needsPanel">
              <div className="needsPanel__head">
                <div>
                  <h2 className="panel__title" style={{ marginBottom: 6 }}>
                    What this fundraiser needs
                  </h2>
                  <p className="needsPanel__note muted">Choose a need to pledge against.</p>
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
                          {moneyNeeds.map((n) => {
                            const md = moneyNeedMap[n.id] ?? null;
                            const targetAmount = getMoneyTargetAmount(n, md);
                            const prog = moneyProgressByNeedId[n.id];

                            const showMiniBadge =
                              targetAmount != null &&
                              targetAmount > 0 &&
                              prog &&
                              prog.remainingQty === 0;

                            return (
                              <div key={n.id} className="needRow">
                                <div>
                                  <div className="needRow__title">
                                    {n.title}
                                    {showMiniBadge ? (
                                      <span className={`needMiniBadge ${prog.isFilled ? "needMiniBadge--done" : ""}`}>
                                        {prog.pill?.label || "Filled"}
                                      </span>
                                    ) : null}
                                  </div>

                                  {n.description ? <div className="needRow__desc">{n.description}</div> : null}

                                  {targetAmount != null ? (
                                    <div className="needRow__desc">
                                      <strong>Target:</strong> {formatAUD(targetAmount)}
                                    </div>
                                  ) : (
                                    <div className="needRow__desc muted">Target: —</div>
                                  )}

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
                            );
                          })}
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
                            const whenLabel = td ? formatShiftLineAU(td.start_datetime, td.end_datetime) : null;

                            const neededVols = toNumber(td?.volunteers_needed);
                            const filledVols = toNumber(timeFilledByNeedId[n.id]);
                            const leftVols = Math.max(0, neededVols - filledVols);

                            const prog = timeProgressByNeedId[n.id];
                            const timeBadgeText =
                              neededVols > 0 && prog?.remainingQty === 0
                                ? prog?.pill?.label || "Filled"
                                : `Vol left: ${leftVols} / ${neededVols}`;

                            return (
                              <div key={n.id} className="needRow">
                                <div>
                                  <div className="needRow__title">
                                    {n.title}
                                    {neededVols > 0 ? (
                                      <span
                                        className={`needMiniBadge ${prog?.remainingQty === 0 ? "needMiniBadge--done" : ""}`}
                                      >
                                        {timeBadgeText}
                                      </span>
                                    ) : null}
                                  </div>

                                  {whenLabel ? (
                                    <div className="needRow__desc">
                                      <strong>Time:</strong> {whenLabel}
                                    </div>
                                  ) : (
                                    <div className="needRow__desc muted">Time: TBA</div>
                                  )}

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
                            const idetail = itemNeedMap[n.id] ?? null;

                            const mode = String(idetail?.mode ?? "").toLowerCase();
                            const hasDonation = idetail?.donation_reward_tier != null;
                            const hasLoan = idetail?.loan_reward_tier != null;

                            const baseTo = `/fundraisers/${id}/needs/${n.id}/pledge`;

                            let itemModeLabel = null;
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

                            const neededQty = toNumber(idetail?.quantity_needed);
                            const filledQty = toNumber(itemFilledByNeedId[n.id]);
                            const leftQty = Math.max(0, neededQty - filledQty);

                            const prog = itemProgressByNeedId[n.id];
                            const itemBadgeText =
                              neededQty > 0 && prog?.remainingQty === 0
                                ? prog?.pill?.label || "Filled"
                                : `Qty left: ${leftQty} / ${neededQty}`;

                            return (
                              <div key={n.id} className="needRow">
                                <div className="needRow__left">
                                  <div className="needRow__title">
                                    {n.title}
                                    {neededQty > 0 ? (
                                      <span
                                        className={`needMiniBadge ${prog?.remainingQty === 0 ? "needMiniBadge--done" : ""}`}
                                      >
                                        {itemBadgeText}
                                      </span>
                                    ) : null}
                                  </div>

                                  {n.description ? <div className="needRow__desc">{n.description}</div> : null}

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

              {pledgeActionError ? (
                <p className="muted" style={{ marginTop: 8 }}>
                  {pledgeActionError}
                </p>
              ) : null}

              {reportError ? (
                <p className="muted">Couldn’t load pledges.</p>
              ) : isReportLoading ? (
                <p className="muted">Loading pledges…</p>
              ) : pledges.length === 0 ? (
                <p className="muted">No pledges yet.</p>
              ) : (
                <ul className="pledgeList">
                  {pledges.map((p) => {
                    const status = String(p.status ?? "pending").toLowerCase();
                    const isBusy = actingOn === p.id;

                    return (
                      <li key={p.id} className="pledgeRow">
                        <div className="pledgeRow__top">
                          <strong className="pledgeRow__need">{p.need_title}</strong>
                          <span className="pledgeRow__who">
                            {p.supporter_username ? p.supporter_username : "anonymous"}
                          </span>
                        </div>

                        <div className="pledgeRow__meta pledgeRow__meta--spaced">
                          <span className={`needPill needPill--status is-${safeLower(status)}`}>
                            Status: {pledgeStatusLabel(status)}
                          </span>
                        </div>

                        <div className="pledgeRow__comment">{p.comment ?? "—"}</div>

                        {isOwner ? (
                          <div className="pledgeRow__actions">
                            {status === "pending" ? (
                              <>
                                <button
                                  className="btn btn--small"
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => runPledgeAction(p.id, "approve")}
                                >
                                  Approve
                                </button>

                                <button
                                  className="btn btn--small"
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => runPledgeAction(p.id, "decline")}
                                >
                                  Decline
                                </button>
                              </>
                            ) : null}

                            <button
                              className="btn btn--small btn--ghost"
                              type="button"
                              disabled={isBusy}
                              onClick={() => runPledgeAction(p.id, "cancel")}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
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
