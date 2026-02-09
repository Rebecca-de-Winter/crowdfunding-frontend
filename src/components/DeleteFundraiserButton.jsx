import { useState } from "react";
import { useNavigate } from "react-router-dom";
import deleteFundraiser from "../api/delete-fundraiser";

export default function DeleteFundraiserButton({ fundraiserId, fundraiserTitle }) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function onDelete() {
    setError(null);

    const ok = window.confirm(
      `Delete "${fundraiserTitle || "this festival"}"?\n\nThis can’t be undone.`
    );
    if (!ok) return;

    setIsDeleting(true);
    try {
      await deleteFundraiser(fundraiserId);
      navigate("/"); // or your "My Festivals" page route
    } catch (e) {
      setError(e.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="dangerZone">
      <h3 className="dangerZone__title">Danger zone</h3>
      <p className="dangerZone__text">
        Deleting is permanent. If your festival has pledges, deletion may be blocked.
      </p>

      {error && <p className="dangerZone__error">{error}</p>}

      <button
        type="button"
        className="dangerZone__btn"
        onClick={onDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting…" : "Delete festival"}
      </button>
    </section>
  );
}
