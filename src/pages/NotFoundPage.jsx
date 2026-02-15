import { Link } from "react-router-dom";
import guy from "../assets/404-tangled-guy-transparent.png";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <main className="nf" role="main">
      <section className="nfCard" aria-labelledby="nf-heading">
        <header className="nfHeader">
          <h1 className="nfCode">404</h1>

          <h2 id="nf-heading" className="nfTitle">
            Well… this is awkward.
          </h2>

          <p className="nfTagline">
            Someone got wrapped up in the fairy lights.
            <br />
            Let’s light your way home.
          </p>
        </header>

        {/* Wrapped image fixes crop imbalance */}
        <div className="nfArt" aria-hidden="true">
          <div className="nfArtWrap">
            <img
              className="nfImg"
              src={guy}
              alt=""
              loading="lazy"
              draggable="false"
            />
          </div>
        </div>

        <div className="nfActions">
          <Link to="/" className="nfBtn nfBtnPrimary">
            Take Me Home
          </Link>
        </div>
      </section>
    </main>
  );
}
