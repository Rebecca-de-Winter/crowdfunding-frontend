import { useMemo, useState } from "react";
import "./NeedsPanel.css";

import AddNeedForm from "./AddNeedForm";
import createNeed from "../api/create-need";

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

function NeedRow({ need, disabled, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="needRow">
      <div className="needRow__main">
        <div className="needRow__title">{need.title}</div>
        {need.description ? <div className="needRow__desc">{need.description}</div> : null}

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
  fundraiserId, // ✅ REQUIRED (string or number)
  needs = [],
  disabled = false,
  onAddNeed,     // (createdNeed) => void
  onEditNeed,
  onDeleteNeed,
  onReorderNeed,
}) {
  const [showAdd, setShowAdd] = useState(false);

  const grouped = useMemo(() => groupByType(needs), [needs]);

  const money = useMemo(() => sortNeeds(grouped.money), [grouped.money]);
  const time = useMemo(() => sortNeeds(grouped.time), [grouped.time]);
  const item = useMemo(() => sortNeeds(grouped.item), [grouped.item]);

  const move = (arr, need, dir) => {
    const idx = arr.findIndex((n) => n.id === need.id);
    if (idx < 0) return;

    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= arr.length) return;

    const a = arr[idx];
    const b = arr[nextIdx];

    const aSort = a.sort_order ?? idx + 1;
    const bSort = b.sort_order ?? nextIdx + 1;

    onReorderNeed?.(a, b, aSort, bSort);
  };

  async function handleCreateNeed(data) {
    // data comes from AddNeedForm: { need_type, title, description, status, priority }
    const created = await createNeed(fundraiserId, {
      need_type: data.need_type,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      // sort_order: optional (backend can assign). Add later if you want.
    });

    onAddNeed?.(created);
    setShowAdd(false);
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
          {money.length === 0 ? (
            <div className="needsEmpty">No money needs yet.</div>
          ) : (
            <div className="needsList">
              {money.map((n, i) => (
                <NeedRow
                  key={n.id}
                  need={n}
                  disabled={disabled}
                  onEdit={onEditNeed}
                  onDelete={onDeleteNeed}
                  onMoveUp={() => move(money, n, -1)}
                  onMoveDown={() => move(money, n, +1)}
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
                  onEdit={onEditNeed}
                  onDelete={onDeleteNeed}
                  onMoveUp={() => move(time, n, -1)}
                  onMoveDown={() => move(time, n, +1)}
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
                  onEdit={onEditNeed}
                  onDelete={onDeleteNeed}
                  onMoveUp={() => move(item, n, -1)}
                  onMoveDown={() => move(item, n, +1)}
                  isFirst={i === 0}
                  isLast={i === item.length - 1}
                />
              ))}
            </div>
          )}
        </NeedAccordion>
      </div>
    </div>
  );
}

