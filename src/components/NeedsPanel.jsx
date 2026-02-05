import { useMemo, useState } from "react";
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

function sortNeeds(arr) {
  return [...arr].sort((a, b) => {
    const sa = a.sort_order ?? 9999;
    const sb = b.sort_order ?? 9999;
    if (sa !== sb) return sa - sb;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

function NeedRow({
  need,
  disabled,
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
        {need.description ? (
          <div className="needRow__desc">{need.description}</div>
        ) : null}

        <div className="needRow__meta">
          <span className={`needPill needPill--status is-${need.status || "open"}`}>
            {need.status || "open"}
          </span>
          <span className={`needPill needPill--priority is-${need.priority || "medium"}`}>
            {need.priority || "medium"}
          </span>
        </div>
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

export default function NeedsPanel({
  fundraiserId,
  needs = [],
  disabled = false,
  onAddNeed,
  onEditNeed,
  onDeleteNeed,
  onReorderNeed,
}) {
  const [showAdd, setShowAdd] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState(null);

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

  // ✅ PUT-safe reorder: send full required base payload + changed sort_order
  const move = async (arr, need, dir) => {
    const idx = arr.findIndex((n) => n.id === need.id);
    if (idx < 0) return;

    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= arr.length) return;

    const a = arr[idx];
    const b = arr[nextIdx];

    const aSort = a.sort_order ?? idx + 1;
    const bSort = b.sort_order ?? nextIdx + 1;

    const putPayload = (n, newSort) => ({
      fundraiser: n.fundraiser,
      need_type: n.need_type,
      title: n.title ?? "",
      description: n.description ?? "",
      status: n.status ?? "open",
      priority: n.priority ?? "medium",
      sort_order: newSort,
    });

    try {
      const updatedA = await updateNeed(a.id, putPayload(a, bSort));
      const updatedB = await updateNeed(b.id, putPayload(b, aSort));

      onReorderNeed?.(updatedA, updatedB);
    } catch (err) {
      console.error("Reorder failed:", err);
      alert(err?.message ?? "Failed to reorder needs");
    }
  };

  async function handleCreateNeed(data) {
    try {
      // fundraiserId from useParams is often a string
      const fundraiserPk = Number(fundraiserId);

      const base = await createNeed(fundraiserPk, {
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
          comment: data.comment ?? "",
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
      }

      if (data.need_type === "time") {
        await createTimeNeed({
          need: base.id,
          start_datetime: new Date(data.start_datetime).toISOString(),
          end_datetime: new Date(data.end_datetime).toISOString(),
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
    } catch (err) {
      console.error("Delete need failed:", err);
      alert(err?.message ?? "Failed to delete need");
    }
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
    onCreate={async (data) => {
      console.log("[NeedsPanel] onCreate received:", data);
      return handleCreateNeed(data);
    }}
  />
)}


      <div className="needsPanel__groups">
        <NeedAccordion title="Money needs" count={money.length} defaultOpen>
          {money.length === 0 ? (
            <div className="needsEmpty">No money needs yet.</div>
          ) : (
            <div className="needsList">
              {money.map((n, i) => (
                <NeedRow
                  key={n.id}
                  need={n}
                  disabled={disabled}
                  onEdit={openEdit}
                  onDelete={handleDeleteNeed}
                  onMoveUp={(need) => move(money, need, -1)}
                  onMoveDown={(need) => move(money, need, +1)}
                  isFirst={i === 0}
                  isLast={i === money.length - 1}
                />
              ))}
            </div>
          )}
        </NeedAccordion>

        <NeedAccordion title="Time needs" count={time.length} defaultOpen>
          {time.length === 0 ? (
            <div className="needsEmpty">No time needs yet.</div>
          ) : (
            <div className="needsList">
              {time.map((n, i) => (
                <NeedRow
                  key={n.id}
                  need={n}
                  disabled={disabled}
                  onEdit={openEdit}
                  onDelete={handleDeleteNeed}
                  onMoveUp={(need) => move(time, need, -1)}
                  onMoveDown={(need) => move(time, need, +1)}
                  isFirst={i === 0}
                  isLast={i === time.length - 1}
                />
              ))}
            </div>
          )}
        </NeedAccordion>

        <NeedAccordion title="Item needs" count={item.length} defaultOpen>
          {item.length === 0 ? (
            <div className="needsEmpty">No item needs yet.</div>
          ) : (
            <div className="needsList">
              {item.map((n, i) => (
                <NeedRow
                  key={n.id}
                  need={n}
                  disabled={disabled}
                  onEdit={openEdit}
                  onDelete={handleDeleteNeed}
                  onMoveUp={(need) => move(item, need, -1)}
                  onMoveDown={(need) => move(item, need, +1)}
                  isFirst={i === 0}
                  isLast={i === item.length - 1}
                />
              ))}
            </div>
          )}
        </NeedAccordion>
      </div>

      <EditNeedModal open={editOpen} need={editingNeed} onClose={closeEdit} onSaved={applyUpdatedBase} />
    </div>
  );
}
