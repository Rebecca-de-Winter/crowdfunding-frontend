import { useEffect, useMemo, useState } from "react";
import "./EditNeedModal.css";

import NeedsDropdown from "./NeedsDropdown";

import createTimeNeed from "../api/create-time-need";
import createItemNeed from "../api/create-item-need";
import createMoneyNeed from "../api/create-money-need";

import getTimeNeedByNeedId from "../api/get-time-need-by-need-id";
import getItemNeedByNeedId from "../api/get-item-need-by-need-id";

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

function normaliseItemMode(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "donation" || s === "donate") return "donation";
  if (s === "loan") return "loan";
  if (s === "either") return "either";
  return "either";
}

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

function localPartsToUtcIso(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;

  const t = String(timeStr).trim();
  const timeWithSeconds = /^\d{2}:\d{2}$/.test(t) ? `${t}:00` : t;

  const d = new Date(`${dateStr}T${timeWithSeconds}`);
  if (Number.isNaN(d.getTime())) return null;

  return d.toISOString();
}

function isEndAfterStartUtc(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return (
    Number.isFinite(start.getTime()) &&
    Number.isFinite(end.getTime()) &&
    end > start
  );
}

function prettyType(t) {
  if (t === "money") return "Money";
  if (t === "time") return "Time";
  return "Item";
}

function toDropdownOptions(tiers = []) {
  return tiers.map((tier) => ({
    value: String(tier.id),
    label: tier.name,
  }));
}

