import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bf-footer">
      <div className="bf-footer__inner">
        {/* Brand row */}
        <div className="bf-footer__brandRow">
          <span className="bf-footer__title">Backyard Festival</span>
          <span className="bf-footer__dash" aria-hidden="true">-</span>
          <span className="bf-footer__tagline">Make your dream events happen, together!</span>
        </div>

        {/* Links + icons as one cohesive strip */}
        <div className="bf-footer__strip" aria-label="Footer navigation">
          <nav className="bf-footer__nav" aria-label="Footer links">
            <Link className="bf-footer__link" to="/fundraisers">Browse Festivals</Link>
            <Link className="bf-footer__link" to="/fundraisers/new">Create Festival</Link>
            <Link className="bf-footer__link" to="/how-it-works">How it works</Link>
            <Link className="bf-footer__link" to="/resources">Resources</Link>
            <Link className="bf-footer__link" to="/login">Login</Link>
            <a className="bf-footer__link" href="mailto:hello@backyardfestival.test">Contact</a>
          </nav>

          <div className="bf-footer__social" aria-label="Social links">
            <a
              className="bf-footer__iconBtn"
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="Instagram"
              title="Instagram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm4.5 4.2a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6Zm0 2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6ZM18 6.7a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
              </svg>
            </a>

            <a
              className="bf-footer__iconBtn"
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="Facebook"
              title="Facebook"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6h1.6V4.8c-.8-.1-1.8-.2-3-.2-2.9 0-4.8 1.8-4.8 5.1V11H6.5v3H9v8h4.5Z" />
              </svg>
            </a>

            <a
              className="bf-footer__iconBtn"
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="Newsletter"
              title="Newsletter"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Zm2.8-.5 5.2 3.9L17.2 6H6.8Zm11.2 2.1-5.4 4.1a1 1 0 0 1-1.2 0L6 8.1V17.5c0 .3.2.5.5.5h11c.3 0 .5-.2.5-.5V8.1Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bf-footer__bottom">
        <div className="bf-footer__bottomInner">
          <span>© {year} Backyard Festival</span>
          <span className="bf-footer__sep" aria-hidden="true">•</span>
          <span>Made by Becky Cole</span>
        </div>
      </div>
    </footer>
  );
}
