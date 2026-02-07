import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import useFundraiser from "../hooks/use-fundraiser";
import updateFundraiser from "../api/update-fundraiser";

import RewardTierList from "../components/RewardTierList";
import createRewardTier from "../api/create-reward-tier";
import updateRewardTier from "../api/update-reward-tier";
import deleteRewardTier from "../api/delete-reward-tier";
import RewardTypeDropdown from "../components/RewardTypeDropdown";

import NeedsPanel from "../components/NeedsPanel";

import getCurrentUser from "../api/get-current-user";
import getFundraiser from "../api/get-fundraiser";

import "./EditFestivalPage.css";

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

const emptyTier = {
  reward_type: "money",
  quantity_available: "",
  name: "",
  description: "",
  image_url: "",
  minimum_contribution: "",
};

export default function EditFestivalPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { fundraiser, isLoading, error } = useFundraiser(id);

  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [tiers, setTiers] = useState([]);
  const [showAddTier, setShowAddTier] = useState(false);
  const [newTier, setNewTier] = useState(emptyTier);
  const [tierBusy, setTierBusy] = useState(false);
  const [tierError, setTierError] = useState(null);

  const [needs, setNeeds] = useState([]);

  const isAuthed = Boolean(window.localStorage.getItem("token"));

  // Owner gate: logged-in users still shouldn't edit other people's fundraisers
  const [canEdit, setCanEdit] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);

  useEffect(() => {
  let cancelled = false;

  async function checkOwner() {
    try {
      if (!isAuthed) {
        if (!cancelled) {
          setCanEdit(false);
          setCheckingOwner(false);
        }
        return;
      }

      const me = await getCurrentUser();
      const fr = await getFundraiser(id);

      if (cancelled) return;

      if (me.id !== fr.owner) {
        navigate(`/fundraisers/${id}`, {
          replace: true,
          state: { flash: "You don’t have permission to edit this fundraiser." },
        });
        return;
      }

      setCanEdit(true);
    } catch {
      if (!cancelled) {
        navigate("/login", { replace: true });
      }
    } finally {
      if (!cancelled) {
        setCheckingOwner(false);
      }
    }
  }

  checkOwner();

  return () => {
    cancelled = true;
  };
}, [id, isAuthed, navigate]);


  /* =========================
     Initialise form from API
     ========================= */
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

    setTiers(fundraiser.reward_tiers ?? []);
    setNeeds(fundraiser.needs ?? []);
  }, [fundraiser]);

  const tierCount = useMemo(() => tiers.length, [tiers]);

  //  While we verify ownership, don't render the edit UI
  if (checkingOwner) return <p>Checking permissions…</p>;

  //  If not allowed (should already have redirected), show a safe fallback
  if (!canEdit) return <p>You don’t have permission to edit this fundraiser.</p>;

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>{error.message}</p>;
  if (!fundraiser || !form) return <p>Preparing form…</p>;

  /* =========================
     Handlers
     ========================= */
  function handleChange(event) {
    const { id: fieldId, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [fieldId]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event?.preventDefault?.();
    setSaveError(null);

    if (!isAuthed) {
      setSaveError("You must be logged in to save changes.");
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setSaveError("Title and description are required.");
      return;
    }

    setIsSaving(true);

    try {
      const updated = await updateFundraiser(id, {
        title: form.title,
        description: form.description,
        goal: form.goal === "" ? null : Number(form.goal),
        image_url: form.image_url,
        location: form.location,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        enable_rewards: form.enable_rewards,
      });

      navigate(`/fundraisers/${updated.id}`);
    } catch (err) {
      // Friendly permission message if backend blocks
      const msg = err?.message || "Could not save changes.";
      setSaveError(msg.includes("permission") ? "You don’t have permission to edit this fundraiser." : msg);
    } finally {
      setIsSaving(false);
    }
  }

  /* =========================
     Reward Tier actions
     ========================= */
  function openAddTier() {
    setTierError(null);
    setNewTier(emptyTier);
    setShowAddTier(true);
  }

  function cancelAddTier() {
    setTierError(null);
    setShowAddTier(false);
    setNewTier(emptyTier);
  }

  function handleNewTierField(e) {
    const { id: fieldId, value } = e.target;
    setNewTier((cur) => ({ ...cur, [fieldId]: value }));
  }

  function handleRewardTypeChange(value) {
    setNewTier((cur) => ({
      ...cur,
      reward_type: value,
      minimum_contribution: value === "money" ? cur.minimum_contribution : "",
    }));
  }

  async function handleCreateTier(e) {
    e?.preventDefault?.();
    setTierError(null);

    if (!isAuthed) {
      setTierError("Log in to add rewards.");
      return;
    }

    if (!newTier.name.trim() || !newTier.description.trim()) {
      setTierError("Name and description are required.");
      return;
    }

    if (newTier.reward_type === "money" && String(newTier.minimum_contribution).trim() === "") {
      setTierError("Minimum contribution is required for money rewards.");
      return;
    }

    setTierBusy(true);

    try {
      const payload = {
        reward_type: newTier.reward_type,
        quantity_available:
          newTier.quantity_available === "" ? null : Number(newTier.quantity_available),
        name: newTier.name,
        description: newTier.description,
        image_url: newTier.image_url || null,
        minimum_contribution:
          newTier.reward_type === "money" && String(newTier.minimum_contribution).trim() !== ""
            ? Number(newTier.minimum_contribution)
            : null,
      };

      const created = await createRewardTier(id, payload);

      setTiers((cur) => [created, ...cur]);
      setShowAddTier(false);
      setNewTier(emptyTier);
    } catch (err) {
      setTierError(err.message);
    } finally {
      setTierBusy(false);
    }
  }

  async function handleDeleteTier(tierId) {
    setTierError(null);

    if (!isAuthed) {
      setTierError("Log in to delete rewards.");
      return;
    }

    setTierBusy(true);
    try {
      await deleteRewardTier(tierId);
      setTiers((cur) => cur.filter((t) => t.id !== tierId));
    } catch (err) {
      setTierError(err.message);
    } finally {
      setTierBusy(false);
    }
  }

  async function handleUpdateTier(tierId, updates) {
    setTierError(null);

    if (!isAuthed) {
      setTierError("Log in to edit rewards.");
      return;
    }

    setTierBusy(true);
    try {
      const updated = await updateRewardTier(tierId, updates);
      setTiers((cur) => cur.map((t) => (t.id === tierId ? updated : t)));
    } catch (err) {
      setTierError(err.message);
    } finally {
      setTierBusy(false);
    }
  }

  return (
    <div className="editfundraiser">
      <Link className="editfundraiser__back" to={`/fundraisers/${id}`}>
        ← View fundraiser
      </Link>

      <div className="editfundraiser__form">
        {!isAuthed && (
          <div className="panel authBanner">
            <strong>You're not logged in.</strong>
            <span>Log in to save changes.</span>
          </div>
        )}

        <div className="editfundraiser__topGrid">
          <div className="editfundraiser__hero">
            <img
              className="editfundraiser__heroImg"
              src={form.image_url || "https://picsum.photos/1200/700"}
              alt={form.title}
            />
          </div>

          <aside className="editfundraiser__sidebarTop">
            <div className="panel">
              <div className="panel__row">
                <div className="panel__label">Goal (AUD)</div>
                <div className="panel__value">
                  <input
                    className="sidebarInput"
                    id="goal"
                    type="number"
                    value={form.goal}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="panel">
              <h3 className="panel__title">Festival settings</h3>

              <label className="sidebarLabel">Image URL</label>
              <input
                className="sidebarInput"
                id="image_url"
                value={form.image_url}
                onChange={handleChange}
              />

              <label className="sidebarLabel">Location</label>
              <input
                className="sidebarInput"
                id="location"
                value={form.location}
                onChange={handleChange}
              />

              <label className="sidebarLabel">Start date</label>
              <input
                className="sidebarInput"
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
              />

              <label className="sidebarLabel">End date</label>
              <input
                className="sidebarInput"
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
              />
            </div>
          </aside>
        </div>

        <div className="editfundraiser__belowGrid">
          <div className="storyCol">
            <div className="panel storyPanel">
              <label className="field__label field__label--title">Title</label>
              <input className="field__input" id="title" value={form.title} onChange={handleChange} />

              <label className="field__label">Story / Description</label>
              <textarea
                className="field__textarea storyPanel__textarea"
                id="description"
                value={form.description}
                onChange={handleChange}
              />

              <NeedsPanel
                fundraiserId={id}
                needs={needs}
                disabled={isSaving || tierBusy}
                onAddNeed={(created) => setNeeds((cur) => [created, ...cur])}
                onEditNeed={(updated) =>
                  setNeeds((cur) => cur.map((n) => (n.id === updated.id ? updated : n)))
                }
                onDeleteNeed={(deleted) => setNeeds((cur) => cur.filter((n) => n.id !== deleted.id))}
              />

              {saveError && <div className="form-alert">{saveError}</div>}

              <div className="editfundraiser__footer">
                <button
                  className="fundraiser-form__submit"
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving || !isAuthed}
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>

          <aside className="rightRewardsCol">
            <div className="panel enablePanel">
              <div className="enablePanel__head">
                <h3 className="panel__title enablePanel__title">Enable rewards</h3>
              </div>

              <div className="sidebarRow">
                <div className="blockBox">
                  <label className="toggle__label">
                    <span className="toggle__text">Enable rewards</span>

                    <input
                      id="enable_rewards"
                      type="checkbox"
                      checked={!!form.enable_rewards}
                      onChange={handleChange}
                      disabled={isSaving}
                    />

                    <span className="toggle__slider" aria-hidden="true" />
                  </label>
                </div>
              </div>

              <p className="muted enablePanel__note">
                {!form.enable_rewards
                  ? "Rewards are off. Turn this on to add reward tiers."
                  : "Rewards enabled — add/edit/delete reward tiers below."}
              </p>

              {form.enable_rewards && (
                <div className="rewardTierBox">
                  <div className="rewardTierBox__header">
                    <div className="rewardTierBox__left">
                      <h4 className="rewardTierBox__title">Reward tiers</h4>
                      <span className="rewardTierBox__count">{tierCount}</span>
                    </div>

                    <button
                      type="button"
                      className="miniBtn miniBtn--primary"
                      onClick={openAddTier}
                      disabled={isSaving || tierBusy || !isAuthed}
                    >
                      + Add reward
                    </button>
                  </div>

                  {showAddTier && (
                    <div className="tierAdd" role="region" aria-label="Add reward">
                      <div className="tierAdd__grid">
                        <div className="tierAdd__field">
                          <label className="tierAdd__label">Type</label>
                          <RewardTypeDropdown
                            value={newTier.reward_type}
                            onChange={handleRewardTypeChange}
                          />
                        </div>

                        <div className="tierAdd__field">
                          <label className="tierAdd__label">
                            Quantity available <span className="tierAdd__optional">(optional)</span>
                          </label>
                          <input
                            className="tierAdd__input"
                            id="quantity_available"
                            value={newTier.quantity_available}
                            onChange={handleNewTierField}
                            placeholder="e.g. 10"
                            inputMode="numeric"
                          />
                        </div>

                        <div className="tierAdd__field">
                          <label className="tierAdd__label">Name</label>
                          <input
                            className="tierAdd__input"
                            id="name"
                            value={newTier.name}
                            onChange={handleNewTierField}
                          />
                        </div>

                        <div className="tierAdd__field">
                          <label className="tierAdd__label">Description</label>
                          <textarea
                            className="tierAdd__textarea"
                            id="description"
                            value={newTier.description}
                            onChange={handleNewTierField}
                          />
                        </div>

                        <div className="tierAdd__field">
                          <label className="tierAdd__label">Image URL</label>
                          <input
                            className="tierAdd__input"
                            id="image_url"
                            value={newTier.image_url}
                            onChange={handleNewTierField}
                          />
                        </div>

                        {newTier.reward_type === "money" && (
                          <div className="tierAdd__field">
                            <label className="tierAdd__label">Minimum contribution</label>
                            <input
                              className="tierAdd__input"
                              id="minimum_contribution"
                              value={newTier.minimum_contribution}
                              onChange={handleNewTierField}
                              inputMode="decimal"
                              placeholder="e.g. 25"
                            />
                          </div>
                        )}

                        {tierError && <div className="tierAdd__error">{tierError}</div>}

                        <div className="tierAdd__actions">
                          <button
                            type="button"
                            className="rtBtn rtBtn--primary"
                            onClick={handleCreateTier}
                            disabled={tierBusy || !isAuthed}
                          >
                            {tierBusy ? "Adding…" : "Add reward"}
                          </button>

                          <button
                            type="button"
                            className="rtBtn rtBtn--secondary"
                            onClick={cancelAddTier}
                            disabled={tierBusy}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <RewardTierList
                    tiers={tiers}
                    disabled={tierBusy || isSaving}
                    onDeleteTier={handleDeleteTier}
                    onUpdateTier={handleUpdateTier}
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
