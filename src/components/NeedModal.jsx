import { useEffect, useMemo, useState } from "react";
import "./NeedsSection.css";

const STATUS = ["open", "closed"];
const PRIORITY = ["low", "medium", "high"];
const ITEM_MODE = ["loan", "donation"];

function isoToLocalInput(iso) {
  if (!iso) return "";
  // Input wants "YYYY-MM-DDTHH:MM"
  return String(iso).slice(0, 16);
}

export default function NeedModal({
  fundraiserId,
  type, // "money" | "time" | "item"
  joinedNeed, // { base, money/item/time } or null
  editingNeedId, // base need id or null
  onClose,
  onCreate,
  onUpdate,
}) {
  const isEdit = Boolean(editingNeedId);

  const initial = useMemo(() => {
    const base = joinedNeed?.base;
    const money = joinedNeed?.money;
    const item = joinedNeed?.item;
    const time = joinedNeed?.time;

    return {
      // base
      title: base?.title ?? "",
      description: base?.description ?? "",
      status: base?.status ?? "open",
      priority: base?.priority ?? "medium",

      // money
      target_amount: money?.target_amount ?? "",
      comment: money?.comment ?? "",

      // item
      item_name: item?.item_name ?? "",
      quantity_needed: item?.quantity_needed ?? 1,
      mode: item?.mode ?? "loan",
      notes: item?.notes ?? "",

      // time
      role_title: time?.role_title ?? "",
      location: time?.location ?? "",
      volunteers_needed: time?.volunteers_needed ?? 1,
      start_datetime: isoToLocalInput(time?.start_datetime),
      end_datetime: isoToLocalInput(time?.end_datetime),
      reward_tier: time?.reward_tier ?? null,
    };
  }, [joinedNeed]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => setForm(initial), [initial]);

  const onChange = (e) => {
    const { id, value, type: t } = e.target;
    setForm((p) => ({
      ...p,
      [id]: t === "number" ? value : value,
    }));
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!STATUS.includes(form.status)) return "Invalid status.";
    if (!PRIORITY.includes(form.priority)) return "Invalid priority.";

    if (type === "money") {
      if (form.target_amount === "" || Number.isNaN(Number(form.target_amount))) {
        return "Target amount is required.";
      }
    }

    if (type === "item") {
      if (!form.item_name.trim()) return "Item name is required.";
      if (form.quantity_needed === "" || Number(form.quantity_needed) < 1) return "Quantity must be 1+.";
      if (!ITEM_MODE.includes(form.mode)) return "Invalid mode.";
    }

    if (type === "time") {
      if (!form.role_title.trim()) return "Role title is required.";
      if (!form.start_datetime || !form.end_datetime) return "Start and end are required.";
      if (Number(form.volunteers_needed) < 1) return "Volunteers needed must be 1+.";
    }

    return null;
  };

  const handleSave = async () => {
    setErr(null);
    const v = validate();
    if (v) return setErr(v);

    setSaving(true);
    try {
      const basePayload = {
        fundraiser: Number(fundraiserId),
        need_type: type,
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        // sort_order: leave to backend default for now
      };

      let detailPayload = null;

      if (type === "money") {
        detailPayload = {
          target_amount: String(form.target_amount),
          comment: form.comment?.trim() || "",
        };
      }

      if (type === "item") {
        detailPayload = {
          item_name: form.item_name.trim(),
          quantity_needed: Number(form.quantity_needed),
          mode: form.mode,
          notes: form.notes?.trim() || "",
          donation_reward_tier: null,
          loan_reward_tier: null,
        };
      }

      if (type === "time") {
        detailPayload = {
          role_title: form.role_title.trim(),
          location: form.location?.trim() || "",
          volunteers_needed: Number(form.volunteers_needed),
          start_datetime: new Date(form.start_datetime).toISOString(),
          end_datetime: new Date(form.end_datetime).toISOString(),
          reward_tier: form.reward_tier ?? null,
        };
      }

      if (isEdit) {
        await onUpdate?.(editingNeedId, type, { base: basePayload, detail: detailPayload });
      } else {
        await onCreate?.(type, { base: basePayload, detail: detailPayload });
      }

      onClose();
    } catch (e) {
      setErr(e?.message ?? "Could not save need.");
    } finally {
      setSaving(false);
    }
  };

  const prettyType = type === "money" ? "Money" : type === "time" ? "Time" : "Item";

  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__head">
          <h3 className="modal__title">{isEdit ? `Edit ${prettyType} need` : `Add ${prettyType} need`}</h3>
          <button type="button" className="modal__x" onClick={onClose} aria-label="Close">×</button>
        </div>

        {err && <div className="modal__error">{err}</div>}

        <div className="modal__grid">
          {/* Base */}
          <div className="field field--full">
            <label className="field__label" htmlFor="title">Title</label>
            <input className="field__input" id="title" value={form.title} onChange={onChange} />
          </div>

          <div className="field field--full">
            <label className="field__label" htmlFor="description">Description</label>
            <textarea className="field__textarea" id="description" value={form.description} onChange={onChange} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="status">Status</label>
            <select className="field__select" id="status" value={form.status} onChange={onChange}>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="priority">Priority</label>
            <select className="field__select" id="priority" value={form.priority} onChange={onChange}>
              {PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Type-specific */}
          {type === "money" && (
            <>
              <div className="field field--full">
                <label className="field__label" htmlFor="target_amount">Target amount</label>
                <input className="field__input" id="target_amount" type="number" min="0" step="1"
                  value={form.target_amount} onChange={onChange} />
              </div>
              <div className="field field--full">
                <label className="field__label" htmlFor="comment">Comment</label>
                <input className="field__input" id="comment" value={form.comment} onChange={onChange} />
              </div>
            </>
          )}

          {type === "item" && (
            <>
              <div className="field field--full">
                <label className="field__label" htmlFor="item_name">Item name</label>
                <input className="field__input" id="item_name" value={form.item_name} onChange={onChange} />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="quantity_needed">Quantity</label>
                <input className="field__input" id="quantity_needed" type="number" min="1"
                  value={form.quantity_needed} onChange={onChange} />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="mode">Mode</label>
                <select className="field__select" id="mode" value={form.mode} onChange={onChange}>
                  {ITEM_MODE.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="field field--full">
                <label className="field__label" htmlFor="notes">Notes</label>
                <textarea className="field__textarea" id="notes" value={form.notes} onChange={onChange} />
              </div>
            </>
          )}

          {type === "time" && (
            <>
              <div className="field field--full">
                <label className="field__label" htmlFor="role_title">Role title</label>
                <input className="field__input" id="role_title" value={form.role_title} onChange={onChange} />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="volunteers_needed">Volunteers</label>
                <input className="field__input" id="volunteers_needed" type="number" min="1"
                  value={form.volunteers_needed} onChange={onChange} />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="location">Location</label>
                <input className="field__input" id="location" value={form.location} onChange={onChange} />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="start_datetime">Start</label>
                <input className="field__input" id="start_datetime" type="datetime-local"
                  value={form.start_datetime} onChange={onChange} />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="end_datetime">End</label>
                <input className="field__input" id="end_datetime" type="datetime-local"
                  value={form.end_datetime} onChange={onChange} />
              </div>
            </>
          )}
        </div>

        <div className="modal__foot">
          <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save need"}
          </button>
        </div>
      </div>
    </div>
  );
}
