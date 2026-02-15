// src/pages/HomePage.jsx
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import useFundraisers from "../hooks/use-fundraisers";
import FundraiserCard from "../components/FundraiserCard";
import HeroCarousel from "../components/HeroCarousel";
import "./HomePage.css";

function safeLower(v) {
  return String(v ?? "").toLowerCase().trim();
}

function normaliseFundraiserStatus(raw) {
  const s = safeLower(raw);
  if (!s) return "draft";
  if (s === "unpublished") return "draft";
  if (s === "published") return "active";
  return s;
}

export default function HomePage() {
  // Read and consume flash ONCE during initial render (no useEffect)
  const [flash, setFlash] = useState(() => {
    const msg = sessionStorage.getItem("flash");
    if (msg) sessionStorage.removeItem("flash");
    return msg || null;
  });

  const { fundraisers, isLoading, error } = useFundraisers();

  // ✅ Hooks must be called before ANY early returns
  const featured = useMemo(() => {
    const list = Array.isArray(fundraisers) ? fundraisers : [];

    // ✅ simplest rule: never show drafts on homepage
    const publicOnly = list.filter((f) => normaliseFundraiserStatus(f?.status) !== "draft");

    // Optional: prefer active first, then newest
    publicOnly.sort((a, b) => {
      const aStatus = normaliseFundraiserStatus(a?.status);
      const bStatus = normaliseFundraiserStatus(b?.status);

      if (aStatus !== bStatus) {
        if (aStatus === "active") return -1;
        if (bStatus === "active") return 1;
      }

      const aDate = new Date(a?.created_at ?? a?.updated_at ?? 0).getTime();
      const bDate = new Date(b?.created_at ?? b?.updated_at ?? 0).getTime();
      return (bDate || 0) - (aDate || 0);
    });

    return publicOnly.slice(0, 3);
  }, [fundraisers]);

  // ✅ Now it's safe to do early returns
  if (isLoading) return <p>Loading fundraisers…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="page home">
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
          onAnimationEnd={() => setFlash(null)}
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

      <HeroCarousel />

      <section className="home-featured">
        <div className="home-sectionHeader">
          <h2>Featured fundraisers</h2>
          <Link className="home-link" to="/fundraisers">
            See all
          </Link>
        </div>

        <div className="fundraiser-grid">
          {featured.length === 0 ? (
            <p className="muted">No public fundraisers yet.</p>
          ) : (
            featured.map((fundraiserData) => (
              <FundraiserCard key={fundraiserData.id} fundraiserData={fundraiserData} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
