import { Link } from "react-router-dom";
import { useState } from "react";
import useFundraisers from "../hooks/use-fundraisers";
import FundraiserCard from "../components/FundraiserCard";
import HeroCarousel from "../components/HeroCarousel";
import "./HomePage.css";

function HomePage() {
  // Read and consume flash ONCE during initial render (no useEffect)
  const [flash, setFlash] = useState(() => {
    const msg = sessionStorage.getItem("flash");
    if (msg) sessionStorage.removeItem("flash");
    return msg || null;
  });

  const { fundraisers, isLoading, error } = useFundraisers();

  if (isLoading) return <p>Loading fundraisers…</p>;
  if (error) return <p>Error: {error.message}</p>;

  const featured = (fundraisers || []).slice(0, 3);

  return (
    <div className="page home">
      {/* Tiny inline keyframes so you don't need new CSS */}
      <style>{`
        @keyframes flashFade {
          0% { opacity: 0; transform: translateY(-4px); }
          10% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>

      {flash && (
        <div
          onAnimationEnd={() => setFlash(null)} // state update via event handler, not effect
          style={{
            margin: "12px auto 0",
            maxWidth: 1100,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(245, 232, 205, 0.22)",
            background: "rgba(0, 0, 0, 0.20)",
            color: "rgba(253, 244, 225, 0.92)",
            fontWeight: 800,
            animation: "flashFade 3.5s ease forwards",
          }}
        >
          {flash}
        </div>
      )}

      {/* ✅ New Hero Carousel */}
      <HeroCarousel />

      <section className="home-featured">
        <div className="home-sectionHeader">
          <h2>Featured fundraisers</h2>
          <Link className="home-link" to="/fundraisers">
            See all
          </Link>
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
