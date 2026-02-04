import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import useFundraiser from "../hooks/use-fundraiser";
import updateFundraiser from "../api/update-fundraiser";

import RewardTierList from "../components/RewardTierList";
import RewardTypeDropdown from "../components/RewardTypeDropdown";

import createRewardTier from "../api/create-reward-tier";
import updateRewardTier from "../api/update-reward-tier";
import deleteRewardTier from "../api/delete-reward-tier";

import "./EditFestivalPage.css";

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

const emptyNewTier = {
  reward_type: "money",
  name: "",
  description: "",
  image_url: "",
  minimum_contribution_value: "",
  max_backers: "",
};

export default function EditFestivalPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { fundraiser, isLoading, error } = useFundraiser(id);

  const [form, setForm] = useState(null);
  const [tiers, setTiers] = useState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [isAddingReward, setIsAddingReward] = useState(false);
  const [newTier, setNewTier] = useState(emptyNewTier);

  const isAuthed = Boolean(window.localStorage.getItem("token"));

  /* =========================
     Initialise form + tiers
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
  }, [fundraiser]);

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>{error.message}</p>;
  if (!fundraiser || !form) return <p>Preparing form…</p>;

  /* =========================
     Handlers (fundraiser)
     ========================= */
  function handleChange(event) {
    const { id: fieldId, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [fieldId]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
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
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  /* =========================
     Reward Tier CRUD
     ========================= */
  async function handleCreateTier() {
    setSaveError(null);

    if (!isAuthed) {
      setSaveError("You must be logged in to add reward tiers.");
      return;
    }

    if (!newTier.name.trim()) {
      setSaveError("Reward name is required.");
      return;
    }

    const payload = {
      fundraiser: Number(id),
      reward_type: newTier.reward_type,
      name: newTier.name.trim(),
      description: newTier.description ?? "",
      image_url: newTier.image_url ?? "",
      max_backers: newTier.max_backers === "" ? null : Number(newTier.max_backers),
      minimum_contribution_value:
        newTier.reward_type === "money" && newTier.minimum_contribution_value !== ""
          ? Number(newTier.minimum_contribution_value)
          : null,
    };

    setIsSaving(true);
    try {
      const created = await createRewardTier(payload);
      setTiers((prev) => [created, ...prev]);
      setNewTier(emptyNewTier);
      setIsAddingReward(false);
    } catch (e) {
      setSaveError(e?.message ?? "Could not add reward tier.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateTier(tierId, payload) {
    setSaveError(null);
    setIsSaving(true);
    try {
      const updated = await updateRewardTier(tierId, payload);
      setTiers((prev) => prev.map((t) => (t.id === tierId ? updated : t)));
      return updated;
    } catch (e) {
      setSaveError(e?.message ?? "Could not update reward tier.");
      throw e;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTier(tierId) {
    setSaveError(null);
    setIsSaving(true);
    try {
      await deleteRewardTier(tierId);
      setTiers((prev) => prev.filter((t) => t.id !== tierId));
    } catch (e) {
      setSaveError(e?.message ?? "Could not delete reward tier.");
      throw e;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="editfundraiser">
      <Link className="editfundraiser__back" to={`/fundraisers/${id}`}>
        ← View fundraiser
      </Link>

      <form className="editfundraiser__form" onSubmit={handleSubmit}>
        {!isAuthed && (
          <div className="panel authBanner">
            <strong>You&apos;re not logged in.</strong>
            <span>Log in to save changes.</span>
          </div>
        )}

        {/* TOP GRID */}
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

        {/* BELOW GRID */}
        <div className="editfundraiser__belowGrid">
          {/* STORY */}
          <div className="storyCol">
            <div className="panel storyPanel">
              <label className="field__label">Title</label>
              <input
                className="field__input"
                id="title"
                value={form.title}
                onChange={handleChange}
              />

              <label className="field__label">Story / Description</label>
              <textarea
                className="field__textarea storyPanel__textarea"
                id="description"
                value={form.description}
                onChange={handleChange}
              />

              {saveError && <div className="form-alert">{saveError}</div>}

              <div className="editfundraiser__footer">
                <button
                  className="fundraiser-form__submit"
                  type="submit"
                  disabled={isSaving || !isAuthed}
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>

          {/* REWARDS */}
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
                      <span className="rewardTierBox__count">{tiers.length}</span>
                    </div>

                    <button
                      type="button"
                      className="miniBtn miniBtn--primary"
                      onClick={() => setIsAddingReward((v) => !v)}
                      disabled={isSaving || !isAuthed}
                    >
                      + Add reward
                    </button>
                  </div>

                  {isAddingReward && (
                    <div className="tierAdd">
                      <div className="tierAdd__grid">
                        <div className="rtForm__field">
                          <div className="rtForm__label">Type</div>
                          <RewardTypeDropdown
                            value={newTier.reward_type}
                            onChange={(val) => setNewTier((t) => ({ ...t, reward_type: val }))}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="rtForm__field">
                          <div className="rtForm__label rtForm__label--small">
                            Quantity available (optional)
                          </div>
                          <input
                            className="rtInput rtInput--sm"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="e.g. 10"
                            value={newTier.max_backers}
                            onChange={(e) =>
                              setNewTier((t) => ({ ...t, max_backers: e.target.value }))
                            }
                            disabled={isSaving}
                          />
                        </div>

                        <div className="rtForm__field">
                          <div className="rtForm__label">Name</div>
                          <input
                            className="rtInput rtInput--sm"
                            value={newTier.name}
                            onChange={(e) => setNewTier((t) => ({ ...t, name: e.target.value }))}
                            disabled={isSaving}
                          />
                        </div>

                        <div className="rtForm__field">
                          <div className="rtForm__label">Description</div>
                          <textarea
                            className="rtTextarea rtTextarea--sm"
                            rows={3}
                            value={newTier.description}
                            onChange={(e) =>
                              setNewTier((t) => ({ ...t, description: e.target.value }))
                            }
                            disabled={isSaving}
                          />
                        </div>

                        <div className="rtForm__field">
                          <div className="rtForm__label">Image URL</div>
                          <input
                            className="rtInput rtInput--sm"
                            value={newTier.image_url}
                            onChange={(e) =>
                              setNewTier((t) => ({ ...t, image_url: e.target.value }))
                            }
                            disabled={isSaving}
                          />
                        </div>

                        {newTier.reward_type === "money" && (
                          <div className="rtForm__field">
                            <div className="rtForm__label">Minimum contribution</div>
                            <input
                              className="rtInput rtInput--sm"
                              type="number"
                              min="0"
                              step="1"
                              value={newTier.minimum_contribution_value}
                              onChange={(e) =>
                                setNewTier((t) => ({
                                  ...t,
                                  minimum_contribution_value: e.target.value,
                                }))
                              }
                              disabled={isSaving}
                            />
                          </div>
                        )}
                      </div>

                      <div className="tierAdd__actions">
                        <button
                          type="button"
                          className="miniBtn miniBtn--primary"
                          onClick={handleCreateTier}
                          disabled={isSaving || !isAuthed}
                        >
                          Add reward
                        </button>

                        <button
                          type="button"
                          className="miniBtn"
                          onClick={() => {
                            setIsAddingReward(false);
                            setNewTier(emptyNewTier);
                          }}
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <RewardTierList
                    tiers={tiers}
                    disabled={isSaving}
                    onDeleteTier={handleDeleteTier}
                    onUpdateTier={handleUpdateTier}
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
