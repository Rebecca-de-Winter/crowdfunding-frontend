import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bf-footer">
      <div className="bf-footer__inner">
        <div className="bf-footer__brand">
          <div className="bf-footer__title">Backyard Festival</div>
          <p className="bf-footer__tagline">
            Fundraise for small, magical community events — money, time, and items.
          </p>
        </div>

        <div className="bf-footer__cols">
          <div className="bf-footer__col">
            <div className="bf-footer__heading">Explore</div>
            <Link className="bf-footer__link" to="/fundraiser">Fundraisers</Link>
            <Link className="bf-footer__link" to="/create-festival">Create Festival</Link>
            <Link className="bf-footer__link" to="/resources">Resources</Link>
          </div>

          <div className="bf-footer__col">
            <div className="bf-footer__heading">Help</div>
            <Link className="bf-footer__link" to="/how-it-works">How it Works</Link>
            <Link className="bf-footer__link" to="/login">Login</Link>
            <a className="bf-footer__link" href="mailto:hello@backyardfestival.test">
              Contact
            </a>
          </div>

          <div className="bf-footer__col">
            <div className="bf-footer__heading">Follow</div>
            <a className="bf-footer__link" href="#" onClick={(e) => e.preventDefault()}>
              Instagram
            </a>
            <a className="bf-footer__link" href="#" onClick={(e) => e.preventDefault()}>
              Facebook
            </a>
            <a className="bf-footer__link" href="#" onClick={(e) => e.preventDefault()}>
              Newsletter
            </a>
          </div>
        </div>
      </div>

      <div className="bf-footer__bottom">
        <div className="bf-footer__bottomInner">
          <span>© {year} Backyard Festival</span>
          <span className="bf-footer__dot">•</span>
          <span>Made by Becky Cole</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
