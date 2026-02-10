// src/components/NeedsPanel.jsx
import { useEffect, useMemo, useState } from "react";
import "./NeedsPanel.css";

import AddNeedForm from "./AddNeedForm";
import createNeed from "../api/create-need";
import createMoneyNeed from "../api/create-money-need";
import createItemNeed from "../api/create-item-need";
import createTimeNeed from "../api/create-time-need";
import deleteNeed from "../api/delete-need";
import findNeedDetailId from "../api/find-need-detail-id";
import deleteItemNeed from "../api/delete-item-need";
import deleteMoneyNeed from "../api/delete-money-need";
import deleteTimeNeed from "../api/delete-time-need";
import updateNeed from "../api/update-need";
import EditNeedModal from "./EditNeedModal";
import NeedPills from "./NeedPills";

import getItemNeedByNeedId from "../api/get-item-need-by-need-id";
import getMoneyNeedByNeedId from "../api/get-money-need-by-need-id";
import getTimeNeedByNeedId from "../api/get-time-need-by-need-id";

function safeLower(v) {
  return String(v ?? "").trim().toLowerCase();
}

function formatAUD(value) {
  const n = Number(value);
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

// Time formatting (same vibe as your FundraiserPage)
function formatShiftLineAU(startIso, endIso) {
  if (!startIso && !endIso) return null;

  const d = new Date(startIso || endIso);
  if (Number.isNaN(d.getTime())) return null;

  const day = new Intl.DateTimeFormat("en-AU", { weekday: "long" }).format(d);
  const datePart = d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const fmtTime = (iso) => {
    if (!iso) return null;
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return null;

    const raw = new Intl.DateTimeFormat("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(t);

    return raw.replace(":", ".").replace(" am", "am").replace(" pm", "pm");
  };

  const startT = fmtTime(startIso);
  const endT = fmtTime(endIso);

  if (startT && endT) return `${day} ${datePart} — ${startT} - ${endT}`;
  if (startT) return `${day} ${datePart} ${startT}`;
  return `${day} ${datePart}`;
}

function itemModeLabelFromDetail(detail) {
  const mode = safeLower(detail?.mode);
  const hasDonation = detail?.donation_reward_tier != null;
  const hasLoan = detail?.loan_reward_tier != null;

  if (mode.includes("donat") || (hasDonation && !hasLoan)) return "Donation";
  if (mode.includes("loan") || (!hasDonation && hasLoan)) return "Loan";
  if (mode.includes("either") || (hasDonation && hasLoan)) return "Either";
  return null;
}

function groupByType(needs = []) {
  const money = [];
  const time = [];
  const item = [];
  for (const n of needs) {
    if (n.need_type === "money") money.push(n);
    else if (n.need_type === "time") time.push(n);
    else item.push(n);
  }
  return { money, time, item };
}

/**
 * Sort rules:
 * - needs with a real (non-zero) sort_order come first, ascending
 * - needs with sort_order 0/null fall back to id order
 */
function sortNeeds(arr) {
  return [...arr].sort((a, b) => {
    const sa = Number(a.sort_order);
    const sb = Number(b.sort_order);

    const aHas = Number.isFinite(sa) && sa !== 0;
    const bHas = Number.isFinite(sb) && sb !== 0;

    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;

    if (aHas && bHas && sa !== sb) return sa - sb;

    return (a.id ?? 0) - (b.id ?? 0);
  });
}

function NeedRow({
  need,
  disabled,
  typeLabel = null,
  metaLines = [],
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  readOnly = false,
}) {
  return (
    <div className="needRow">
      <div className="needRow__main">
        <div className="needRow__title">{need.title}</div>

        {need.description ? <div className="needRow__desc">{need.description}</div> : null}

        {metaLines.length > 0
          ? metaLines.map((line, i) => (
              <div className="needRow__meta" key={`${need.id}-meta-${i}`}>
                {line}
              </div>
            ))
          : null}

        <NeedPills
          typeLabel={typeLabel}
          status={need.status ?? "open"}
          priority={need.priority ?? "medium"}
        />
      </div>

      {!readOnly && (
        <div className="needRow__actions">
          <button
            type="button"
            className="needIconBtn"
            onClick={() => onMoveUp?.(need)}
            disabled={disabled || isFirst}
            aria-label="Move up"
            title="Move up"
          >
            ▲
          </button>

          <button
            type="button"
            className="needIconBtn"
            onClick={() => onMoveDown?.(need)}
            disabled={disabled || isLast}
            aria-label="Move down"
            title="Move down"
          >
            ▼
          </button>

          <button
            type="button"
            className="rtBtn rtBtn--ghost"
            onClick={() => onEdit?.(need)}
            disabled={disabled}
          >
            Edit
          </button>

          <button
            type="button"
            className="rtBtn rtBtn--danger"
            onClick={() => onDelete?.(need)}
            disabled={disabled}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function NeedAccordion({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="needAcc">
      <button
        type="button"
        className="needAcc__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="needAcc__left">
          <span className="needAcc__chev">{open ? "▾" : "▸"}</span>
          <span className="needAcc__title">{title}</span>
          <span className="needAcc__count">{count}</span>
        </div>

        <span className="needAcc__hint">{open ? "Collapse" : "Expand"}</span>
      </button>

      {open ? <div className="needAcc__body">{children}</div> : null}
    </section>
  );
}

function buildNeedPutPayload(existingNeed, fundraiserId, overrides = {}) {
  const fundraiser =
    existingNeed.fundraiser ?? existingNeed.fundraiser_id ?? Number(fundraiserId);

  return {
    fundraiser,
    need_type: existingNeed.need_type,
    title: existingNeed.title ?? "",
    description: existingNeed.description ?? "",
    status: existingNeed.status ?? "open",
    priority: existingNeed.priority ?? "medium",
    sort_order: existingNeed.sort_order ?? 0,
    ...overrides,
  };
}

export default function NeedsPanel({
  fundraiserId,
  needs = [],
  disabled = false,
  onAddNeed,
  onEditNeed,
  onDeleteNeed,
  readOnly = false,
}) {
  const [showAdd, setShowAdd] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState(null);

  const [itemNeedMap, setItemNeedMap] = useState({});
  const [moneyNeedMap, setMoneyNeedMap] = useState({});
  const [timeNeedMap, setTimeNeedMap] = useState({});

  function openEdit(need) {
    if (readOnly) return;
    setEditingNeed(need);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingNeed(null);
  }

  function applyUpdatedBase(updated) {
    onEditNeed?.(updated);

    if (updated?.need_type === "money") {
      setMoneyNeedMap((prev) => {
        const next = { ...prev };
        delete next[updated.id];
        return next;
      });
    }

    if (updated?.need_type === "item") {
      setItemNeedMap((prev) => {
        const next = { ...prev };
        delete next[updated.id];
        return next;
      });
    }

    if (updated?.need_type === "time") {
      setTimeNeedMap((prev) => {
        const next = { ...prev };
        delete next[updated.id];
        return next;
      });
    }
  }

  const grouped = useMemo(() => groupByType(needs), [needs]);
  const money = useMemo(() => sortNeeds(grouped.money), [grouped.money]);
  const time = useMemo(() => sortNeeds(grouped.time), [grouped.time]);
  const item = useMemo(() => sortNeeds(grouped.item), [grouped.item]);

  // Helper: compute missing IDs based on current map
  function missingIdsFor(list, map) {
    const ids = list.map((n) => n.id).filter(Boolean);
    return ids.filter((id) => map[id] === undefined);
  }

  // Item detail cache
  useEffect(() => {
    let alive = true;

    async function load() {
      const missing = missingIdsFor(item, itemNeedMap);
      if (missing.length === 0) return;

      try {
        const pairs = await Promise.all(
          missing.map(async (needId) => [needId, (await getItemNeedByNeedId(needId)) ?? null])
        );
        if (!alive) return;

        setItemNeedMap((prev) => {
          const next = { ...prev };
          for (const [needId, detail] of pairs) next[needId] = detail;
          return next;
        });
      } catch (err) {
        if (!alive) return;

        setItemNeedMap((prev) => {
          const next = { ...prev };
          for (const needId of missing) next[needId] = null;
          return next;
        });

        console.error("Failed to load item need details:", err);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [item, itemNeedMap]);

  // Money detail cache
  useEffect(() => {
    let alive = true;

    async function load() {
      const missing = missingIdsFor(money, moneyNeedMap);
      if (missing.length === 0) return;

      try {
        const pairs = await Promise.all(
          missing.map(async (needId) => [needId, (await getMoneyNeedByNeedId(needId)) ?? null])
        );
        if (!alive) return;

        setMoneyNeedMap((prev) => {
          const next = { ...prev };
          for (const [needId, detail] of pairs) next[needId] = detail;
          return next;
        });
      } catch (err) {
        if (!alive) return;

        setMoneyNeedMap((prev) => {
          const next = { ...prev };
          for (const needId of missing) next[needId] = null;
          return next;
        });

        console.error("Failed to load money need details:", err);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [money, moneyNeedMap]);

  // Time detail cache
  useEffect(() => {
    let alive = true;

    async function load() {
      const missing = missingIdsFor(time, timeNeedMap);
      if (missing.length === 0) return;

      try {
        const pairs = await Promise.all(
          missing.map(async (needId) => [needId, (await getTimeNeedByNeedId(needId)) ?? null])
        );
        if (!alive) return;

        setTimeNeedMap((prev) => {
          const next = { ...prev };
          for (const [needId, detail] of pairs) next[needId] = detail;
          return next;
        });
      } catch (err) {
        if (!alive) return;

        setTimeNeedMap((prev) => {
          const next = { ...prev };
          for (const needId of missing) next[needId] = null;
          return next;
        });

        console.error("Failed to load time need details:", err);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [time, timeNeedMap]);

  function makeOrderMap(list) {
    const map = {};
    list.forEach((n, i) => {
      map[n.id] = (i + 1) * 10;
    });
    return map;
  }

  async function move(arr, need, dir) {
    if (readOnly) return;

    const idx = arr.findIndex((n) => n.id === need.id);
    if (idx < 0) return;

    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= arr.length) return;

    const swapped = [...arr];
    [swapped[idx], swapped[nextIdx]] = [swapped[nextIdx], swapped[idx]];

    const orderMap = makeOrderMap(swapped);

    swapped.forEach((n) => {
      onEditNeed?.({ ...n, sort_order: orderMap[n.id] });
    });

    try {
      const updated = await Promise.all(
        swapped.map((n) =>
          updateNeed(n.id, buildNeedPutPayload(n, fundraiserId, { sort_order: orderMap[n.id] }))
        )
      );

      updated.forEach((n) => onEditNeed?.(n));
    } catch (err) {
      console.error("Reorder failed:", err);
      alert(err?.message ?? "Failed to reorder needs");
    }
  }

  async function handleCreateNeed(data) {
    try {
      const base = await createNeed(fundraiserId, {
        need_type: data.need_type,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
      });

      if (data.need_type === "money") {
        await createMoneyNeed({
          need: base.id,
          target_amount: data.target_amount,
          comment: "",
        });

        setMoneyNeedMap((prev) => {
          const next = { ...prev };
          delete next[base.id];
          return next;
        });
      }

      if (data.need_type === "item") {
        await createItemNeed({
          need: base.id,
          item_name: data.item_name,
          quantity_needed: Number(data.quantity_needed),
          mode: data.mode,
          notes: data.notes ?? "",
          donation_reward_tier: null,
          loan_reward_tier: null,
        });

        setItemNeedMap((prev) => {
          const next = { ...prev };
          delete next[base.id];
          return next;
        });
      }

      if (data.need_type === "time") {
        await createTimeNeed({
          need: base.id,
          start_datetime: data.start_datetime,
          end_datetime: data.end_datetime,
          volunteers_needed: Number(data.volunteers_needed),
          role_title: data.role_title,
          location: data.location ?? "",
          reward_tier: null,
        });

        setTimeNeedMap((prev) => {
          const next = { ...prev };
          delete next[base.id];
          return next;
        });
      }

      onAddNeed?.(base);
      setShowAdd(false);
    } catch (err) {
      console.error("Create need failed:", err);
      alert(err?.message ?? "Failed to create need");
    }
  }

  async function handleDeleteNeed(need) {
    if (readOnly) return;

    const ok = window.confirm("Delete this need?");
    if (!ok) return;

    try {
      const detailId = await findNeedDetailId(need.need_type, need.id);

      if (detailId) {
        if (need.need_type === "item") await deleteItemNeed(detailId);
        if (need.need_type === "money") await deleteMoneyNeed(detailId);
        if (need.need_type === "time") await deleteTimeNeed(detailId);
      }

      await deleteNeed(need.id);
      onDeleteNeed?.(need);

      if (need.need_type === "item") {
        setItemNeedMap((prev) => {
          const next = { ...prev };
          delete next[need.id];
          return next;
        });
      }

      if (need.need_type === "money") {
        setMoneyNeedMap((prev) => {
          const next = { ...prev };
          delete next[need.id];
          return next;
        });
      }

      if (need.need_type === "time") {
        setTimeNeedMap((prev) => {
          const next = { ...prev };
          delete next[need.id];
          return next;
        });
      }

      if (editingNeed?.id === need.id) closeEdit();
    } catch (err) {
      console.error("Delete need failed:", err);
      alert(err?.message ?? "Failed to delete need");
    }
  }

  function renderList(list, emptyLabel) {
    if (list.length === 0) return <div className="needsEmpty">No {emptyLabel} yet.</div>;

    return (
      <div className="needsList">
        {list.map((n, i) => {
          const typeLabel =
            n.need_type === "item" ? itemModeLabelFromDetail(itemNeedMap[n.id]) : null;

          const metaLines = [];

          if (n.need_type === "money" && moneyNeedMap[n.id]?.target_amount != null) {
            metaLines.push(`Target: ${formatAUD(moneyNeedMap[n.id].target_amount)}`);
          }

          if (n.need_type === "time") {
            const td = timeNeedMap[n.id] ?? null;
            const whenLabel = td ? formatShiftLineAU(td.start_datetime, td.end_datetime) : null;
            metaLines.push(whenLabel ? `Time: ${whenLabel}` : "Time: TBA");
          }

          return (
            <div key={n.id}>
              <NeedRow
                need={n}
                typeLabel={typeLabel}
                metaLines={metaLines}
                disabled={disabled}
                readOnly={readOnly}
                onEdit={openEdit}
                onDelete={handleDeleteNeed}
                onMoveUp={(need) => move(list, need, -1)}
                onMoveDown={(need) => move(list, need, +1)}
                isFirst={i === 0}
                isLast={i === list.length - 1}
              />

              {!readOnly && editOpen && editingNeed?.id === n.id && (
                <div className="needInlineEdit">
                  <EditNeedModal
                    open
                    variant="inline"
                    need={editingNeed}
                    disabled={disabled}
                    onClose={closeEdit}
                    onSaved={applyUpdatedBase}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="panel needsPanel">
      <div className="needsPanel__head">
        <h3 className="panel__title needsPanel__title">Needs</h3>

        {!readOnly && (
          <button
            type="button"
            className="miniBtn miniBtn--primary"
            onClick={() => setShowAdd(true)}
            disabled={disabled}
          >
            + Add need
          </button>
        )}
      </div>

      <p className="muted needsPanel__note">
        Add your Money/Time/Item needs. Keep them open while you work; collapse when you want a
        cleaner view.
      </p>

      {!readOnly && showAdd && (
        <AddNeedForm
          disabled={disabled}
          onCancel={() => setShowAdd(false)}
          onCreate={handleCreateNeed}
        />
      )}

      <div className="needsPanel__groups">
        <NeedAccordion title="Money needs" count={money.length} defaultOpen>
          {renderList(money, "money needs")}
        </NeedAccordion>

        <NeedAccordion title="Time needs" count={time.length} defaultOpen>
          {renderList(time, "time needs")}
        </NeedAccordion>

        <NeedAccordion title="Item needs" count={item.length} defaultOpen>
          {renderList(item, "item needs")}
        </NeedAccordion>
      </div>
    </div>
  );
}
