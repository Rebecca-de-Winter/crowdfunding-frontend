import { useMemo, useState } from "react";
import RewardTypeDropdown from "./RewardTypeDropdown";
import NeedsDropdown from "./NeedsDropdown";
import "./AddNeedForm.css";

const emptyNeed = {
  need_type: "money",
  title: "",
  description: "",
  status: "open",
  priority: "medium",

  target_amount: "",

  item_name: "",
  quantity_needed: 1,
  mode: "either",
  notes: "",

  role_title: "",
  location: "",
  volunteers_needed: 1,
  start_date: "",
  start_time: "",
  end_date: "",
  end_time: "",

  reward_tier: null,
};

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const ITEM_MODE_OPTIONS = [
  { value: "donation", label: "Donation" },
  { value: "loan", label: "Loan" },
  { value: "either", label: "Either" },
];

export default function AddNeedForm({ onCancel, onCreate, disabled }) {
  const [form, setForm] = useState(emptyNeed);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function setField(id, value) {
    setForm((f) => ({ ...f, [id]: value }));
  }

  function handleTypeChange(value) {
    setForm((f) => ({
      ...f,
      need_type: value,
      target_amount: value === "money" ? f.target_amount : "",
      role_title: value === "time" ? f.role_title : "",
      location: value === "time" ? f.location : "",
      volunteers_needed: value === "time" ? f.volunteers_needed : 1,
      start_date: value === "time" ? f.start_date : "",
      start_time: value === "time" ? f.start_time : "",
      end_date: value === "time" ? f.end_date : "",
      end_time: value === "time" ? f.end_time : "",
      reward_tier: value === "time" ? f.reward_tier : null,
      item_name: value === "item" ? f.item_name : "",
      quantity_needed: value === "item" ? f.quantity_needed : 1,
      mode: value === "item" ? f.mode : "either",
      notes: value === "item" ? f.notes : "",
    }));
  }

  const canSubmit = useMemo(() => {
    if (!form.title.trim()) return false;

    if (form.need_type === "money") {
      return form.target_amount !== "" && !Number.isNaN(Number(form.target_amount));
    }

    if (form.need_type === "time") {
      return (
        form.role_title.trim() &&
        form.start_date &&
        form.start_time &&
        form.end_date &&
        form.end_time &&
        Number(form.volunteers_needed) >= 1
      );
    }

    if (form.need_type === "item") {
      return (
        form.item_name.trim() &&
        Number(form.quantity_needed) >= 1 &&
        ["donation", "loan", "either"].includes(form.mode)
      );
    }

    return true;
  }, [form]);

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setError(null);

    if (!form.title.trim()) return setError("Title is required.");

    if (form.need_type === "money") {
      if (form.target_amount === "" || Number.isNaN(Number(form.target_amount))) {
        return setError("Target amount is required.");
      }
    }

    if (form.need_type === "time") {
      if (!form.role_title.trim()) return setError("Role title is required.");
      if (!form.start_date || !form.start_time || !form.end_date || !form.end_time) {
        return setError("Start and end date/time are required.");
      }

      if (Number(form.volunteers_needed) < 1) return setError("Volunteers needed must be 1+.");
    }

    if (form.need_type === "item") {
      if (!form.item_name.trim()) return setError("Item name is required.");
      if (Number(form.quantity_needed) < 1) return setError("Quantity must be 1+.");
    }

    setBusy(true);
    try {
      await onCreate?.(form);
      setForm(emptyNeed);
    } catch (err) {
      setError(err?.message || "Could not add need.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="needAdd" role="region" aria-label="Add need">
      {/* IMPORTANT: no <form> inside the EditFestivalPage <form> */}
      <div className="needAdd__grid">
        <div className="needAdd__field">
          <label className="needAdd__label">Need type</label>
          <RewardTypeDropdown
            value={form.need_type}
            onChange={handleTypeChange}
            disabled={disabled || busy}
          />
        </div>

        <div className="needAdd__field">
          <label className="needAdd__label">Title</label>
          <input
            className="needAdd__input"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            disabled={disabled || busy}
          />
        </div>

        <div className="needAdd__field">
          <label className="needAdd__label">Description</label>
          <textarea
            className="needAdd__textarea"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            disabled={disabled || busy}
          />
        </div>

        <div className="needAdd__row">
          <div className="needAdd__field">
            <label className="needAdd__label">Status</label>
            <NeedsDropdown
              value={form.status}
              onChange={(v) => setField("status", v)}
              disabled={disabled || busy}
              options={STATUS_OPTIONS}
            />
          </div>

          <div className="needAdd__field">
            <label className="needAdd__label">Priority</label>
            <NeedsDropdown
              value={form.priority}
              onChange={(v) => setField("priority", v)}
              disabled={disabled || busy}
              options={PRIORITY_OPTIONS}
            />
          </div>
        </div>

        {form.need_type === "money" && (
          <div className="needAdd__field">
            <label className="needAdd__label">Target amount (AUD)</label>
            <input
              className="needAdd__input"
              type="number"
              min="0"
              step="0.01"
              value={form.target_amount}
              onChange={(e) => setField("target_amount", e.target.value)}
              disabled={disabled || busy}
            />
          </div>
        )}

        {form.need_type === "item" && (
          <>
            <div className="needAdd__field">
              <label className="needAdd__label">Item name</label>
              <input
                className="needAdd__input"
                value={form.item_name}
                onChange={(e) => setField("item_name", e.target.value)}
                disabled={disabled || busy}
              />
            </div>

            <div className="needAdd__row">
              <div className="needAdd__field">
                <label className="needAdd__label">Quantity</label>
                <input
                  className="needAdd__input"
                  type="number"
                  min="1"
                  value={form.quantity_needed}
                  onChange={(e) => setField("quantity_needed", e.target.value)}
                  disabled={disabled || busy}
                />
              </div>

              <div className="needAdd__field">
                <label className="needAdd__label">Mode</label>
                <NeedsDropdown
                  value={form.mode}
                  onChange={(v) => setField("mode", v)}
                  disabled={disabled || busy}
                  options={ITEM_MODE_OPTIONS}
                />
              </div>
            </div>

            <div className="needAdd__field">
              <label className="needAdd__label">Notes</label>
              <textarea
                className="needAdd__textarea"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                disabled={disabled || busy}
              />
            </div>
          </>
        )}

        {form.need_type === "time" && (
          <>
            <div className="needAdd__field">
              <label className="needAdd__label">Role title</label>
              <input
                className="needAdd__input"
                value={form.role_title}
                onChange={(e) => setField("role_title", e.target.value)}
                disabled={disabled || busy}
              />
            </div>

            <div className="needAdd__row">
              <div className="needAdd__field">
                <label className="needAdd__label">Volunteers needed</label>
                <input
                  className="needAdd__input"
                  type="number"
                  min="1"
                  value={form.volunteers_needed}
                  onChange={(e) => setField("volunteers_needed", e.target.value)}
                  disabled={disabled || busy}
                />
              </div>

              <div className="needAdd__field">
                <label className="needAdd__label">Location</label>
                <input
                  className="needAdd__input"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  disabled={disabled || busy}
                />
              </div>
            </div>

            <div className="needAdd__row">
  <div className="needAdd__field">
    <label className="needAdd__label">Start date</label>
    <input
      className="needAdd__input"
      type="date"
      value={form.start_date}
      onChange={(e) => setField("start_date", e.target.value)}
      disabled={disabled || busy}
    />
  </div>

  <div className="needAdd__field">
    <label className="needAdd__label">Start time</label>
    <input
      className="needAdd__input"
      type="time"
      value={form.start_time}
      onChange={(e) => setField("start_time", e.target.value)}
      disabled={disabled || busy}
    />
  </div>
</div>

<div className="needAdd__row">
  <div className="needAdd__field">
    <label className="needAdd__label">End date</label>
    <input
      className="needAdd__input"
      type="date"
      value={form.end_date}
      onChange={(e) => setField("end_date", e.target.value)}
      disabled={disabled || busy}
    />
  </div>

  <div className="needAdd__field">
    <label className="needAdd__label">End time</label>
    <input
      className="needAdd__input"
      type="time"
      value={form.end_time}
      onChange={(e) => setField("end_time", e.target.value)}
      disabled={disabled || busy}
    />
  </div>
            </div>
          </>
        )}

        {error && <div className="needAdd__error">{error}</div>}

        <div className="needAdd__actions">
          <button
            type="button"
            className="rtBtn rtBtn--primary"
            onClick={handleSubmit}
            disabled={disabled || busy || !canSubmit}
          >
            {busy ? "Adding…" : "Add need"}
          </button>

          <button
            type="button"
            className="rtBtn rtBtn--ghost"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
