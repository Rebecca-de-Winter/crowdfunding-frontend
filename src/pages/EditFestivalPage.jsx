import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useFundraiser from "../hooks/use-fundraiser";
import updateFundraiser from "../api/update-fundraiser";
import StatusDropdown from "../components/StatusDropdown";
import "./EditFestivalPage.css";

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function EditFestivalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fundraiser, isLoading, error } = useFundraiser(id);

  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const isAuthed = Boolean(window.localStorage.getItem("token"));

  useEffect(() => {
    if (!fundraiser) return;

    setForm({
      title: fundraiser.title ?? "",
      description: fundraiser.description ?? "",
      goal: fundraiser.goal ?? "",
      image_url: fundraiser.image_url ?? "",
      location: fundraiser.location ?? "",
      start_date: toDateInputValue(fundraiser.start_date),
      end_date: toDateInputValue(fundraiser.end_date),
      status: fundraiser.status ?? "draft",
      enable_rewards: Boolean(fundraiser.enable_rewards),
    });
  }, [fundraiser]);

  const handleChange = (event) => {
    const { id: fieldId, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [fieldId]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStatusChange = (newStatus) => {
    setForm((prev) => ({ ...prev, status: newStatus }));
  };

  const buildUpdates = () => ({
    title: form.title,
    description: form.description,
    goal: form.goal === "" ? null : Number(form.goal),
    image_url: form.image_url,
    location: form.location,
    start_date: form.start_date === "" ? null : form.start_date,
    end_date: form.end_date === "" ? null : form.end_date,
    status: form.status,
    enable_rewards: Boolean(form.enable_rewards),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError(null);

    const tokenNow = window.localStorage.getItem("token");
    if (!tokenNow) {
      setSaveError("You must be logged in to save changes.");
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setSaveError("Title and description are required.");
      return;
    }

    if (form.goal === "" || Number.isNaN(Number(form.goal))) {
      setSaveError("Goal is required and must be a number.");
      return;
    }

    setIsSaving(true);
    try {
      const updates = buildUpdates();
      const updated = await updateFundraiser(id, updates);
      navigate(`/fundraisers/${updated.id}`);
    } catch (err) {
      setSaveError(err?.message ?? "Could not save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>{error.message}</p>;
  if (!fundraiser) return <p>Fundraiser not found.</p>;
  if (!form) return <p>Preparing form…</p>;

  const needs = fundraiser.needs || [];
  const moneyNeeds = needs.filter((n) => n.need_type === "money");
  const timeNeeds = needs.filter((n) => n.need_type === "time");
  const itemNeeds = needs.filter((n) => n.need_type === "item");

  const heroImg = form.image_url || "https://picsum.photos/1200/700";

  return (
    <div className="editfundraiser">
      <Link className="editfundraiser__back" to={`/fundraisers/${id}`}>
        ← View fundraiser
      </Link>

      <form onSubmit={handleSubmit} className="editfundraiser__form">
        {/* ✅ AUTH BANNER: outside the grid so it never ruins alignment */}
        {!isAuthed && (
          <div className="panel authBanner" role="status" aria-live="polite">
            <strong>You're not logged in.</strong>
            <span>Log in to save changes to this festival.</span>
          </div>
        )}

        {/* TOP GRID */}
        <div className="editfundraiser__topGrid">
          {/* LEFT: HERO */}
          <div className="editfundraiser__hero">
            <img
              className="editfundraiser__heroImg"
              src={heroImg}
              alt={form.title || "Festival"}
            />
          </div>

          {/* RIGHT: GOAL + SETTINGS */}
          <aside className="editfundraiser__sidebarTop">
            <div className="panel">
              <div className="panel__row">
                <div className="panel__label">Goal (AUD)</div>
                <div className="panel__value">
                  <input
                    className="sidebarInput"
                    id="goal"
                    type="number"
                    min="0"
                    step="1"
                    value={form.goal}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            <div className="panel">
              <h3 className="panel__title">Festival settings</h3>

              <div className="sidebarField">
                <div className="sidebarLabel">Image URL</div>
                <input
                  className="sidebarInput"
                  id="image_url"
                  type="text"
                  value={form.image_url}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>

              <div className="sidebarField">
                <div className="sidebarLabel">Location</div>
                <input
                  className="sidebarInput"
                  id="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>

              <div className="sidebarField">
                <div className="sidebarLabel">Start date</div>
                <input
                  className="sidebarInput"
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>

              <div className="sidebarField">
                <div className="sidebarLabel">End date</div>
                <input
                  className="sidebarInput"
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>

              <div className="sidebarField">
                <div className="sidebarLabel">Status</div>
                <div className="blockBox">
                  <StatusDropdown
                    value={form.status}
                    onChange={handleStatusChange}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* BELOW GRID */}
        <div className="editfundraiser__belowGrid">
          {/* LEFT: STORY + SAVE */}
          <div className="storyCol">
            <div className="panel storyPanel">
              <div className="field field--full">
                <label className="field__label" htmlFor="title">
                  Title
                </label>
                <input
                  className="field__input"
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>

              <div className="field field--full storyField">
                <label className="field__label" htmlFor="description">
                  Story / Description
                </label>
                <textarea
                  className="field__textarea storyPanel__textarea"
                  id="description"
                  value={form.description}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </div>

              {saveError && <div className="form-alert">{saveError}</div>}

              <div className="editfundraiser__footer">
                <button
                  type="submit"
                  className="fundraiser-form__submit"
                  disabled={!isAuthed || isSaving}
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>

                {!isAuthed && (
                  <p className="field__hint">Login required — saving is disabled.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: ENABLE REWARDS */}
          <aside className="rightLowerCol">
            <div className="panel enablePanel">
              <h3 className="panel__title">Enable rewards</h3>

              <div className="sidebarRow">
                <div className="blockBox">
                  <label className="toggle__label">
                    <span className="toggle__text">Enable rewards</span>
                    <input
                      id="enable_rewards"
                      type="checkbox"
                      checked={form.enable_rewards}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                    <span className="toggle__slider" aria-hidden="true" />
                  </label>
                </div>
              </div>

              <p className="muted enablePanel__note">
                {!form.enable_rewards
                  ? "Rewards are off. Turn this on if you want to offer reward tiers."
                  : "Rewards enabled — next step is adding reward tiers here (we'll wire this next)."}
              </p>
            </div>
          </aside>

          {/* NEEDS HEADER spans both columns */}
          <div className="editfundraiser__needsHeaderSpan">
            <div className="sectionHeader">
              <h2 className="sectionHeader__title">What this fundraiser needs</h2>
              <p className="sectionHeader__sub">
                One per type for now (Money / Time / Items).
              </p>
            </div>
          </div>

          {/* LEFT: NEEDS STACK */}
          <div className="needsCol">
            <div className="needsStack">
              <NeedCard
                title="Money"
                count={moneyNeeds.length}
                needs={moneyNeeds}
                onAdd={() => console.log("Add money need")}
                onEdit={(needId) => console.log("Edit money need", needId)}
                onDelete={(needId) => console.log("Delete money need", needId)}
              />
              <NeedCard
                title="Time"
                count={timeNeeds.length}
                needs={timeNeeds}
                onAdd={() => console.log("Add time need")}
                onEdit={(needId) => console.log("Edit time need", needId)}
                onDelete={(needId) => console.log("Delete time need", needId)}
              />
              <NeedCard
                title="Items"
                count={itemNeeds.length}
                needs={itemNeeds}
                onAdd={() => console.log("Add item need")}
                onEdit={(needId) => console.log("Edit item need", needId)}
                onDelete={(needId) => console.log("Delete item need", needId)}
              />
            </div>
          </div>

          {/* RIGHT: REWARDS */}
          <aside className="rightRewardsCol">
            <div className="panel">
              <h3 className="panel__title">Rewards</h3>
              <p className="muted">We'll build this list + add/edit/delete next (with images later).</p>
            </div>

            <div className="edit-linksRow">
              <Link to="/fundraisers">Back to list</Link>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

/** Small reusable card for stacked needs (summary + actions) */
function NeedCard({ title, count, needs, onAdd, onEdit, onDelete }) {
  const hasOne = needs.length > 0;
  const n = hasOne ? needs[0] : null;

  return (
    <div className="needsCard">
      <div className="needsCard__header">
        <div className="needsCard__titleRow">
          <h3 className="needsCard__title">{title}</h3>
          <span className="needs__count">{count}</span>
        </div>

        <div className="needsCard__actions">
          {!hasOne ? (
            <button type="button" className="miniBtn" onClick={onAdd}>
              + Add
            </button>
          ) : (
            <>
              <button type="button" className="miniBtn" onClick={() => onEdit(n.id)}>
                Edit
              </button>
              <button
                type="button"
                className="miniBtn miniBtn--danger"
                onClick={() => onDelete(n.id)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {!hasOne ? (
        <p className="needs__empty">No {title.toLowerCase()} need yet.</p>
      ) : (
        <div className="needSummary">
          <div className="needItem__top">
            <div className="needItem__name">{n.title}</div>
            <span className={`badge badge--${n.status}`}>{n.status}</span>
          </div>

          {n.description ? <p className="needItem__desc">{n.description}</p> : null}

          <div className="needItem__meta">
            <span className={`badge badge--priority-${n.priority}`}>{n.priority}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditFestivalPage;
