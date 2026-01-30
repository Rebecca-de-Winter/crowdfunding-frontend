import useFundraisers from "../hooks/use-fundraisers";
import FundraiserCard from "../components/FundraiserCard";
import "./FundraisersPage.css";

function FundraisersPage() {
  const { fundraisers, isLoading, error } = useFundraisers();

  if (isLoading) return <p>Loading fundraisers…</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!fundraisers || fundraisers.length === 0) return <p>No fundraisers yet.</p>;

  return (
    <div className="page">
      <h1 className="page-title">Fundraisers</h1>

      <div className="fundraiser-grid">
        {fundraisers.map((fundraiserData) => (
          <FundraiserCard key={fundraiserData.id} fundraiserData={fundraiserData} />
        ))}
      </div>
    </div>
  );
}

export default FundraisersPage;
