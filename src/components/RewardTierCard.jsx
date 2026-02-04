import { useEffect, useMemo, useState } from "react";
import RewardTypeDropdown from "./RewardTypeDropdown";
import "./RewardTierCard.css";

function fmtMoney(val) {
  if (val === null || val === undefined || val === "") return "";
  const n = Number(val);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function normalizeTier(t) {
  return {
    id: t?.id,
    fundraiser: t?.fundraiser,
    reward_type: t?.reward_type ?? "money",
    name: t?.name ?? "",
    description: t?.description ?? "",
    minimum_contribution_value: t?.minimum_contribution_value ?? "",
    image_url: t?.image_url ?? "",
    max_backers: t?.max_backers ?? "",
  };
}

function typeMeta(type) {
  if (type === "money") return { label: "Money", icon: "$", cls: "is-money" };
  if (type === "time") return { label: "Time", icon: "⏱", cls: "is-time" };
  return { label: "Item", icon: "📦", cls: "is-item" };
}

export default function RewardTierCard({ tier, disabled = false, onDelete, onUpdate }) {
  const base = useMemo(() => normalizeTier(tier), [tier]);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(base);
  const [isSaving, setIsSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (isEditing) return;

    const next = normalizeTier(tier);
    const changed =
      next.id !== draft.id ||
      next.name !== draft.name ||
      next.description !== draft.description ||
      next.reward_type !== draft.reward_type ||
      String(next.minimum_contribution_value ?? "") !==
        String(draft.minimum_contribution_value ?? "") ||
      String(next.max_backers ?? "") !== String(draft.max_backers ?? "") ||
      next.image_url !== draft.image_url;

    if (changed) setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, isEditing]);

  const meta = typeMeta(base.reward_type);

  const showPrice =
    base.reward_type === "money" && String(base.minimum_contribution_value ?? "") !== "";
  const showQty = String(base.max_backers ?? "") !== "" && base.max_backers !== null;

  const startEdit = () => {
    setErr(null);
    setDraft(base);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setErr(null);
    setDraft(base);
    setIsEditing(false);
  };

  const save = async () => {
    setErr(null);

    if (!draft.name.trim()) {
      setErr("Name is required.");
      return;
    }

    const payload = {
      fundraiser: draft.fundraiser,
      reward_type: draft.reward_type,
      name: draft.name.trim(),
      description: draft.description ?? "",
      image_url: draft.image_url ?? "",
      max_backers: draft.max_backers === "" ? null : Number(draft.max_backers),
      minimum_contribution_value:
        draft.reward_type === "money" && draft.minimum_contribution_value !== ""
          ? Number(draft.minimum_contribution_value)
          : null,
    };

    setIsSaving(true);
    try {
      await onUpdate?.(draft.id, payload);
      setIsEditing(false);
    } catch (e) {
      setErr(e?.message ?? "Could not save reward tier.");
    } finally {
      setIsSaving(false);
    }
  };

  const doDelete = async () => {
    if (!confirm("Delete this reward tier?")) return;
    setErr(null);
    try {
      await onDelete?.(base.id);
    } catch (e) {
      setErr(e?.message ?? "Could not delete reward tier.");
    }
  };

  return (
    <article className={`rtCard ${meta.cls}`}>
      <div className="rtCard__media">
        {base.image_url ? (
          <img className="rtCard__img" src={base.image_url} alt={base.name || "Reward"} />
        ) : (
          <div className="rtCard__img rtCard__img--empty" aria-hidden="true" />
        )}

        <span className={`rtTypeChip ${meta.cls}`}>
          <span className="rtTypeChip__icon" aria-hidden="true">
            {meta.icon}
          </span>
          <span className="rtTypeChip__text">{meta.label}</span>
        </span>
      </div>

      <div className="rtCard__body">
        <div className="rtCard__header">
          <div className="rtCard__topRow">
            <h5 className="rtCard__name">{base.name}</h5>

            {showPrice && (
              <div className="rtCard__price">
                <span className="rtCard__from">FROM</span>
                <span className="rtCard__money">${fmtMoney(base.minimum_contribution_value)}</span>
              </div>
            )}
          </div>

          {base.description ? <p className="rtCard__desc">{base.description}</p> : null}

          <div className="rtCard__actions">
            <button
              type="button"
              className="rtBtn rtBtn--ghost"
              onClick={startEdit}
              disabled={disabled}
            >
              Edit
            </button>
            <button
              type="button"
              className="rtBtn rtBtn--danger"
              onClick={doDelete}
              disabled={disabled}
            >
              Delete
            </button>
          </div>
        </div>

        {showQty ? (
          <div className="rtCard__meta">
            <span className="rtCard__metaLabel">Quantity</span>
            <span className="rtCard__metaValue">{base.max_backers}</span>
          </div>
        ) : null}

        {isEditing && (
          <div className="rtEditor">
            <div className="rtEditor__head">
              <span className="rtEditor__title">Edit reward</span>
            </div>

            {err ? <div className="rtEditor__error">{err}</div> : null}

            <div className="rtForm">
              <div className="rtForm__field">
                <div className="rtForm__label">Type</div>
                <RewardTypeDropdown
                  value={draft.reward_type}
                  onChange={(val) => setDraft((d) => ({ ...d, reward_type: val }))}
                  disabled={disabled || isSaving}
                />
              </div>

              <div className="rtForm__field">
                <div className="rtForm__label rtForm__label--small">
                  Quantity available (optional)
                </div>
                <input
                  className="rtInput rtInput--sm"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 10"
                  value={draft.max_backers ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, max_backers: e.target.value }))}
                  disabled={disabled || isSaving}
                />
              </div>

              <div className="rtForm__field">
                <div className="rtForm__label">Name</div>
                <input
                  className="rtInput rtInput--sm"
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  disabled={disabled || isSaving}
                />
              </div>

              <div className="rtForm__field">
                <div className="rtForm__label">Description</div>
                <textarea
                  className="rtTextarea rtTextarea--sm"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  disabled={disabled || isSaving}
                />
              </div>

              <div className="rtForm__field">
                <div className="rtForm__label">Image URL</div>
                <input
                  className="rtInput rtInput--sm"
                  type="text"
                  value={draft.image_url}
                  onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))}
                  disabled={disabled || isSaving}
                />
              </div>

              {draft.reward_type === "money" && (
                <div className="rtForm__field">
                  <div className="rtForm__label rtForm__label--nowrap">Minimum contribution</div>
                  <input
                    className="rtInput rtInput--sm"
                    type="number"
                    min="0"
                    step="1"
                    value={draft.minimum_contribution_value ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, minimum_contribution_value: e.target.value }))
                    }
                    disabled={disabled || isSaving}
                  />
                </div>
              )}

              <div className="rtEditor__footerBtns">
                <button
                  type="button"
                  className="rtBtn rtBtn--primary"
                  onClick={save}
                  disabled={disabled || isSaving}
                >
                  {isSaving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  className="rtBtn"
                  onClick={cancelEdit}
                  disabled={disabled || isSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
