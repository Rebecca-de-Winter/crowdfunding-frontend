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

// ✅ Item detail fetcher (returns the item-need detail row for a base need id)
import getItemNeedByNeedId from "../api/get-item-need-by-need-id";

function safeLower(v) {
  return String(v ?? "").trim().toLowerCase();
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
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) {
  return (
    <div className="needRow">
      <div className="needRow__main">
        <div className="needRow__title">{need.title}</div>
        {need.description ? <div className="needRow__desc">{need.description}</div> : null}

        {/* ✅ unified pills (Type/Status/Priority) */}
        <NeedPills
          typeLabel={typeLabel}
          status={need.status ?? "open"}
          priority={need.priority ?? "medium"}
        />
      </div>

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
}) {
  const [showAdd, setShowAdd] = useState(false);

  // Inline editor state (single open at a time)
  const [editOpen, setEditOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState(null);

  // ✅ item need detail cache: { [needId]: detail|null }
  const [itemNeedMap, setItemNeedMap] = useState({});

  function openEdit(need) {
    setEditingNeed(need);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingNeed(null);
  }

  function applyUpdatedBase(updated) {
    onEditNeed?.(updated);
  }

  const grouped = useMemo(() => groupByType(needs), [needs]);
  const money = useMemo(() => sortNeeds(grouped.money), [grouped.money]);
  const time = useMemo(() => sortNeeds(grouped.time), [grouped.time]);
  const item = useMemo(() => sortNeeds(grouped.item), [grouped.item]);

  // ✅ load item detail rows for item needs (so we can show Type: Loan/Donation/Either)
  useEffect(() => {
    let alive = true;

    async function loadItemDetails() {
      if (item.length === 0) return;

      const ids = item.map((n) => n.id).filter(Boolean);
      const missing = ids.filter((id) => !(id in itemNeedMap));
      if (missing.length === 0) return;

      try {
        const pairs = await Promise.all(
          missing.map(async (needId) => {
            const detail = await getItemNeedByNeedId(needId);
            return [needId, detail ?? null];
          })
        );

        if (!alive) return;

        setItemNeedMap((prev) => {
          const next = { ...prev };
          for (const [needId, detail] of pairs) next[needId] = detail;
          return next;
        });
      } catch (err) {
        if (!alive) return;
        // if request fails, still mark missing as null so we don't refetch forever
        setItemNeedMap((prev) => {
          const next = { ...prev };
          for (const needId of missing) next[needId] = null;
          return next;
        });
        console.error("Failed to load item need details:", err);
      }
    }

    loadItemDetails();
    return () => {
      alive = false;
    };
  }, [item, itemNeedMap]);

  function makeOrderMap(list) {
    const map = {};
    list.forEach((n, i) => {
      map[n.id] = (i + 1) * 10; // 10,20,30...
    });
    return map;
  }

  async function move(arr, need, dir) {
    const idx = arr.findIndex((n) => n.id === need.id);
    if (idx < 0) return;

    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= arr.length) return;

    const swapped = [...arr];
    [swapped[idx], swapped[nextIdx]] = [swapped[nextIdx], swapped[idx]];

    const orderMap = makeOrderMap(swapped);

    // optimistic update
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
      // 1) Create base need
      const base = await createNeed(fundraiserId, {
        need_type: data.need_type,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
      });

      // 2) Create detail record (type-specific)
      if (data.need_type === "money") {
        await createMoneyNeed({
          need: base.id,
          target_amount: data.target_amount,
          comment: "",
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

        // ensure map refresh next render
        setItemNeedMap((prev) => {
          const next = { ...prev };
          delete next[base.id];
          return next;
        });
      }

      if (data.need_type === "time") {
  await createTimeNeed({
    need: base.id,
    start_datetime: data.start_datetime, // ✅ already "YYYY-MM-DDTHH:MM"
    end_datetime: data.end_datetime,     // ✅ already "YYYY-MM-DDTHH:MM"
    volunteers_needed: Number(data.volunteers_needed),
    role_title: data.role_title,
    location: data.location ?? "",
    reward_tier: null,
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

          return (
            <div key={n.id}>
              <NeedRow
                need={n}
                typeLabel={typeLabel}
                disabled={disabled}
                onEdit={openEdit}
                onDelete={handleDeleteNeed}
                onMoveUp={(need) => move(list, need, -1)}
                onMoveDown={(need) => move(list, need, +1)}
                isFirst={i === 0}
                isLast={i === list.length - 1}
              />

              {editOpen && editingNeed?.id === n.id && (
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

        <button
          type="button"
          className="miniBtn miniBtn--primary"
          onClick={() => setShowAdd(true)}
          disabled={disabled}
        >
          + Add need
        </button>
      </div>

      <p className="muted needsPanel__note">
        Add your Money/Time/Item needs. Keep them open while you work; collapse when you want a cleaner view.
      </p>

      {showAdd && (
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
