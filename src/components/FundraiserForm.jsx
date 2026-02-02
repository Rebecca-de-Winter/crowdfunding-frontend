import { useState } from "react";
import "./FundraiserForm.css";
import StatusDropdown from "./StatusDropdown";

/**
 * Reusable form:
 * - does NOT call APIs itself
 * - does NOT navigate
 * - collects user input
 * - validates required fields (blank creation flow)
 * - calls `onSubmit(...)` with the long argument list
 */
function FundraiserForm({ onSubmit, isSaving = false }) {
  const [fundraiser, setFundraiser] = useState({
    title: "",
    description: "",
    goal: "",
    image_url: "",
    location: "",
    start_date: "",
    end_date: "",
    status: "draft",
    enable_rewards: false,
    sort_order: 0,
  });

  const [formError, setFormError] = useState(null);

  const handleChange = (event) => {
    const { id, value, type, checked } = event.target;

    setFundraiser((prev) => ({
      ...prev,
      [id]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    // Required fields for "blank create"
    if (
      !fundraiser.title ||
      !fundraiser.description ||
      fundraiser.goal === "" ||
      !fundraiser.location ||
      !fundraiser.start_date ||
      !fundraiser.end_date
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (typeof onSubmit === "function") {
      await onSubmit(
        fundraiser.title,
        fundraiser.description,
        Number(fundraiser.goal),
        fundraiser.image_url,
        fundraiser.location,
        fundraiser.start_date,
        fundraiser.end_date,
        fundraiser.status,
        fundraiser.enable_rewards,
        Number(fundraiser.sort_order)
      );
    } else {
      console.warn("FundraiserForm: onSubmit prop not provided");
    }
  };

  return (
    <form className="fundraiser-form" onSubmit={handleSubmit}>
      <header className="fundraiser-form__header">
        <h2 className="fundraiser-form__title">Start a new festival</h2>
        <p className="fundraiser-form__subtitle">
          Create your fundraiser details first — then add money, time, and item needs.
        </p>
      </header>

      {formError && <p className="fundraiser-form__error">{formError}</p>}

      <div className="fundraiser-form__grid">
        {/* Title */}
        <div className="field field--full">
          <label className="field__label" htmlFor="title">
            Festival name <span className="req">*</span>
          </label>
          <input
            className="field__input"
            type="text"
            id="title"
            placeholder="e.g. Becky’s Backyard BBQ"
            value={fundraiser.title}
            onChange={handleChange}
            disabled={isSaving}
          />
        </div>

        {/* Description */}
        <div className="field field--full">
          <label className="field__label" htmlFor="description">
            Description <span className="req">*</span>
          </label>
          <textarea
            className="field__textarea"
            id="description"
            placeholder="Short and magical: what are you raising money/time/items for?"
            value={fundraiser.description}
            onChange={handleChange}
            disabled={isSaving}
          />
          <div className="field__hint">Tip: 1–3 sentences is perfect.</div>
        </div>

        {/* Goal */}
        <div className="field">
          <label className="field__label" htmlFor="goal">
            Goal (AUD) <span className="req">*</span>
          </label>
          <input
            className="field__input"
            type="number"
            id="goal"
            placeholder="2500"
            value={fundraiser.goal}
            onChange={handleChange}
            min="0"
            disabled={isSaving}
          />
        </div>

        {/* Location */}
        <div className="field">
          <label className="field__label" htmlFor="location">
            Location <span className="req">*</span>
          </label>
          <input
            className="field__input"
            type="text"
            id="location"
            placeholder="e.g. West End, Brisbane"
            value={fundraiser.location}
            onChange={handleChange}
            disabled={isSaving}
          />
        </div>

        {/* Dates */}
        <div className="field">
          <label className="field__label" htmlFor="start_date">
            Start date <span className="req">*</span>
          </label>
          <input
            className="field__input"
            type="date"
            id="start_date"
            value={fundraiser.start_date}
            onChange={handleChange}
            disabled={isSaving}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="end_date">
            End date <span className="req">*</span>
          </label>
          <input
            className="field__input"
            type="date"
            id="end_date"
            value={fundraiser.end_date}
            onChange={handleChange}
            disabled={isSaving}
          />
        </div>

        {/* Image */}
        <div className="field field--full">
          <label className="field__label" htmlFor="image_url">
            Image URL <span className="muted">(optional)</span>
          </label>
          <input
            className="field__input"
            type="text"
            id="image_url"
            placeholder="https://…"
            value={fundraiser.image_url}
            onChange={handleChange}
            disabled={isSaving}
          />
          <div className="field__hint">
            If left blank, we’ll show a nice default image.
          </div>
        </div>

        {/* Status */}
        <div className="field">
          <label className="field__label" htmlFor="status">
            Status
          </label>
          <StatusDropdown
  value={fundraiser.status}
  disabled={isSaving}
  onChange={(val) =>
    setFundraiser((prev) => ({
      ...prev,
      status: val,
    }))
  }
/>
        </div>

        {/* Sort Order */}
        <div className="field">
          <label className="field__label" htmlFor="sort_order">
            Importance
          </label>
          <input
            className="field__input"
            type="number"
            id="sort_order"
            placeholder="0"
            value={fundraiser.sort_order}
            onChange={handleChange}
            min="0"
            disabled={isSaving}
          />
          <div className="field__hint">0 = highest priority.</div>
        </div>

        {/* Rewards toggle */}
        <div className="field field--full toggle">
          <label className="toggle__label" htmlFor="enable_rewards">
            <span className="toggle__text">
              Enable rewards <span className="muted">(optional)</span>
            </span>
            <input
              type="checkbox"
              id="enable_rewards"
              checked={fundraiser.enable_rewards}
              onChange={handleChange}
              disabled={isSaving}
            />
            <span className="toggle__slider" aria-hidden="true" />
          </label>
        </div>
      </div>

      <footer className="fundraiser-form__footer">
        <button className="fundraiser-form__submit" type="submit" disabled={isSaving}>
          {isSaving ? "Creating…" : "Create Festival"}
        </button>
      </footer>
    </form>
  );
}

export default FundraiserForm;
