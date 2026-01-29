import useFundraisers from "../hooks/use-fundraisers";
import FundraiserCard from "../components/FundraiserCard";
import "./HomePage.css";

function HomePage() {
  const { fundraisers, isLoading, error } = useFundraisers();

  if (isLoading) return <p>Loading fundraisers…</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!fundraisers || fundraisers.length === 0) return <p>No fundraisers yet.</p>;

  return (
    <div id="fundraiser-list">
      {fundraisers.map((fundraiserData) => (
        <FundraiserCard key={fundraiserData.id} fundraiserData={fundraiserData} />
      ))}
    </div>
  );
}

export default HomePage;
