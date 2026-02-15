import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import useFundraisers from "../hooks/use-fundraisers";
import getCurrentUser from "../api/get-current-user";
import FundraiserCard from "../components/FundraiserCard";
import LoadingPanel from "../components/LoadingPanel";
import "./FundraisersPage.css";

function FundraisersPage() {
  const { fundraisers, isLoading, error } = useFundraisers();
  const { search } = useLocation();

  const [currentUser, setCurrentUser] = useState(null);

  // Load current user (if logged in)
  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) return;

    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const q = useMemo(() => {
    const params = new URLSearchParams(search);
    return (params.get("q") || "").trim();
  }, [search]);

  const visibleFundraisers = useMemo(() => {
    if (!fundraisers) return [];

    const viewerId = currentUser?.id ?? null;

    return fundraisers.filter((f) => {
      const status = String(f.status ?? "").toLowerCase();
      const ownerId =
        f.owner?.id ??
        f.owner?.pk ??
        f.owner;

      const isDraft = status === "draft";
      const isOwner = viewerId != null && Number(ownerId) === Number(viewerId);

      // Hide draft unless owner
      if (isDraft && !isOwner) return false;

      return true;
    });
  }, [fundraisers, currentUser]);

  const filteredFundraisers = useMemo(() => {
    if (!q) return visibleFundraisers;

    const needle = q.toLowerCase();

    return visibleFundraisers.filter((f) => {
      const haystack = [
        f.title,
        f.description,
        f.location,
        f.category,
        f.owner?.username,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [visibleFundraisers, q]);

  if (isLoading) return <LoadingPanel label="Hanging up the fairy lights…" />;
  if (error) return <p>Error: {error.message}</p>;
  if (!filteredFundraisers.length)
    return <p>No festivals yet.</p>;

  return (
    <div className="page fundraisers-page">
      <div className="fundraisers-header">
        <h1 className="fundraisers-title">Explore Festivals</h1>
        <p className="fundraisers-subtitle">
          Big ideas happening in backyards everywhere.
        </p>

        {q && (
          <div className="fundraisers-searchMeta">
            Showing results for <strong>“{q}”</strong>{" "}
            <span className="fundraisers-count">
              ({filteredFundraisers.length})
            </span>
            <Link to="/fundraisers" className="fundraisers-clear">
              Clear
            </Link>
          </div>
        )}
      </div>

      <div className="fundraiser-grid">
        {filteredFundraisers.map((fundraiserData) => (
          <FundraiserCard
            key={fundraiserData.id}
            fundraiserData={fundraiserData}
          />
        ))}
      </div>
    </div>
  );
}

export default FundraisersPage;
