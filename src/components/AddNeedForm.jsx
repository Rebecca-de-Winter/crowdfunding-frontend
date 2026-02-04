import { useState } from "react";
import RewardTypeDropdown from "./RewardTypeDropdown";
import NeedsDropdown from "./NeedsDropdown";
import "./AddNeedForm.css";

const emptyNeed = {
  need_type: "money",
  title: "",
  description: "",
  status: "open",
  priority: "medium",
};

export default function AddNeedForm({ onCancel, onCreate, disabled }) {
  const [form, setForm] = useState(emptyNeed);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function setField(id, value) {
    setForm((f) => ({ ...f, [id]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    setBusy(true);
    try {
      await onCreate(form);
      setForm(emptyNeed);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="needAdd">
      <form className="needAdd__grid" onSubmit={handleSubmit}>
        {/* TYPE */}
        <div className="needAdd__field">
          <label className="needAdd__label">Need type</label>
          <RewardTypeDropdown
            value={form.need_type}
            onChange={(value) => setField("need_type", value)}
            disabled={disabled || busy}
          />
        </div>

        {/* TITLE */}
        <div className="needAdd__field">
          <label className="needAdd__label">Title</label>
          <input
            className="needAdd__input"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            disabled={disabled || busy}
          />
        </div>

        {/* DESCRIPTION */}
        <div className="needAdd__field">
          <label className="needAdd__label">Description</label>
          <textarea
            className="needAdd__textarea"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            disabled={disabled || busy}
          />
        </div>

        {/* STATUS + PRIORITY */}
        <div className="needAdd__row">
  <div className="needAdd__field">
    <label className="needAdd__label">Status</label>
    <NeedsDropdown
  value={form.status}
  onChange={(v) => setField("status", v)}
  disabled={disabled || busy}
  options={[
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
  ]}
/>
  </div>

  <div className="needAdd__field">
    <label className="needAdd__label">Priority</label>
    <NeedsDropdown
  value={form.priority}
  onChange={(v) => setField("priority", v)}
  disabled={disabled || busy}
  options={[
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ]}
/>
  </div>
</div>




        {error && <div className="needAdd__error">{error}</div>}

        <div className="needAdd__actions">
          <button
            type="submit"
            className="rtBtn rtBtn--primary"
            disabled={disabled || busy}
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
      </form>
    </div>
  );
}
