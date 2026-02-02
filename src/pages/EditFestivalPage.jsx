import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useFundraiser from "../hooks/use-fundraiser";
import updateFundraiser from "../api/update-fundraiser";

/**
 * Edit page:
 * - Loads fundraiser via useFundraiser(id)
 * - Copies fundraiser into local form state (so inputs can change)
 * - PUTs the fundraiser on save
 */
function EditFestivalPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { fundraiser, isLoading, error } = useFundraiser(id);

  const [form, setForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const tokenExists = Boolean(window.localStorage.getItem("token"));

  /**
   * When fundraiser loads, copy its values into editable form state.
   * This is the classic "controlled inputs" pattern.
   */
  useEffect(() => {
    if (!fundraiser) return;

    setForm({
      title: fundraiser.title ?? "",
      description: fundraiser.description ?? "",
      goal: fundraiser.goal ?? "", // might be "2500.00" or number; we keep it as string-ish for inputs
      image_url: fundraiser.image_url ?? "",
      location: fundraiser.location ?? "",
      start_date: fundraiser.start_date ?? "", // keep as "" for empty date input
      end_date: fundraiser.end_date ?? "",
      status: fundraiser.status ?? "draft",
      enable_rewards: Boolean(fundraiser.enable_rewards),
      sort_order: fundraiser.sort_order ?? 0,
    });
  }, [fundraiser]);

  const handleChange = (event) => {
    const { id, value, type, checked } = event.target;

    setForm((prev) => ({
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

  /**
   * Convert form state into PUT updates.
   * Key detail: Dates should be null if left blank.
   */
  const buildUpdates = () => {
    return {
      title: form.title,
      description: form.description,
      goal: form.goal === "" ? null : Number(form.goal), // goal is required in your model, so you may choose to block null
      image_url: form.image_url,
      location: form.location,

      // if user leaves date empty, send null (your model supports null)
      start_date: form.start_date === "" ? null : form.start_date,
      end_date: form.end_date === "" ? null : form.end_date,

      status: form.status,
      enable_rewards: form.enable_rewards,
      sort_order: form.sort_order === "" ? 0 : Number(form.sort_order),
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError(null);

    if (!tokenExists) {
      setSaveError("You must be logged in to edit a fundraiser.");
      return;
    }

    // Basic validation (keep it light)
    if (!form.title || !form.description) {
      setSaveError("Title and description are required.");
      return;
    }

    // Goal is required by your Fundraiser model (DecimalField, no null=True)
    if (form.goal === "" || Number.isNaN(Number(form.goal))) {
      setSaveError("Goal is required and must be a number.");
      return;
    }

    setIsSaving(true);

    try {
      const updates = buildUpdates();
      const updated = await updateFundraiser(id, updates);

      // Option A: stay on edit page, but show success by navigating to detail
      navigate(`/fundraisers/${updated.id}`);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>{error.message}</p>;
  if (!fundraiser) return <p>Fundraiser not found.</p>;
  if (!form) return <p>Preparing form…</p>;

  return (
    <div style={{ padding: 16, maxWidth: 800 }}>
      <h1>Edit Festival</h1>

      <div style={{ marginBottom: 12 }}>
        <Link to={`/fundraisers/${id}`}>← View fundraiser</Link>{" "}
        <span style={{ margin: "0 8px" }}>|</span>
        <Link to="/fundraisers">Back to list</Link>
      </div>

      {!tokenExists && (
        <p style={{ marginTop: 8 }}>
          You are not logged in — editing will not work until you log in.
        </p>
      )}

      {saveError && <p style={{ marginTop: 8 }}>{saveError}</p>}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            disabled={isSaving}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={handleChange}
            disabled={isSaving}
            style={{ width: "100%", minHeight: 100 }}
          />
        </div>

        <div>
          <label htmlFor="goal">Goal (AUD)</label>
          <input
            id="goal"
            type="number"
            min="0"
            step="1"
            value={form.goal}
            onChange={handleChange}
            disabled={isSaving}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="image_url">Image URL</label>
          <input
            id="image_url"
            type="text"
            value={form.image_url}
            onChange={handleChange}
            disabled={isSaving}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            value={form.location}
            onChange={handleChange}
            disabled={isSaving}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <label htmlFor="start_date">Start date</label>
            <input
              id="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="end_date">End date</label>
            <input
              id="end_date"
              type="date"
              value={form.end_date}
              onChange={handleChange}
              disabled={isSaving}
            />
          </div>
        </div>

        <div>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={form.status}
            onChange={handleChange}
            disabled={isSaving}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label htmlFor="enable_rewards">Enable rewards</label>
          <input
            id="enable_rewards"
            type="checkbox"
            checked={form.enable_rewards}
            onChange={handleChange}
            disabled={isSaving}
            style={{ marginLeft: 8 }}
          />
        </div>

        <div>
          <label htmlFor="sort_order">Sort order</label>
          <input
            id="sort_order"
            type="number"
            min="0"
            value={form.sort_order}
            onChange={handleChange}
            disabled={isSaving}
          />
        </div>

        <button type="submit" disabled={isSaving || !tokenExists}>
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}

export default EditFestivalPage;
