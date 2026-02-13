import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import useFundraisers from "../hooks/use-fundraisers";
import FundraiserCard from "../components/FundraiserCard";
import "./FundraisersPage.css";

function FundraisersPage() {
  const { fundraisers, isLoading, error } = useFundraisers();
  const { search } = useLocation();

  const tokenExists = Boolean(window.localStorage.getItem("token"));

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
        f.owner?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [fundraisers, q]);

  if (isLoading) return <p>Loading fundraisers…</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!fundraisers || fundraisers.length === 0) return <p>No fundraisers yet.</p>;

  return (
    <div className="page">
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 className="page-title">Fundraisers</h1>

          {/* Nice UX: show search context */}
          {q && (
            <div style={{ opacity: 0.9, fontSize: 14 }}>
              Showing results for <strong>“{q}”</strong> ({filteredFundraisers.length})
              {"  "}
              <Link to="/fundraisers" style={{ marginLeft: 10 }}>
                Clear
              </Link>
            </div>
          )}
        </div>

        <Link className="home-button" to={tokenExists ? "/fundraisers/new" : "/login"}>
          Create Festival
        </Link>
      </div>

      {/* If there are fundraisers overall, but none match the search */}
      {q && filteredFundraisers.length === 0 ? (
        <p>No results for “{q}”.</p>
      ) : (
        <div className="fundraiser-grid">
          {filteredFundraisers.map((fundraiserData) => (
            <FundraiserCard key={fundraiserData.id} fundraiserData={fundraiserData} />
          ))}
        </div>
      )}
    </div>
  );
}

export default FundraisersPage;
