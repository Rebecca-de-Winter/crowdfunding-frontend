import { Link } from "react-router-dom";
import useFundraisers from "../hooks/use-fundraisers";
import FundraiserCard from "../components/FundraiserCard";
import "./HomePage.css";

function HomePage() {
  const { fundraisers, isLoading, error } = useFundraisers();

  if (isLoading) return <p>Loading fundraisers…</p>;
  if (error) return <p>Error: {error.message}</p>;

  const featured = (fundraisers || []).slice(0, 3);

  return (
    <div className="page home">
      <section className="home-hero">
        <h1 className="home-title">Backyard Festival</h1>
        <p className="home-subtitle">
          Fundraise for small, magical community events — money, time, and items.
        </p>

        <div className="home-cta">
          <Link className="home-button" to="/fundraisers">Browse Fundraisers</Link>
          <Link className="home-button home-button--ghost" to="/create-festival">Create Festival</Link>
        </div>
      </section>

      <section className="home-featured">
        <div className="home-sectionHeader">
          <h2>Featured fundraisers</h2>
          <Link className="home-link" to="/fundraisers">See all</Link>
        </div>

        <div className="fundraiser-grid">
          {featured.map((fundraiserData) => (
            <FundraiserCard key={fundraiserData.id} fundraiserData={fundraiserData} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
