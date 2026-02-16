// src/pages/ProfilePage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import getMyFundraisersReport from "../api/get-my-fundraisers-report";
import getMyPledgesReport from "../api/get-my-pledges-report";
import getFundraiserPledgesReport from "../api/get-fundraiser-pledges-report";
import getMyRewardsForFundraiser from "../api/get-my-rewards-for-fundraiser";

import postPledgeApprove from "../api/post-pledge-approve";
import postPledgeDecline from "../api/post-pledge-decline";
import postPledgeCancel from "../api/post-pledge-cancel";

import "./ProfilePage.css";

/* -------------------------
   Helpers
------------------------- */
function safeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function safeLower(v) {
  return String(v || "").trim().toLowerCase();
}

function statusLabel(s) {
  const v = safeLower(s);
  if (!v) return "—";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function toTitleCase(word) {
  const w = safeLower(word);
  if (!w) return "—";
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function formatAUD(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function byPendingThenNewest(a, b) {
  const ap = safeLower(a?.status) === "pending" ? 0 : 1;
  const bp = safeLower(b?.status) === "pending" ? 0 : 1;
  if (ap !== bp) return ap - bp;

  const ad = Date.parse(a?.date_created || a?.date_updated || "") || 0;
  const bd = Date.parse(b?.date_created || b?.date_updated || "") || 0;
  return bd - ad;
}

function groupCountsByStatus(items, key = "status") {
  return items.reduce((acc, item) => {
    const k = safeLower(item?.[key]) || "unknown";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function getFundraiserId(obj) {
  return obj?.id ?? obj?.fundraiser_id ?? obj?.pk ?? null;
}

function pledgeValueLabel(p) {
  if (p?.money_detail?.amount != null) return formatAUD(p.money_detail.amount);
  if (p?.time_detail?.hours_committed != null)
    return `${p.time_detail.hours_committed} hrs`;
  if (p?.item_detail?.quantity != null) return `Qty ${p.item_detail.quantity}`;
  return "—";
}

function pledgeValueKind(p) {
  if (p?.money_detail?.amount != null) return "money";
  if (p?.time_detail?.hours_committed != null) return "time";
  if (p?.item_detail?.quantity != null) return "item";
  return "other";
}

function sumIncomingTotals(pledges) {
  let totalMoney = 0;
  let totalHours = 0;
  let totalItems = 0;

  for (const p of pledges) {
    const amount = Number(p?.money_detail?.amount ?? 0);
    if (Number.isFinite(amount)) totalMoney += amount;

    const hours = Number(p?.time_detail?.hours_committed ?? 0);
    if (Number.isFinite(hours)) totalHours += hours;

    const qty = Number(p?.item_detail?.quantity ?? 0);
    if (Number.isFinite(qty)) totalItems += qty;
  }

  return {
    total_pledges: pledges.length,
    total_money_pledged: totalMoney,
    total_time_hours_pledged: totalHours,
    total_item_quantity_pledged: totalItems,
  };
}

/* -------------------------
   Component
------------------------- */
function ProfilePage() {
  const [activeRole, setActiveRole] = useState("supporter"); // supporter | organizer

  const [myFundraisers, setMyFundraisers] = useState([]);
  const [myPledges, setMyPledges] = useState([]);

  const [incomingPledges, setIncomingPledges] = useState([]);
  const [incomingTotals, setIncomingTotals] = useState(null);

  const [pledgeTotals, setPledgeTotals] = useState(null);
  const [supporter, setSupporter] = useState(null);

  const [myRewardsByFundraiser, setMyRewardsByFundraiser] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        // 1) My fundraisers + my pledges in parallel
        const [fundraisersData, pledgesReport] = await Promise.all([
          getMyFundraisersReport(),
          getMyPledgesReport(),
        ]);

        const fundraisersList = safeArray(fundraisersData);
        setMyFundraisers(fundraisersList);

        const pledgesList = Array.isArray(pledgesReport)
          ? pledgesReport
          : Array.isArray(pledgesReport?.pledges)
          ? pledgesReport.pledges
          : safeArray(pledgesReport);

        setMyPledges(pledgesList);
        setPledgeTotals(pledgesReport?.totals ?? null);
        setSupporter(pledgesReport?.supporter ?? null);

        // 2) Incoming pledges for my fundraisers
        const fundraiserIds = fundraisersList
          .map((f) => getFundraiserId(f))
          .filter(Boolean);

        if (fundraiserIds.length) {
          const results = await Promise.allSettled(
            fundraiserIds.map((id) => getFundraiserPledgesReport(id))
          );

          const flatIncoming = results.flatMap((r, idx) => {
            const fid = fundraiserIds[idx];
            if (r.status !== "fulfilled") return [];

            const report = r.value;
            const list = Array.isArray(report?.pledges)
              ? report.pledges
              : safeArray(report);

            return list.map((p) => ({
              ...p,
              fundraiser_id: p.fundraiser_id ?? p.fundraiser ?? fid,
              _source: "incoming",
            }));
          });

          setIncomingPledges(flatIncoming);
          setIncomingTotals(sumIncomingTotals(flatIncoming));
        } else {
          setIncomingPledges([]);
          setIncomingTotals(sumIncomingTotals([]));
        }

        // 3) Supporter rewards per fundraiser I pledged to
        const supporterFundraiserIds = Array.from(
          new Set(
            pledgesList
              .map((p) => p.fundraiser_id ?? p.fundraiser ?? null)
              .filter(Boolean)
          )
        );

        if (supporterFundraiserIds.length) {
          const rewardResults = await Promise.allSettled(
            supporterFundraiserIds.map((id) => getMyRewardsForFundraiser(id))
          );

          const rewardsMap = {};
          rewardResults.forEach((r, idx) => {
            const fid = supporterFundraiserIds[idx];
            if (r.status === "fulfilled") rewardsMap[fid] = r.value;
          });

          setMyRewardsByFundraiser(rewardsMap);
        } else {
          setMyRewardsByFundraiser({});
        }
      } catch (err) {
        console.error(err);
        setError(err?.message || "Something went wrong loading your dashboard.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleCancelPledge(id) {
    try {
      const updated = await postPledgeCancel(id);
      setMyPledges((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      console.error(err);
      setError(err?.message || "Could not cancel pledge.");
    }
  }

  async function handleApproveIncoming(id) {
    try {
      const updated = await postPledgeApprove(id);
      setIncomingPledges((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );

      // recompute totals using the next list
      setIncomingTotals((prevTotals) => {
        if (!prevTotals) return prevTotals;
        const next = incomingPledges.map((p) => (p.id === id ? { ...p, ...updated } : p));
        return sumIncomingTotals(next);
      });
    } catch (err) {
      console.error(err);
      setError(err?.message || "Could not approve pledge.");
    }
  }

  async function handleDeclineIncoming(id) {
    try {
      const updated = await postPledgeDecline(id);
      setIncomingPledges((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );

      setIncomingTotals((prevTotals) => {
        if (!prevTotals) return prevTotals;
        const next = incomingPledges.map((p) => (p.id === id ? { ...p, ...updated } : p));
        return sumIncomingTotals(next);
      });
    } catch (err) {
      console.error(err);
      setError(err?.message || "Could not decline pledge.");
    }
  }

  /* -------------------------
     Derived stats
  ------------------------- */
  const fundraisersByStatus = useMemo(
    () => groupCountsByStatus(myFundraisers, "status"),
    [myFundraisers]
  );

  const myPledgesByStatus = useMemo(
    () => groupCountsByStatus(myPledges, "status"),
    [myPledges]
  );

  const incomingByStatus = useMemo(
    () => groupCountsByStatus(incomingPledges, "status"),
    [incomingPledges]
  );

  const myPledgesSorted = useMemo(() => {
    const copy = [...myPledges];
    copy.sort(byPendingThenNewest);
    return copy;
  }, [myPledges]);

  const incomingSorted = useMemo(() => {
    const copy = [...incomingPledges];
    copy.sort(byPendingThenNewest);
    return copy;
  }, [incomingPledges]);

  const myPendingCount = myPledgesByStatus.pending || 0;
  const incomingPendingCount = incomingByStatus.pending || 0;

  return (
    <div className="profilePage">
      {/* ✅ THIS is the width-lock container.
          Your CSS can keep using .profilePage for max-width if you want,
          but if you already changed pages to use an inner wrapper, this keeps it consistent.
      */}
      <div className="profilePage__inner">
        <header className="profilePage__header">
          <div className="profilePage__headerTop">
            <div className="profilePage__headerLeft">
              <h1 className="profilePage__title">My Dashboard</h1>

              <p className="profilePage__subtitle">
                Switch between <strong>Supporter</strong> and{" "}
                <strong>Organiser</strong> to see your festivals and pledges.
              </p>

              <div className="profilePage__roleRow">
                <div
                  className={`roleToggle ${
                    activeRole === "supporter" ? "is-supporter" : "is-organizer"
                  }`}
                  role="tablist"
                  aria-label="Dashboard role"
                >
                  <span className="roleToggle__indicator" aria-hidden="true" />

                  <button
                    type="button"
                    className={`roleToggle__btn ${
                      activeRole === "supporter" ? "is-active" : ""
                    }`}
                    onClick={() => setActiveRole("supporter")}
                    role="tab"
                    aria-selected={activeRole === "supporter"}
                  >
                    Supporter
                  </button>

                  <button
                    type="button"
                    className={`roleToggle__btn ${
                      activeRole === "organizer" ? "is-active" : ""
                    }`}
                    onClick={() => setActiveRole("organizer")}
                    role="tab"
                    aria-selected={activeRole === "organizer"}
                  >
                    Organiser
                  </button>
                </div>

                <div
                  className={`roleMode ${
                    activeRole === "organizer" ? "is-organizer" : "is-supporter"
                  }`}
                  aria-live="polite"
                >
                  <span className="roleMode__label">Viewing as:</span>
                  <strong className="roleMode__value">
                    {activeRole === "organizer"
                      ? "Organiser / Fundraiser owner"
                      : "Supporter"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="profilePage__badgeArea">
              {supporter?.username && (
                <div className="profileBadge">
                  Signed in as <strong>{supporter.username}</strong>
                </div>
              )}

              {activeRole === "organizer" && incomingPendingCount > 0 && (
                <div className="profileBadge profileBadge--warn">
                  {incomingPendingCount} incoming pending
                </div>
              )}

              {activeRole === "supporter" && myPendingCount > 0 && (
                <div className="profileBadge profileBadge--warn">
                  {myPendingCount} of my pledges pending
                </div>
              )}
            </div>
          </div>

          <div
            className={`profileStats ${
              activeRole === "organizer" ? "profileStats--organizer" : ""
            }`}
          >
            {activeRole === "supporter" ? (
              <>
                <div className="profileStat">
                  <div className="profileStat__label">Total pledges (I made)</div>
                  <div className="profileStat__value">
                    {pledgeTotals?.total_pledges ?? myPledges.length ?? "—"}
                  </div>
                </div>

                <div className="profileStat">
                  <div className="profileStat__label">Money pledged</div>
                  <div className="profileStat__value">
                    {pledgeTotals ? formatAUD(pledgeTotals.total_money_pledged) : "—"}
                  </div>
                </div>

                <div className="profileStat">
                  <div className="profileStat__label">Volunteer hours</div>
                  <div className="profileStat__value">
                    {pledgeTotals?.total_time_hours_pledged ?? "—"}
                  </div>
                </div>

                <div className="profileStat">
                  <div className="profileStat__label">Items pledged</div>
                  <div className="profileStat__value">
                    {pledgeTotals?.total_item_quantity_pledged ?? "—"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="profileStat">
                  <div className="profileStat__label">Total pledges (received)</div>
                  <div className="profileStat__value">
                    {incomingTotals?.total_pledges ?? incomingPledges.length ?? "—"}
                  </div>
                </div>

                <div className="profileStat">
                  <div className="profileStat__label">Money pledged to me</div>
                  <div className="profileStat__value">
                    {incomingTotals ? formatAUD(incomingTotals.total_money_pledged) : "—"}
                  </div>
                </div>

                <div className="profileStat">
                  <div className="profileStat__label">Volunteer hours to me</div>
                  <div className="profileStat__value">
                    {incomingTotals?.total_time_hours_pledged ?? "—"}
                  </div>
                </div>

                <div className="profileStat">
                  <div className="profileStat__label">Items pledged to me</div>
                  <div className="profileStat__value">
                    {incomingTotals?.total_item_quantity_pledged ?? "—"}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="profileHeaderDivider" />
        </header>

        {loading && <div className="profilePage__state">Loading…</div>}
        {!loading && error && <div className="profilePage__error">{error}</div>}

        {!loading && !error && (
          <div className="profileGrid">
            {/* SUPPORTER VIEW */}
            {activeRole === "supporter" && (
              <>
                <section className="profileCard">
                  <div className="profileCard__top">
                    <div className="profileCard__topLeft">
                      <h2 className="profileCard__title">Pledges I’ve made</h2>

                      <div className="profileChips">
                        <span className="chip">
                          Total: <strong>{myPledges.length}</strong>
                        </span>
                        {Object.keys(myPledgesByStatus)
                          .slice(0, 3)
                          .map((k) => (
                            <span key={k} className={`chip is-${k}`}>
                              {toTitleCase(k)}: <strong>{myPledgesByStatus[k]}</strong>
                            </span>
                          ))}
                      </div>
                    </div>

                    <Link className="profileCard__link" to="/fundraisers">
                      Browse fundraisers →
                    </Link>
                  </div>

                  {myPledges.length === 0 ? (
                    <div className="profileCard__empty">
                      You haven’t made any pledges yet.
                      <div style={{ marginTop: 10 }}>
                        <Link className="btnTiny" to="/fundraisers">
                          Find a fundraiser to support
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <ul className="profileList">
                      {myPledgesSorted.map((p, idx) => {
                        const pledgeKey = p.id ?? `pledge-${idx}`;
                        const fundraiserId = p.fundraiser_id ?? p.fundraiser ?? null;
                        const isPending = safeLower(p.status) === "pending";

                        return (
                          <li
                            key={pledgeKey}
                            className={`profileRow ${isPending ? "profileRow--pending" : ""}`}
                          >
                            <div className="profileRow__main">
                              {fundraiserId ? (
                                <Link
                                  className="profileRow__title"
                                  to={`/fundraisers/${fundraiserId}`}
                                >
                                  {p.fundraiser_title || "Fundraiser"}
                                </Link>
                              ) : (
                                <span className="profileRow__title">
                                  {p.fundraiser_title || "Fundraiser"}
                                </span>
                              )}

                              <div className="profileRow__meta">
                                Need: <strong>{p.need_title || "—"}</strong>{" "}
                                <span className="muted">({p.need_type || "—"})</span>
                                <span className={`valueBadge is-${pledgeValueKind(p)}`}>
                                  {pledgeValueLabel(p)}
                                </span>
                              </div>

                              {p.reward_tier_name && (
                                <div className="profileRow__meta">
                                  Reward: <strong>{p.reward_tier_name}</strong>
                                </div>
                              )}

                              <div className="profileRow__meta">
                                Status: <strong>{statusLabel(p.status)}</strong>
                              </div>
                            </div>

                            <div className="profileRow__actions">
                              {fundraiserId && (
                                <Link className="btnTiny" to={`/fundraisers/${fundraiserId}`}>
                                  View
                                </Link>
                              )}

                              {safeLower(p.status) === "pending" && (
                                <button
                                  className="btnTiny btnTiny--danger"
                                  onClick={() => handleCancelPledge(p.id)}
                                  type="button"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section className="profileCard">
                  <div className="profileCard__top">
                    <div className="profileCard__topLeft">
                      <h2 className="profileCard__title">Rewards I’ve earned</h2>
                      <div className="muted" style={{ marginTop: 6 }}>
                        Rewards are cumulative per fundraiser. This shows what you’ve unlocked so far.
                      </div>
                    </div>
                  </div>

                  {Object.keys(myRewardsByFundraiser).length === 0 ? (
                    <div className="profileCard__empty">
                      No rewards data yet (or you haven’t pledged to any fundraisers with rewards).
                    </div>
                  ) : (
                    <ul className="profileList">
                      {Object.values(myRewardsByFundraiser).map((r) => {
                        const fid = r?.fundraiser?.id;
                        const title = r?.fundraiser?.title || "Fundraiser";

                        const earnedMoney = Array.isArray(r?.earned_money_reward_tiers)
                          ? r.earned_money_reward_tiers
                          : [];
                        const earnedOther = Array.isArray(r?.earned_other_reward_tiers)
                          ? r.earned_other_reward_tiers
                          : [];

                        return (
                          <li key={fid ?? title} className="profileRow">
                            <div className="profileRow__main">
                              {fid ? (
                                <Link className="profileRow__title" to={`/fundraisers/${fid}`}>
                                  {title}
                                </Link>
                              ) : (
                                <span className="profileRow__title">{title}</span>
                              )}

                              <div className="profileRow__meta">
                                Totals: <strong>{formatAUD(r?.totals?.total_money_pledged)}</strong>{" "}
                                <span className="muted">/</span>{" "}
                                <strong>{r?.totals?.total_time_hours_pledged ?? 0} hrs</strong>{" "}
                                <span className="muted">/</span>{" "}
                                <strong>Qty {r?.totals?.total_item_quantity_pledged ?? 0}</strong>
                              </div>

                              <div className="profileRow__meta">
                                Earned:
                                <div className="rewardPills">
                                  {earnedMoney.length === 0 && earnedOther.length === 0 ? (
                                    <span className="muted" style={{ marginLeft: 8 }}>
                                      None yet
                                    </span>
                                  ) : (
                                    <>
                                      {earnedMoney.map((t) => (
                                        <span
                                          key={`m-${t?.id ?? t?.name}`}
                                          className="rewardPill"
                                        >
                                          {t?.name ?? "Money reward"}
                                        </span>
                                      ))}
                                      {earnedOther.map((t) => (
                                        <span
                                          key={`o-${t?.id ?? t?.name}`}
                                          className="rewardPill"
                                        >
                                          {t?.name ?? "Reward"}
                                        </span>
                                      ))}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="profileRow__actions">
                              {fid && (
                                <Link className="btnTiny" to={`/fundraisers/${fid}`}>
                                  View
                                </Link>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </>
            )}

            {/* ORGANIZER VIEW */}
            {activeRole === "organizer" && (
              <>
                <section className="profileCard">
                  <div className="profileCard__top">
                    <div className="profileCard__topLeft">
                      <h2 className="profileCard__title">Fundraisers I run</h2>

                      <div className="profileChips">
                        <span className="chip">
                          Total: <strong>{myFundraisers.length}</strong>
                        </span>
                        {Object.keys(fundraisersByStatus)
                          .slice(0, 3)
                          .map((k) => (
                            <span key={k} className={`chip is-${k}`}>
                              {toTitleCase(k)}: <strong>{fundraisersByStatus[k]}</strong>
                            </span>
                          ))}
                      </div>
                    </div>

                    <Link className="profileCard__link" to="/fundraisers/new">
                      + New fundraiser
                    </Link>
                  </div>

                  {myFundraisers.length === 0 ? (
                    <div className="profileCard__empty">
                      You haven’t created any fundraisers yet.
                      <div style={{ marginTop: 10 }}>
                        <Link className="btnTiny" to="/fundraisers/new">
                          Create your first fundraiser
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <ul className="profileList">
                      {myFundraisers.map((f, idx) => {
                        const fundraiserId = getFundraiserId(f);
                        const key = fundraiserId ?? `fundraiser-${idx}`;

                        return (
                          <li key={key} className="profileRow">
                            <div className="profileRow__main">
                              {fundraiserId ? (
                                <Link
                                  className="profileRow__title"
                                  to={`/fundraisers/${fundraiserId}`}
                                >
                                  {f.title || f.name || `Fundraiser #${fundraiserId}`}
                                </Link>
                              ) : (
                                <span className="profileRow__title">
                                  {f.title || f.name || "Fundraiser"}
                                </span>
                              )}

                              <div className="profileRow__meta">
                                Status: <strong>{statusLabel(f.status || f.lifecycle)}</strong>
                              </div>
                            </div>

                            <div className="profileRow__actions">
                              {fundraiserId ? (
                                <>
                                  <Link className="btnTiny" to={`/fundraisers/${fundraiserId}`}>
                                    View
                                  </Link>
                                  <Link
                                    className="btnTiny"
                                    to={`/fundraisers/${fundraiserId}/edit`}
                                  >
                                    Edit
                                  </Link>
                                </>
                              ) : (
                                <span className="muted">Missing ID</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section className="profileCard">
                  <div className="profileCard__top">
                    <div className="profileCard__topLeft">
                      <h2 className="profileCard__title">
                        Incoming pledges (to my fundraisers)
                      </h2>

                      <div className="profileChips">
                        <span className="chip">
                          Total: <strong>{incomingPledges.length}</strong>
                        </span>
                        {Object.keys(incomingByStatus)
                          .slice(0, 3)
                          .map((k) => (
                            <span key={k} className={`chip is-${k}`}>
                              {toTitleCase(k)}: <strong>{incomingByStatus[k]}</strong>
                            </span>
                          ))}
                      </div>
                    </div>

                    <Link className="profileCard__link" to="/fundraisers">
                      View all fundraisers →
                    </Link>
                  </div>

                  {incomingPledges.length === 0 ? (
                    <div className="profileCard__empty">
                      No one has pledged to your fundraisers yet.
                    </div>
                  ) : (
                    <ul className="profileList">
                      {incomingSorted.map((p, idx) => {
                        const pledgeKey = p.id ?? `incoming-${idx}`;
                        const fundraiserId = p.fundraiser_id ?? p.fundraiser ?? null;
                        const isPending = safeLower(p.status) === "pending";

                        const supporterName = p.anonymous
                          ? "Anonymous"
                          : p.supporter_username || "Supporter";

                        return (
                          <li
                            key={pledgeKey}
                            className={`profileRow ${isPending ? "profileRow--pending" : ""}`}
                          >
                            <div className="profileRow__main">
                              {fundraiserId ? (
                                <Link
                                  className="profileRow__title"
                                  to={`/fundraisers/${fundraiserId}`}
                                >
                                  {p.fundraiser_title || "Fundraiser"}
                                </Link>
                              ) : (
                                <span className="profileRow__title">
                                  {p.fundraiser_title || "Fundraiser"}
                                </span>
                              )}

                              <div className="profileRow__meta">
                                Supporter: <strong>{supporterName}</strong>
                              </div>

                              <div className="profileRow__meta">
                                Need: <strong>{p.need_title || "—"}</strong>{" "}
                                <span className="muted">({p.need_type || "—"})</span>
                                <span className={`valueBadge is-${pledgeValueKind(p)}`}>
                                  {pledgeValueLabel(p)}
                                </span>
                              </div>

                              {p.reward_tier_name && (
                                <div className="profileRow__meta">
                                  Reward: <strong>{p.reward_tier_name}</strong>
                                </div>
                              )}

                              <div className="profileRow__meta">
                                Status: <strong>{statusLabel(p.status)}</strong>
                              </div>
                            </div>

                            <div className="profileRow__actions">
                              {fundraiserId && (
                                <Link className="btnTiny" to={`/fundraisers/${fundraiserId}`}>
                                  View
                                </Link>
                              )}

                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    className="btnTiny btnTiny--approve"
                                    onClick={() => handleApproveIncoming(p.id)}
                                  >
                                    Approve
                                  </button>

                                  <button
                                    type="button"
                                    className="btnTiny btnTiny--danger"
                                    onClick={() => handleDeclineIncoming(p.id)}
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