export default function EditNeedModal({
  open,
  need,
  rewardTiers = [],
  onClose,
  onSaved,
  disabled = false,
  variant = "inline",
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

  const currentFundraiserId = need?.fundraiser ?? need?.fundraiser_id ?? null;

  const fundraiserRewardTiers = useMemo(() => {
    return rewardTiers.filter(
      (tier) => String(tier.fundraiser) === String(currentFundraiserId)
    );
  }, [rewardTiers, currentFundraiserId]);

  const timeRewardOptions = useMemo(() => {
    return [
      { value: "", label: "No time reward" },
      ...toDropdownOptions(
        fundraiserRewardTiers.filter((tier) => tier.reward_type === "time")
      ),
    ];
  }, [fundraiserRewardTiers]);

  const itemRewardOptions = useMemo(() => {
    return [
      { value: "", label: "No item reward" },
      ...toDropdownOptions(
        fundraiserRewardTiers.filter((tier) => tier.reward_type === "item")
      ),
    ];
  }, [fundraiserRewardTiers]);

  const showDonationReward =
    item.mode === "donation" || item.mode === "either";

  const showLoanReward =
    item.mode === "loan" || item.mode === "either";

  useEffect(() => {
    if (!open || variant !== "overlay") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, variant]);

  useEffect(() => {
    if (!open || !need) return;

    let cancelled = false;

    setErr(null);
    setBusy(false);
    setDetailId(null);
    setBase(baseInitial);

    (async () => {
      try {
        let d = null;
        let id = null;

        if (need.need_type === "time") {
          d = await getTimeNeedByNeedId(need.id);
          if (cancelled) return;

          if (!d) {
            id = await findNeedDetailId("time", need.id);
            if (cancelled) return;

            setDetailId(id ?? null);
            if (!id) return;

            d = await getNeedDetail("time", id);
            if (cancelled) return;
          } else {
            setDetailId(d?.id ?? null);
          }

          if (!d) return;

          const start = isoToLocalParts(d?.start_datetime);
          const end = isoToLocalParts(d?.end_datetime);

          setTime({
            role_title: d?.role_title ?? "",
            location: d?.location ?? "",
            volunteers_needed: Number(d?.volunteers_needed ?? 1),
            start_date: start.date,
            start_time: start.time,
            end_date: end.date,
            end_time: end.time,
            reward_tier: d?.reward_tier ?? null,
          });

          return;
        }

        if (need.need_type === "item") {
          d = await getItemNeedByNeedId(need.id);
          if (cancelled) return;

          if (!d) {
            id = await findNeedDetailId("item", need.id);
            if (cancelled) return;

            setDetailId(id ?? null);
            if (!id) return;

            d = await getNeedDetail("item", id);
            if (cancelled) return;
          } else {
            setDetailId(d?.id ?? null);
          }

          if (!d) return;

          setItem({
            item_name: d?.item_name ?? "",
            quantity_needed: Number(d?.quantity_needed ?? 1),
            mode: normaliseItemMode(d?.mode),
            notes: d?.notes ?? "",
            donation_reward_tier: d?.donation_reward_tier ?? null,
            loan_reward_tier: d?.loan_reward_tier ?? null,
          });

          return;
        }

        id = await findNeedDetailId("money", need.id);
        if (cancelled) return;

        setDetailId(id ?? null);
        if (!id) return;

        d = await getNeedDetail("money", id);
        if (cancelled) return;
        if (!d) return;

        setMoney({
          target_amount: d?.target_amount ?? "",
          comment: d?.comment ?? "",
        });
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
      const n = Number(money.target_amount);
      if (!Number.isFinite(n) || n <= 0) return setErr("Target amount must be greater than zero.");
    }

    if (type === "item") {
      if (!item.item_name.trim()) return setErr("Item name is required.");
      const q = Number(item.quantity_needed);
      if (!Number.isFinite(q) || q < 1) return setErr("Quantity must be 1+.");
    }

    if (type === "time") {
      if (!time.role_title.trim()) return setErr("Role title is required.");
      if (!time.start_date || !time.start_time || !time.end_date || !time.end_time) {
        return setErr("Start and End date/time are required.");
      }

      const startIso = localPartsToUtcIso(time.start_date, time.start_time);
      const endIso = localPartsToUtcIso(time.end_date, time.end_time);
      if (!startIso || !endIso) return setErr("Please enter valid start/end values.");
      if (!isEndAfterStartUtc(startIso, endIso)) return setErr("End must be after start.");
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

      if (type === "money") {
        const payload = {
          need: need.id,
          target_amount: String(money.target_amount),
          comment: money.comment ?? "",
        };

        if (detailId) {
          const { need: _need, ...updatePayload } = payload;
          await updateNeedDetail("money", detailId, updatePayload);
        } else {
          const created = await createMoneyNeed(payload);
          setDetailId(created?.id ?? null);
        }
      }

      if (type === "item") {
        const payload = {
          need: need.id,
          item_name: item.item_name.trim(),
          quantity_needed: Number(item.quantity_needed),
          mode: normaliseItemMode(item.mode),
          notes: item.notes ?? "",
          donation_reward_tier: item.donation_reward_tier ?? null,
          loan_reward_tier: item.loan_reward_tier ?? null,
        };

        if (detailId) {
          const { need: _need, ...updatePayload } = payload;
          await updateNeedDetail("item", detailId, updatePayload);
        } else {
          const created = await createItemNeed(payload);
          setDetailId(created?.id ?? null);
        }
      }

      if (type === "time") {
        const startIso = localPartsToUtcIso(time.start_date, time.start_time);
        const endIso = localPartsToUtcIso(time.end_date, time.end_time);
        if (!startIso || !endIso) throw new Error("Please enter valid start/end values.");

        const payload = {
          need: need.id,
          role_title: time.role_title.trim(),
          location: time.location ?? "",
          volunteers_needed: Number(time.volunteers_needed),
          start_datetime: startIso,
          end_datetime: endIso,
          reward_tier: time.reward_tier ?? null,
        };

        if (detailId) {
          const { need: _need, ...updatePayload } = payload;
          await updateNeedDetail("time", detailId, updatePayload);
        } else {
          const created = await createTimeNeed(payload);
          setDetailId(created?.id ?? null);
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
                onChange={(e) =>
                  setItem((p) => ({ ...p, quantity_needed: Number(e.target.value) }))
                }
                disabled={isDisabled}
              />
            </div>

            <div className="field">
              <label className="field__label">Mode</label>
              <NeedsDropdown
                value={item.mode}
                onChange={(v) => setItem((p) => ({ ...p, mode: normaliseItemMode(v) }))}
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

            <div className="field field--full">
              <label className="field__label">Reward setup</label>
              <div className="field__hint">
                Choose which reward is earned for this item need. The system will apply
                the donation or loan reward based on the supporter’s pledge mode.
              </div>
            </div>

            {showDonationReward && (
              <div className="field">
                <label className="field__label">Donation reward</label>
                <NeedsDropdown
                  value={String(item.donation_reward_tier ?? "")}
                  onChange={(v) =>
                    setItem((p) => ({
                      ...p,
                      donation_reward_tier: v ? Number(v) : null,
                    }))
                  }
                  options={itemRewardOptions}
                  disabled={isDisabled}
                />
              </div>
            )}

            {showLoanReward && (
              <div className="field">
                <label className="field__label">Loan reward</label>
                <NeedsDropdown
                  value={String(item.loan_reward_tier ?? "")}
                  onChange={(v) =>
                    setItem((p) => ({
                      ...p,
                      loan_reward_tier: v ? Number(v) : null,
                    }))
                  }
                  options={itemRewardOptions}
                  disabled={isDisabled}
                />
              </div>
            )}
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
                onChange={(e) =>
                  setTime((p) => ({ ...p, volunteers_needed: Number(e.target.value) }))
                }
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

            <div className="field field--full">
              <label className="field__label">Time reward</label>
              <NeedsDropdown
                value={String(time.reward_tier ?? "")}
                onChange={(v) =>
                  setTime((p) => ({
                    ...p,
                    reward_tier: v ? Number(v) : null,
                  }))
                }
                options={timeRewardOptions}
                disabled={isDisabled}
              />
              <div className="field__hint">
                This reward is earned when someone commits to this volunteer role.
              </div>
            </div>
          </>
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