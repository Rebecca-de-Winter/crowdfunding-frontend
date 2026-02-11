// src/components/FundraiserLayout.jsx
import RewardTierList from "./RewardTierList";
import "../pages/FundraiserPage.css";
import "./FundraiserLayout.css"; 

function safeLower(v) {
  return String(v ?? "").toLowerCase();
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

function groupBy(items, key) {
  return (items || []).reduce((acc, item) => {
    const k = item?.[key] ?? "other";
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export default function FundraiserLayout({ template }) {
  // template = your template object "t" from CreateFestivalPage
  const title = template?.title || template?.name || "Template preview";
  const description = template?.description || "";
  const goal = Number(template?.goal ?? 0) || 0;
  const image_url = template?.image_url || "";
  const location = template?.location || "—";
  const enable_rewards = Boolean(template?.enable_rewards);

  const heroImg = resolveImageUrl(image_url) || "https://picsum.photos/1200/700?blur=1";

  const needs = template?.template_needs ?? [];
  const reward_tiers = template?.template_reward_tiers ?? [];

  const groupedNeeds = groupBy(needs, "need_type");

  return (
    <div className="fundraiser fundraiser--preview">
      {/* TOP GRID (Hero + Goal) */}
      <div className="fundraiser__topGrid">
        <div className="fundraiser__hero">
          <img className="fundraiser__heroImg" src={heroImg} alt={title} />
        </div>

        <div className="fundraiser__sidebarTop">
          <div className="panel goalPanel">
            <div className="goalPanel__head">
              <div className="goalPanel__label">Goal (AUD)</div>
              <div className="goalPanel__value">
                {Number.isFinite(goal) ? goal.toFixed(2) : "0.00"}
              </div>
            </div>

            <div className="goalPanel__divider" />

            <div className="goalPanel__progress">
              <p className="muted">Template preview (totals appear after you create the fundraiser).</p>
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
              <div className="metaGrid__value">{location}</div>

              <div className="metaGrid__label">Backyard Dates</div>
              <div className="metaGrid__value">TBA</div>

              <div className="metaGrid__label">Fundraiser status</div>
              <div className="metaGrid__value">
                <span className="statusPill statusPill--lifecycle">
                  <span className="statusDot statusDot--lifecycle is-template" aria-hidden="true" />
                  <span className="statusPill__text">Template preview</span>
                </span>
              </div>

              <div className="metaGrid__label">Accepting pledges</div>
              <div className="metaGrid__value">
                <strong>—</strong>
              </div>
            </div>
          </div>

          <div className="panel storyPanel">
            <h2 className="panel__title">Story / Description</h2>
            <p className="fundraiser__desc">{description || "—"}</p>
          </div>

          <section className="fundraiser__section">
            <div className="panel needsPanel">
              <div className="needsPanel__head">
                <div>
                  <h2 className="panel__title" style={{ marginBottom: 6 }}>
                    What this fundraiser needs
                  </h2>
                  <p className="needsPanel__note muted">
                    Template preview (no pledging yet).
                  </p>
                </div>
              </div>

              <div className="needsPanel__groups">
                {/* Money */}
                <div className="needAcc">
                  <div className="needAcc__head" aria-expanded="true">
                    <span className="needAcc__left">
                      <span className="needAcc__chev">▾</span>
                      <span className="needAcc__title">Money needs</span>
                      <span className="needAcc__count">{(groupedNeeds.money || []).length}</span>
                    </span>
                  </div>

                  <div className="needAcc__body">
                    {(groupedNeeds.money || []).length === 0 ? (
                      <div className="needsEmpty">No money needs in this template.</div>
                    ) : (
                      <div className="needsList">
                        {(groupedNeeds.money || []).map((n) => (
                          <div key={n.id} className="needRow">
                            <div>
                              <div className="needRow__title">{n.title || "Money need"}</div>
                              {n.description ? <div className="needRow__desc">{n.description}</div> : null}
                              {n.target_amount ? (
                                <div className="needRow__desc">
                                  <strong>Target:</strong> ${n.target_amount}
                                </div>
                              ) : null}

                              <div className="needRow__meta">
                                {n.priority ? (
                                  <span className={`needPill needPill--priority is-${safeLower(n.priority)}`}>
                                    Priority: {n.priority}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Time */}
                <div className="needAcc">
                  <div className="needAcc__head" aria-expanded="true">
                    <span className="needAcc__left">
                      <span className="needAcc__chev">▾</span>
                      <span className="needAcc__title">Time needs</span>
                      <span className="needAcc__count">{(groupedNeeds.time || []).length}</span>
                    </span>
                  </div>

                  <div className="needAcc__body">
                    {(groupedNeeds.time || []).length === 0 ? (
                      <div className="needsEmpty">No time needs in this template.</div>
                    ) : (
                      <div className="needsList">
                        {(groupedNeeds.time || []).map((n) => (
                          <div key={n.id} className="needRow">
                            <div>
                              <div className="needRow__title">{n.title || "Time need"}</div>
                              {n.description ? <div className="needRow__desc">{n.description}</div> : null}

                              <div className="needRow__desc muted">
                                {n.role_title ? `Role: ${n.role_title}` : "Role: —"}
                                {n.volunteers_needed ? ` • Volunteers: ${n.volunteers_needed}` : ""}
                              </div>

                              <div className="needRow__meta">
                                {n.priority ? (
                                  <span className={`needPill needPill--priority is-${safeLower(n.priority)}`}>
                                    Priority: {n.priority}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Item */}
                <div className="needAcc">
                  <div className="needAcc__head" aria-expanded="true">
                    <span className="needAcc__left">
                      <span className="needAcc__chev">▾</span>
                      <span className="needAcc__title">Item needs</span>
                      <span className="needAcc__count">{(groupedNeeds.item || []).length}</span>
                    </span>
                  </div>

                  <div className="needAcc__body">
                    {(groupedNeeds.item || []).length === 0 ? (
                      <div className="needsEmpty">No item needs in this template.</div>
                    ) : (
                      <div className="needsList">
                        {(groupedNeeds.item || []).map((n) => (
                          <div key={n.id} className="needRow">
                            <div>
                              <div className="needRow__title">{n.title || "Item need"}</div>
                              {n.description ? <div className="needRow__desc">{n.description}</div> : null}

                              <div className="needRow__desc muted">
                                {n.item_name ? `Item: ${n.item_name}` : "Item: —"}
                                {n.quantity_needed ? ` • Qty: ${n.quantity_needed}` : ""}
                                {n.mode ? ` • Mode: ${n.mode}` : ""}
                              </div>

                              <div className="needRow__meta">
                                {n.priority ? (
                                  <span className={`needPill needPill--priority is-${safeLower(n.priority)}`}>
                                    Priority: {n.priority}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <aside className="fundraiser__rightCol">
          <div className="panel rewardsPanel">
            <h3 className="panel__title">Rewards</h3>

            {!enable_rewards ? (
              <p className="muted">Rewards are turned off for this template.</p>
            ) : reward_tiers.length > 0 ? (
              // We can reuse your existing RewardTierList if it expects tiers props:
              <RewardTierList
                tiers={reward_tiers}
                disabled={true}
                onDeleteTier={null}
                onUpdateTier={null}
              />
            ) : (
              <p className="muted">No reward tiers in this template.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
