import { useEffect, useMemo, useState } from "react";
import "./EditNeedModal.css";

import NeedsDropdown from "./NeedsDropdown";
import findNeedDetailId from "../api/find-need-detail-id";
import getNeedDetail from "../api/get-need-detail";
import updateNeed from "../api/update-need";
import updateNeedDetail from "../api/update-need-detail";

const STATUS_OPTS = [
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const ITEM_MODE_OPTS = [
  { value: "donation", label: "Donation" },
  { value: "loan", label: "Loan" },
  { value: "either", label: "Either" },
];

// ---------- time helpers (LOCAL display, ISO save) ----------
function isoToLocalParts(iso) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };

  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

function localDateTimeToIso(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  // Date("YYYY-MM-DDTHH:mm") is interpreted as local time
  const d = new Date(`${dateStr}T${timeStr}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
// -----------------------------------------------------------

function prettyType(t) {
  if (t === "money") return "Money";
  if (t === "time") return "Time";
  return "Item";
}

export default function EditNeedModal({
  open,
  need,
  onClose,
  onSaved,
  disabled = false,
  variant = "inline", // "inline" | "overlay"
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const safeNeedStatus = (s) =>
  ["open", "filled", "closed", "cancelled"].includes(s) ? s : "open";

const baseInitial = useMemo(
  () => ({
    title: need?.title ?? "",
    description: need?.description ?? "",
    status: safeNeedStatus(need?.status ?? "open"),
    priority: need?.priority ?? "medium",
  }),
  [need]
);


  const [base, setBase] = useState(baseInitial);

  const [money, setMoney] = useState({ target_amount: "", comment: "" });

  const [item, setItem] = useState({
    item_name: "",
    quantity_needed: 1,
    mode: "either",
    notes: "",
    donation_reward_tier: null,
    loan_reward_tier: null,
  });

  const [time, setTime] = useState({
    role_title: "",
    location: "",
    volunteers_needed: 1,
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    reward_tier: null,
  });

  // Lock page scroll ONLY for overlay mode
  useEffect(() => {
    if (!open || variant !== "overlay") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, variant]);

  // Load detail row when opened / need changes
  useEffect(() => {
    if (!open || !need) return;

    let cancelled = false;

    setErr(null);
    setBusy(false);
    setDetailId(null);
    setBase(baseInitial);

    (async () => {
      try {
        const id = await findNeedDetailId(need.need_type, need.id);
        if (cancelled) return;

        setDetailId(id ?? null);
        if (!id) return;

        const d = await getNeedDetail(need.need_type, id);
        if (cancelled) return;

        if (need.need_type === "money") {
          setMoney({
            target_amount: d?.target_amount ?? "",
            comment: d?.comment ?? "",
          });
        } else if (need.need_type === "item") {
          setItem({
            item_name: d?.item_name ?? "",
            quantity_needed: d?.quantity_needed ?? 1,
            mode: d?.mode ?? "either",
            notes: d?.notes ?? "",
            donation_reward_tier: d?.donation_reward_tier ?? null,
            loan_reward_tier: d?.loan_reward_tier ?? null,
          });
        } else if (need.need_type === "time") {
          const start = isoToLocalParts(d?.start_datetime);
          const end = isoToLocalParts(d?.end_datetime);

          setTime({
            role_title: d?.role_title ?? "",
            location: d?.location ?? "",
            volunteers_needed: d?.volunteers_needed ?? 1,
            start_date: start.date,
            start_time: start.time,
            end_date: end.date,
            end_time: end.time,
            reward_tier: d?.reward_tier ?? null,
          });
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message ?? "Could not load need detail.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, need, baseInitial]);

  if (!open || !need) return null;

  const type = need.need_type;
  const isDisabled = Boolean(disabled || busy);

  function setBaseField(key, val) {
    setBase((b) => ({ ...b, [key]: val }));
  }

  async function handleSave() {
    setErr(null);

    if (!base.title.trim()) return setErr("Title is required.");

    if (type === "money") {
      if (money.target_amount === "" || Number(money.target_amount) <= 0) {
        return setErr("Target amount must be greater than zero.");
      }
    }

    if (type === "item") {
      if (!item.item_name.trim()) return setErr("Item name is required.");
      if (Number(item.quantity_needed) < 1) return setErr("Quantity must be 1+.");
    }

    if (type === "time") {
      if (!time.role_title.trim()) return setErr("Role title is required.");
      if (!time.start_date || !time.start_time || !time.end_date || !time.end_time) {
        return setErr("Start and End date/time are required.");
      }

      const startIso = localDateTimeToIso(time.start_date, time.start_time);
      const endIso = localDateTimeToIso(time.end_date, time.end_time);

      if (!startIso || !endIso) return setErr("Please enter valid start/end values.");
      if (new Date(endIso) <= new Date(startIso)) return setErr("End must be after start.");
    }

    setBusy(true);
    try {
      const updatedBase = await updateNeed(need.id, {
        fundraiser: need.fundraiser ?? need.fundraiser_id,
        need_type: need.need_type,
        title: base.title.trim(),
        description: base.description ?? "",
        status: base.status,
        priority: base.priority,
        sort_order: need.sort_order ?? 0,
      });

      if (detailId) {
        if (type === "money") {
          await updateNeedDetail("money", detailId, {
            target_amount: String(money.target_amount),
            comment: money.comment ?? "",
          });
        } else if (type === "item") {
          await updateNeedDetail("item", detailId, {
            item_name: item.item_name.trim(),
            quantity_needed: Number(item.quantity_needed),
            mode: item.mode,
            notes: item.notes ?? "",
            donation_reward_tier: item.donation_reward_tier ?? null,
            loan_reward_tier: item.loan_reward_tier ?? null,
          });
        } else if (type === "time") {
          const startIso = localDateTimeToIso(time.start_date, time.start_time);
          const endIso = localDateTimeToIso(time.end_date, time.end_time);

          await updateNeedDetail("time", detailId, {
            role_title: time.role_title.trim(),
            location: time.location ?? "",
            volunteers_needed: Number(time.volunteers_needed),
            start_datetime: startIso,
            end_datetime: endIso,
            reward_tier: time.reward_tier ?? null,
          });
        }
      }

      onSaved?.(updatedBase);
      onClose?.();
    } catch (e) {
      setErr(e?.message ?? "Could not save need.");
    } finally {
      setBusy(false);
    }
  }

  const modalInner = (
    <div className={`modal modal--need ${variant === "inline" ? "modal--inline" : ""}`}>
      <div className="modal__head">
        <h3 className="modal__title">Edit {prettyType(type)} need</h3>
      </div>

      {err && <div className="modal__error">{err}</div>}

      <div className="modal__grid">
        <div className="field field--full">
          <label className="field__label">Title</label>
          <input
            className="field__input"
            value={base.title}
            onChange={(e) => setBaseField("title", e.target.value)}
            disabled={isDisabled}
            autoFocus
          />
        </div>

        <div className="field field--full">
          <label className="field__label">Description</label>
          <textarea
            className="field__textarea"
            value={base.description}
            onChange={(e) => setBaseField("description", e.target.value)}
            disabled={isDisabled}
          />
        </div>

        <div className="field">
          <label className="field__label">Status</label>
          <NeedsDropdown
            value={base.status}
            onChange={(v) => setBaseField("status", v)}
            options={STATUS_OPTS}
            disabled={isDisabled}
          />
        </div>

        <div className="field">
          <label className="field__label">Priority</label>
          <NeedsDropdown
            value={base.priority}
            onChange={(v) => setBaseField("priority", v)}
            options={PRIORITY_OPTS}
            disabled={isDisabled}
          />
        </div>

        {type === "money" && (
          <>
            <div className="field field--full">
              <label className="field__label">Target amount</label>
              <input
                className="field__input"
                type="number"
                min="0"
                step="0.01"
                value={money.target_amount}
                onChange={(e) => setMoney((m) => ({ ...m, target_amount: e.target.value }))}
                disabled={isDisabled}
              />
            </div>

            <div className="field field--full">
              <label className="field__label">Comment</label>
              <input
                className="field__input"
                value={money.comment}
                onChange={(e) => setMoney((m) => ({ ...m, comment: e.target.value }))}
                disabled={isDisabled}
              />
            </div>
          </>
        )}

        {type === "item" && (
          <>
            <div className="field field--full">
              <label className="field__label">Item name</label>
              <input
                className="field__input"
                value={item.item_name}
                onChange={(e) => setItem((p) => ({ ...p, item_name: e.target.value }))}
                disabled={isDisabled}
              />
            </div>

            <div className="field">
              <label className="field__label">Quantity</label>
              <input
                className="field__input"
                type="number"
                min="1"
                value={item.quantity_needed}
                onChange={(e) => setItem((p) => ({ ...p, quantity_needed: e.target.value }))}
                disabled={isDisabled}
              />
            </div>

            <div className="field">
              <label className="field__label">Mode</label>
              <NeedsDropdown
                value={item.mode}
                onChange={(v) => setItem((p) => ({ ...p, mode: v }))}
                options={ITEM_MODE_OPTS}
                disabled={isDisabled}
              />
            </div>

            <div className="field field--full">
              <label className="field__label">Notes</label>
              <textarea
                className="field__textarea"
                value={item.notes}
                onChange={(e) => setItem((p) => ({ ...p, notes: e.target.value }))}
                disabled={isDisabled}
              />
            </div>
          </>
        )}

        {type === "time" && (
          <>
            <div className="field field--full">
              <label className="field__label">Role title</label>
              <input
                className="field__input"
                value={time.role_title}
                onChange={(e) => setTime((p) => ({ ...p, role_title: e.target.value }))}
                disabled={isDisabled}
              />
            </div>

            <div className="field">
              <label className="field__label">Volunteers</label>
              <input
                className="field__input"
                type="number"
                min="1"
                value={time.volunteers_needed}
                onChange={(e) => setTime((p) => ({ ...p, volunteers_needed: e.target.value }))}
                disabled={isDisabled}
              />
            </div>

            <div className="field">
              <label className="field__label">Location</label>
              <input
                className="field__input"
                value={time.location}
                onChange={(e) => setTime((p) => ({ ...p, location: e.target.value }))}
                disabled={isDisabled}
              />
            </div>

            <div className="field">
              <label className="field__label">Start date</label>
              <input
                className="field__input"
                type="date"
                value={time.start_date}
                onChange={(e) => setTime((p) => ({ ...p, start_date: e.target.value }))}
                disabled={isDisabled}
              />
            </div>

            <div className="field">
              <label className="field__label">Start time</label>
              <input
                className="field__input"
                type="time"
                value={time.start_time}
                onChange={(e) => setTime((p) => ({ ...p, start_time: e.target.value }))}
                disabled={isDisabled}
              />
            </div>

            <div className="field">
              <label className="field__label">End date</label>
              <input
                className="field__input"
                type="date"
                value={time.end_date}
                onChange={(e) => setTime((p) => ({ ...p, end_date: e.target.value }))}
                disabled={isDisabled}
              />
            </div>

            <div className="field">
              <label className="field__label">End time</label>
              <input
                className="field__input"
                type="time"
                value={time.end_time}
                onChange={(e) => setTime((p) => ({ ...p, end_time: e.target.value }))}
                disabled={isDisabled}
              />
            </div>
          </>
        )}

        {!detailId && (
          <div className="modal__hint field--full">
            Heads up: I couldn’t find the detail row for this need yet (so only base fields will save).
          </div>
        )}
      </div>

      <div className="modal__foot">
        <button
          type="button"
          className="rtBtn rtBtn--secondary"
          onClick={onClose}
          disabled={isDisabled}
        >
          Cancel
        </button>

        <button
          type="button"
          className="rtBtn rtBtn--primary"
          onClick={handleSave}
          disabled={isDisabled}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );

  if (variant === "inline") return <div className="inlineEditor">{modalInner}</div>;

  return (
    <div
      className="modal__backdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div onMouseDown={(e) => e.stopPropagation()}>{modalInner}</div>
    </div>
  );
}
