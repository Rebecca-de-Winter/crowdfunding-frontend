// src/pages/CreateFestivalPage.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import FundraiserForm from "../components/FundraiserForm";
import RewardTierList from "../components/RewardTierList";

import postFundraiser from "../api/post-fundraiser";
import { applyTemplate } from "../api/apply-template";
import getFundraiserTemplates from "../api/get-fundraiser-templates";

import "./CreateFestivalPage.css";

/* -------------------------
   Tiny helpers
------------------------- */

function safeLower(v) {
  return String(v ?? "").toLowerCase();
}

function groupBy(items, key) {
  return (items || []).reduce((acc, item) => {
    const k = item?.[key] ?? "other";
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

function normaliseMode(raw) {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("donat")) return "Donation";
  if (s.includes("loan")) return "Loan";
  if (s.includes("either")) return "Either";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : null;
}

/* -------------------------
   Preview components (read-only)
   Uses the SAME classes as FundraiserPage Needs/Rewards,
   but is scoped via .cf-previewPanel .fundraiser--preview in CSS.
------------------------- */

function TemplateNeedsPreview({ templateNeeds = [] }) {
  const grouped = useMemo(() => groupBy(templateNeeds, "need_type"), [templateNeeds]);

  const moneyNeeds = grouped.money || [];
  const timeNeeds = grouped.time || [];
  const itemNeeds = grouped.item || [];

  const [openGroups, setOpenGroups] = useState({
    money: true,
    time: true,
    item: true,
  });

  const toggle = (key) => setOpenGroups((p) => ({ ...p, [key]: !p[key] }));

  const VolBadge = ({ n }) =>
    n?.volunteers_needed ? (
      <span className="needMiniBadge">Vol × {n.volunteers_needed}</span>
    ) : null;

  const QtyBadge = ({ n }) =>
    n?.quantity_needed ? (
      <span className="needMiniBadge">Qty × {n.quantity_needed}</span>
    ) : null;

  const TargetBadge = ({ n }) =>
    n?.target_amount != null && n?.target_amount !== "" ? (
      <span className="needMiniBadge">${n.target_amount}</span>
    ) : null;

  return (
    <div className="panel needsPanel">
      <div className="needsPanel__head">
        <div>
          <h3 className="panel__title" style={{ marginBottom: 6 }}>
            What this fundraiser needs
          </h3>
          <p className="needsPanel__note muted">Template preview (no pledging yet).</p>
        </div>
      </div>

      <div className="needsPanel__groups">
        {/* Money */}
        <div className="needAcc">
          <button
            type="button"
            className="needAcc__head"
            onClick={() => toggle("money")}
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
                <div className="needsEmpty">No money needs in this template.</div>
              ) : (
                <div className="needsList">
                  {moneyNeeds.map((n) => (
                    <div key={n.id ?? `${n.title}-money`} className="needRow">
                      <div className="needRow__left">
                        <div className="needRow__title">
                          {n.title || "Money need"} <TargetBadge n={n} />
                        </div>

                        {n.description ? <div className="needRow__desc">{n.description}</div> : null}

                        <div className="needRow__desc needRow__desc--secondary">
                          <strong>Target:</strong>{" "}
                          {n.target_amount != null && n.target_amount !== "" ? `$${n.target_amount}` : "—"}
                        </div>

                        <div className="needRow__meta">
                          {/* status hidden in preview via CSS */}
                          <span className={`needPill needPill--status is-${safeLower(n.status)}`}>
                            Status: {n.status ?? "—"}
                          </span>
                          <span className={`needPill needPill--priority is-${safeLower(n.priority)}`}>
                            Priority: {n.priority ?? "—"}
                          </span>
                        </div>
                      </div>

                      <div className="needRow__actions">
                        <button className="btn btn--small" type="button" disabled>
                          Pledge money
                        </button>
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
            onClick={() => toggle("time")}
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
                <div className="needsEmpty">No time needs in this template.</div>
              ) : (
                <div className="needsList">
                  {timeNeeds.map((n) => (
                    <div key={n.id ?? `${n.title}-time`} className="needRow">
                      <div className="needRow__left">
                        <div className="needRow__title">
                          {n.title || "Time need"} <VolBadge n={n} />
                        </div>

                        {/* Primary line: Role */}
                        <div className="needRow__desc">
                          <strong>Role:</strong> {n.role_title || "—"}
                        </div>

                        {/* Secondary line: Location (on its own line, bright) */}
                        {n.location ? (
                          <div className="needRow__desc needRow__desc--secondary">
                            <strong>Location:</strong> {n.location}
                          </div>
                        ) : null}

                        {n.description ? <div className="needRow__desc">{n.description}</div> : null}

                        <div className="needRow__meta">
                          {/* status hidden in preview via CSS */}
                          <span className={`needPill needPill--status is-${safeLower(n.status)}`}>
                            Status: {n.status ?? "—"}
                          </span>
                          <span className={`needPill needPill--priority is-${safeLower(n.priority)}`}>
                            Priority: {n.priority ?? "—"}
                          </span>
                        </div>
                      </div>

                      <div className="needRow__actions">
                        <button className="btn btn--small" type="button" disabled>
                          Volunteer time
                        </button>
                      </div>
                    </div>
                  ))}
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
            onClick={() => toggle("item")}
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
                <div className="needsEmpty">No item needs in this template.</div>
              ) : (
                <div className="needsList">
                  {itemNeeds.map((n) => {
                    const modeLabel = normaliseMode(n.mode);

                    return (
                      <div key={n.id ?? `${n.title}-item`} className="needRow">
                        <div className="needRow__left">
                          <div className="needRow__title">
                            {n.title || "Item need"} <QtyBadge n={n} />
                          </div>

                          {n.description ? <div className="needRow__desc">{n.description}</div> : null}

                          {/* Clean info (no duplicate “Type” pill) */}
                          <div className="needRow__desc needRow__desc--secondary">
                            <strong>Item:</strong> {n.item_name || "—"}
                            {n.quantity_needed ? ` • Qty: ${n.quantity_needed}` : ""}
                            {modeLabel ? ` • Mode: ${modeLabel}` : ""}
                          </div>

                          <div className="needRow__meta">
                            {/* status hidden in preview via CSS */}
                            <span className={`needPill needPill--status is-${safeLower(n.status)}`}>
                              Status: {n.status ?? "—"}
                            </span>
                            <span className={`needPill needPill--priority is-${safeLower(n.priority)}`}>
                              Priority: {n.priority ?? "—"}
                            </span>
                          </div>
                        </div>

                        <div className="needRow__actions">
                          <button className="btn btn--small" type="button" disabled>
                            Pledge item
                          </button>
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
  );
}

function TemplateRewardsPreview({ enableRewards, tiers = [] }) {
  return (
    <div className="panel rewardsPanel">
      <h3 className="panel__title">Rewards</h3>

      {!enableRewards ? (
        <p className="muted">Rewards are turned off for this template.</p>
      ) : tiers.length > 0 ? (
        <RewardTierList tiers={tiers} disabled={true} onDeleteTier={null} onUpdateTier={null} />
      ) : (
        <p className="muted">No reward tiers in this template.</p>
      )}
    </div>
  );
}

/* -------------------------
   Page
------------------------- */

export default function CreateFestivalPage() {
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState(null);

  const [openPreviews, setOpenPreviews] = useState(() => new Set());

  const tokenExists = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    async function fetchTemplates() {
      setTemplatesLoading(true);
      setTemplatesError(null);

      try {
        const data = await getFundraiserTemplates();
        setTemplates(data || []);
      } catch (e) {
        setTemplatesError(e);
      } finally {
        setTemplatesLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  async function handleCreateBlank(
    title,
    description,
    goal,
    image_url,
    location,
    start_date,
    end_date,
    status,
    enable_rewards,
    sort_order
  ) {
    setError(null);
    setIsSaving(true);

    try {
      const created = await postFundraiser(
        title,
        description,
        goal,
        image_url,
        location,
        start_date,
        end_date,
        status,
        enable_rewards,
        sort_order
      );

      navigate(`/fundraisers/${created.id}/edit`);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUseTemplate(template) {
    setError(null);
    setIsSaving(true);

    try {
      const placeholder = await postFundraiser(
        template.title || "Untitled festival",
        template.description || "Created from template",
        Number(template.goal ?? 0),
        template.image_url || "",
        template.location || "",
        null,
        null,
        "draft",
        Boolean(template.enable_rewards),
        0
      );

      const applied = await applyTemplate(placeholder.id, template.id);
      navigate(`/fundraisers/${applied.id}/edit`);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  }

  function togglePreview(templateId) {
    setOpenPreviews((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return next;
    });
  }

  return (
    <div className="cf-page">
      <header className="cf-header">
        <h1 className="cf-title">Create a Festival</h1>
        <p className="cf-subtitle">
          Start from scratch or pick a template and tweak it before you publish.
        </p>

        {!tokenExists && (
          <div className="cf-banner cf-banner--warn">You need to log in before creating a fundraiser.</div>
        )}

        {error && <div className="cf-banner cf-banner--error">{error}</div>}
      </header>

      <section className="cf-section">
        <div className="cf-sectionHeader">
          <h2 className="cf-h2">Start blank</h2>
          <p className="cf-help">
            Create your festival as a Draft first, then set status to <strong>Active</strong> from the edit screen
            when you’re ready to accept pledges.
          </p>
        </div>

        <div className="cf-card">
          <FundraiserForm onSubmit={handleCreateBlank} isSaving={isSaving} hideAdminFields />
        </div>
      </section>

      <section className="cf-section">
        <div className="cf-sectionHeader">
          <h2 className="cf-h2">...Or use a template</h2>
          <p className="cf-help">Preview what you’ll get (needs + rewards), then click “Use this template”.</p>
        </div>

        {templatesLoading && <p className="cf-muted">Loading templates…</p>}
        {templatesError && <p className="cf-errorText">{templatesError.message}</p>}

        {!templatesLoading && !templatesError && (
          <div className="cf-templateGrid">
            {templates.map((t) => {
              const previewOpen = openPreviews.has(t.id);

              const templateImg = t.image_url || "https://picsum.photos/900/500?blur=1";
              const needs = t.template_needs || [];
              const tiers = t.template_reward_tiers || [];

              const needsCount = needs.length;
              const rewardsCount = tiers.length;

              return (
                <article key={t.id} className={`cf-templateCard ${isSaving ? "is-saving" : ""}`}>
                  <div className="cf-templateTop">
                    <img className="cf-templateImg" src={templateImg} alt={t.name} />

                    <div className="cf-templateInfo">
                      <div className="cf-templateHeaderRow">
                        <h3 className="cf-templateName">{t.name}</h3>
                        <span className="cf-templateCategory">{t.category || "—"}</span>
                      </div>

                      <p className="cf-templateLine">
                        <span className="cf-strong">Suggested title:</span> {t.title}
                      </p>

                      {t.description ? <p className="cf-templateDesc">{t.description}</p> : null}

                      <div className="cf-templateMetaRow">
                        <span>
                          <span className="cf-strong">Goal:</span> {t.goal ?? "—"}
                        </span>
                        <span>
                          <span className="cf-strong">Rewards:</span> {t.enable_rewards ? "On" : "Off"}
                        </span>
                        <span>
                          <span className="cf-strong">Includes:</span> {needsCount} needs • {rewardsCount} rewards
                        </span>
                      </div>

                      <div className="cf-templateActions">
                        <button
                          type="button"
                          className="cf-btn cf-btn--ghost"
                          onClick={() => togglePreview(t.id)}
                          disabled={isSaving}
                        >
                          {previewOpen ? "Hide preview" : "Preview contents"}
                        </button>

                        <button
                          type="button"
                          className="cf-btn"
                          disabled={isSaving || !tokenExists}
                          onClick={() => handleUseTemplate(t)}
                        >
                          {isSaving ? "Applying…" : "Use this template"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {previewOpen ? (
                    <div className="cf-previewPanel">
                      <div className="fundraiser fundraiser--preview">
                        {/* TOP (Hero + Goal) */}
                        <div className="fundraiser__topGrid">
                          <div className="fundraiser__hero">
                            <img
                              className="fundraiser__heroImg"
                              src={templateImg}
                              alt={t.title || t.name || "Template preview"}
                            />
                          </div>

                          <div className="fundraiser__sidebarTop">
                            <div className="panel goalPanel">
                              <div className="goalPanel__head">
                                <div className="goalPanel__label">Goal (AUD)</div>
                                <div className="goalPanel__value">{t.goal ?? "—"}</div>
                              </div>

                              <div className="goalPanel__divider" />

                              <p className="muted" style={{ margin: 0 }}>
                                Template preview (totals appear after you create the fundraiser).
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* BELOW (Title/Meta + Needs | Rewards) */}
                        <div className="fundraiser__belowGrid">
                          <div className="fundraiser__leftCol">
                            <div className="panel headerMetaPanel">
                              <h2 className="fundraiser__title" style={{ marginTop: 0 }}>
                                {t.title || "Untitled festival"}
                              </h2>

                              {/* Keep meta minimal */}
                              <div className="metaGrid">
                                <div className="metaGrid__label">Location</div>
                                <div className="metaGrid__value">{t.location || "—"}</div>

                                <div className="metaGrid__label">Backyard Dates</div>
                                <div className="metaGrid__value">TBA</div>
                              </div>
                            </div>

                            <div className="panel storyPanel">
                              <h3 className="panel__title">Story / Description</h3>
                              <p className="fundraiser__desc">{t.description || "—"}</p>
                            </div>

                            <TemplateNeedsPreview templateNeeds={needs} />
                          </div>

                          <aside className="fundraiser__rightCol">
                            <TemplateRewardsPreview enableRewards={Boolean(t.enable_rewards)} tiers={tiers} />
                          </aside>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
