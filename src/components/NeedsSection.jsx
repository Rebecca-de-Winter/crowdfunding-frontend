import { useMemo, useState } from "react";
import NeedModal from "./NeedModal";
import "./NeedsSection.css";

/**
 * props:
 * - fundraiserId (number/string)
 * - needs (array of BASE needs returned in fundraiser payload OR fetched separately)
 * - moneyNeedsByNeedId (object map) { [needId]: moneyNeed }
 * - itemNeedsByNeedId (object map) { [needId]: itemNeed }
 * - timeNeedsByNeedId (object map) { [needId]: timeNeed }
 *
 * - onCreateNeed(need_type, payload) -> creates base + type detail
 * - onUpdateNeed(needId, need_type, payload) -> updates base + type detail
 * - onDeleteNeed(needId, need_type) -> deletes (detail then base usually)
 */
export default function NeedsSection({
  fundraiserId,
  needs = [],
  moneyNeedsByNeedId = {},
  itemNeedsByNeedId = {},
  timeNeedsByNeedId = {},
  onCreateNeed,
  onUpdateNeed,
  onDeleteNeed,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeType, setActiveType] = useState(null); // "money" | "time" | "item"
  const [editingNeedId, setEditingNeedId] = useState(null);

  const needsByType = useMemo(() => {
    const out = { money: null, time: null, item: null };
    for (const n of needs) {
      if (n.need_type === "money") out.money = n;
      if (n.need_type === "time") out.time = n;
      if (n.need_type === "item") out.item = n;
    }
    return out;
  }, [needs]);

  const joined = useMemo(() => {
    const joinOne = (base) => {
      if (!base) return null;
      const id = base.id;
      return {
        base,
        money: moneyNeedsByNeedId[id] ?? null,
        item: itemNeedsByNeedId[id] ?? null,
        time: timeNeedsByNeedId[id] ?? null,
      };
    };
    return {
      money: joinOne(needsByType.money),
      time: joinOne(needsByType.time),
      item: joinOne(needsByType.item),
    };
  }, [needsByType, moneyNeedsByNeedId, itemNeedsByNeedId, timeNeedsByNeedId]);

  const openAdd = (type) => {
    setActiveType(type);
    setEditingNeedId(null);
    setModalOpen(true);
  };

  const openEdit = (type, needId) => {
    setActiveType(type);
    setEditingNeedId(needId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveType(null);
    setEditingNeedId(null);
  };

  const handleDelete = async (type, needId) => {
    if (!confirm("Delete this need?")) return;
    await onDeleteNeed?.(needId, type);
  };

  const prettyType = (t) => (t === "money" ? "Money" : t === "time" ? "Time" : "Items");

  return (
    <section className="needs">
      <div className="needs__header">
        <h2 className="needs__title">What this fundraiser needs</h2>
        <p className="needs__sub">Add one need per type for now (Money / Time / Items).</p>
      </div>

      <div className="needs__grid">
        {["money", "time", "item"].map((type) => {
          const data = joined[type];
          const has = Boolean(data?.base);

          return (
            <div key={type} className="need-card">
              <div className="need-card__top">
                <div className="need-card__type">{prettyType(type)}</div>

                <div className="need-card__actions">
                  {has ? (
                    <>
                      <button
                        type="button"
                        className="need-card__btn"
                        onClick={() => openEdit(type, data.base.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="need-card__btn danger"
                        onClick={() => handleDelete(type, data.base.id)}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="need-card__btn primary"
                      onClick={() => openAdd(type)}
                    >
                      Add {prettyType(type)} need
                    </button>
                  )}
                </div>
              </div>

              {has ? (
                <NeedSummary type={type} data={data} />
              ) : (
                <div className="need-card__empty">
                  No {prettyType(type).toLowerCase()} need yet.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <NeedModal
          fundraiserId={fundraiserId}
          type={activeType}
          joinedNeed={joined[activeType]} // null when adding
          editingNeedId={editingNeedId}
          onClose={closeModal}
          onCreate={onCreateNeed}
          onUpdate={onUpdateNeed}
        />
      )}
    </section>
  );
}

function NeedSummary({ type, data }) {
  const { base, money, item, time } = data;

  return (
    <div className="need-card__body">
      <div className="need-card__name">{base.title}</div>
      {base.description && <div className="need-card__desc">{base.description}</div>}

      <div className="need-card__meta">
        <span className={`pill ${base.status}`}>{base.status}</span>
        <span className={`pill pri-${base.priority}`}>{base.priority}</span>
      </div>

      {type === "money" && money && (
        <div className="need-card__detail">
          <div><strong>Target:</strong> ${money.target_amount}</div>
          {money.comment && <div className="muted">{money.comment}</div>}
        </div>
      )}

      {type === "item" && item && (
        <div className="need-card__detail">
          <div><strong>Item:</strong> {item.item_name}</div>
          <div><strong>Qty:</strong> {item.quantity_needed}</div>
          <div><strong>Mode:</strong> {item.mode}</div>
          {item.notes && <div className="muted">{item.notes}</div>}
        </div>
      )}

      {type === "time" && time && (
        <div className="need-card__detail">
          <div><strong>Role:</strong> {time.role_title}</div>
          <div><strong>Volunteers:</strong> {time.volunteers_needed}</div>
          <div className="muted">{time.location}</div>
        </div>
      )}
    </div>
  );
}
