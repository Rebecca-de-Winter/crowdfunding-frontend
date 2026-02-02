import { Link } from "react-router-dom";
import useFundraisers from "../hooks/use-fundraisers";
import FundraiserCard from "../components/FundraiserCard";
import "./FundraisersPage.css";

function FundraisersPage() {
  const { fundraisers, isLoading, error } = useFundraisers();

  const tokenExists = Boolean(window.localStorage.getItem("token"));

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
        <h1 className="page-title">Fundraisers</h1>

        {/* Create button goes to the new route */}
        <Link className="home-button" to={tokenExists ? "/fundraisers/new" : "/login"}>
          Create Festival
        </Link>
      </div>

      <div className="fundraiser-grid">
        {fundraisers.map((fundraiserData) => (
          <FundraiserCard key={fundraiserData.id} fundraiserData={fundraiserData} />
        ))}
      </div>
    </div>
  );
}

export default FundraisersPage;
