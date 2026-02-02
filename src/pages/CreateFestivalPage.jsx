import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import FundraiserForm from "../components/FundraiserForm";
import postFundraiser from "../api/post-fundraiser";
import { applyTemplate } from "../api/apply-template";
import getFundraiserTemplates from "../api/get-fundraiser-templates";

import "./CreateFestivalPage.css";

function CreateFestivalPage() {
  const navigate = useNavigate();

  // Page-level UI state
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Template loading state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState(null);

  // Which template previews are open
  const [openPreviews, setOpenPreviews] = useState(() => new Set());

  const tokenExists = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    async function fetchTemplates() {
      setTemplatesLoading(true);
      setTemplatesError(null);

      try {
        const data = await getFundraiserTemplates();
        setTemplates(data);
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
      // Create placeholder fundraiser (dates intentionally blank)
      const placeholderFundraiser = await postFundraiser(
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

      const applied = await applyTemplate(placeholderFundraiser.id, template.id);
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

  function groupBy(items, key) {
    return (items || []).reduce((acc, item) => {
      const k = item?.[key] ?? "other";
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {});
  }

  function renderRewardsPreview(templateRewardTiers) {
    const grouped = groupBy(templateRewardTiers, "reward_type");
    const order = ["money", "time", "item"];

    return (
      <div className="cf-previewGrid">
        {order.map((type) => {
          const list = grouped[type] || [];
          if (list.length === 0) return null;

          const heading =
            type === "money" ? "Money rewards" : type === "time" ? "Time rewards" : "Item rewards";

          return (
            <section key={type} className="cf-previewSection">
              <h4 className="cf-previewTitle">{heading}</h4>

              <ul className="cf-previewList">
                {list.map((r) => (
                  <li key={r.id} className="cf-previewItem">
                    <span className="cf-previewItemName">{r.name || "Reward tier"}</span>

                    {r.minimum_contribution_value ? (
                      <span className="cf-previewItemMeta">
                        {" "}
                        — min ${r.minimum_contribution_value}
                      </span>
                    ) : null}

                    {r.description ? (
                      <span className="cf-previewItemMeta"> — {r.description}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    );
  }

  function renderNeedsPreview(templateNeeds) {
    const grouped = groupBy(templateNeeds, "need_type");
    const order = ["money", "time", "item"];

    return (
      <div className="cf-previewGrid">
        {order.map((type) => {
          const list = grouped[type] || [];
          if (list.length === 0) return null;

          const heading =
            type === "money" ? "Money needs" : type === "time" ? "Time needs" : "Item needs";

          return (
            <section key={type} className="cf-previewSection">
              <h4 className="cf-previewTitle">{heading}</h4>

              <ul className="cf-previewList">
                {list.map((n) => (
                  <li key={n.id} className="cf-previewNeed">
                    <div className="cf-previewNeedTop">
                      <span className="cf-previewNeedName">{n.title || "Need"}</span>
                      {n.priority ? <span className="cf-pill">{n.priority}</span> : null}
                    </div>

                    {n.description ? (
                      <div className="cf-previewNeedDesc">{n.description}</div>
                    ) : null}

                    <div className="cf-previewNeedMeta">
                      {type === "money" && n.target_amount ? (
                        <span>Target: ${n.target_amount}</span>
                      ) : null}

                      {type === "time" ? (
                        <span>
                          {n.role_title ? `Role: ${n.role_title}` : "Role: —"}
                          {n.volunteers_needed ? ` • Volunteers: ${n.volunteers_needed}` : ""}
                        </span>
                      ) : null}

                      {type === "item" ? (
                        <span>
                          {n.item_name ? `Item: ${n.item_name}` : "Item: —"}
                          {n.quantity_needed ? ` • Qty: ${n.quantity_needed}` : ""}
                          {n.mode ? ` • Mode: ${n.mode}` : ""}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="cf-page">
      <header className="cf-header">
        <h1 className="cf-title">Create a Festival</h1>
        <p className="cf-subtitle">
          Start from scratch or pick a template and tweak it before you publish.
        </p>

        {!tokenExists && (
          <div className="cf-banner cf-banner--warn">
            You need to log in before creating a fundraiser.
          </div>
        )}

        {error && <div className="cf-banner cf-banner--error">{error}</div>}
      </header>

      <section className="cf-section">
        <div className="cf-sectionHeader">
          <h2 className="cf-h2">Start blank</h2>
          <p className="cf-help">
            Draft first, then set status to <strong>Active</strong> when you’re ready to accept pledges.
          </p>
        </div>

        <div className="cf-card">
          <FundraiserForm onSubmit={handleCreateBlank} isSaving={isSaving} />
        </div>
      </section>

      <section className="cf-section">
        <div className="cf-sectionHeader">
          <h2 className="cf-h2">Or use a template</h2>
          <p className="cf-help">Preview what you’ll get (needs + rewards), then click “Use this template”.</p>
        </div>

        {templatesLoading && <p className="cf-muted">Loading templates…</p>}
        {templatesError && <p className="cf-errorText">{templatesError.message}</p>}

        {!templatesLoading && !templatesError && (
          <div className="cf-templateGrid">
            {templates.map((t) => {
              const previewOpen = openPreviews.has(t.id);

              const templateImg = t.image_url || "https://picsum.photos/900/500?blur=1";
              const needsCount = t.template_needs?.length ?? 0;
              const rewardsCount = t.template_reward_tiers?.length ?? 0;

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

                  {previewOpen && (
                    <div className="cf-previewPanel">
                      <div className="cf-previewBlock">
                        <h4 className="cf-previewBlockTitle">Rewards</h4>
                        {t.enable_rewards ? (
                          rewardsCount > 0 ? (
                            renderRewardsPreview(t.template_reward_tiers)
                          ) : (
                            <p className="cf-muted">No reward tiers in this template.</p>
                          )
                        ) : (
                          <p className="cf-muted">Rewards are turned off for this template.</p>
                        )}
                      </div>

                      <div className="cf-previewBlock">
                        <h4 className="cf-previewBlockTitle">Needs</h4>
                        {needsCount > 0 ? (
                          renderNeedsPreview(t.template_needs)
                        ) : (
                          <p className="cf-muted">No needs in this template.</p>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default CreateFestivalPage;
