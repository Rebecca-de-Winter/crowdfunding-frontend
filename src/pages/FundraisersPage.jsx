import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import useFundraisers from "../hooks/use-fundraisers";
import FundraiserCard from "../components/FundraiserCard";
import "./FundraisersPage.css";

function FundraisersPage() {
  const { fundraisers, isLoading, error } = useFundraisers();
  const { search } = useLocation();

  // Read q from /fundraisers?q=...
  const q = useMemo(() => {
    const params = new URLSearchParams(search);
    return (params.get("q") || "").trim();
  }, [search]);

  const filteredFundraisers = useMemo(() => {
    if (!fundraisers) return [];
    if (!q) return fundraisers;

    const needle = q.toLowerCase();

    return fundraisers.filter((f) => {
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
  }, [fundraisers, q]);

  if (isLoading) return <p>Loading festivals…</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!fundraisers || fundraisers.length === 0)
    return <p>No festivals yet.</p>;

  return (
    <div className="page fundraisers-page">
      {/* Header */}
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

      {/* Results */}
      {q && filteredFundraisers.length === 0 ? (
        <div className="fundraisers-empty">
          No results for “{q}”.
        </div>
      ) : (
        <div className="fundraiser-grid">
          {filteredFundraisers.map((fundraiserData) => (
            <FundraiserCard
              key={fundraiserData.id}
              fundraiserData={fundraiserData}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FundraisersPage;
