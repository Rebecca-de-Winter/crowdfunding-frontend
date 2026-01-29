// import { Link } from "react-router-dom";
// import "./NavBar.css";

// function NavBar() {
//   return (
//     <div>
//       <nav>
//         <ul className="navbar-list">
//           <li className="navbar-item">
//             <Link to="/">Home</Link>
//           </li>
//           <li className="navbar-item">
//             <Link to="/fundraiser">Fundraiser</Link>
//           </li>
//         </ul>
//       </nav>

//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./NavBar.css";

import bfLogo from "../assets/backyard-festival-logo.png";

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 900) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleMenu = () => setMenuOpen((v) => !v);

  const toggleSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev;
      if (!next) setQuery("");
      return next;
    });
  };

  const onSubmitSearch = (e) => {
    e.preventDefault();
    console.log("Search:", query);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`navbar ${searchOpen ? "search-mode" : ""}`}>
      <div className="navbar-inner">
        {/* Left: Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu} aria-label="Backyard Festival Home">
          <img className="navbar-logo-img" src={bfLogo} alt="Backyard Festival" />
        </Link>

        {/* Center: Desktop nav links */}
        <nav className="navbar-links" aria-label="Primary navigation">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/fundraiser" className="navbar-link">Fundraiser</Link>
          <Link to="/resources" className="navbar-link">Resources</Link>
          <Link to="/how-it-works" className="navbar-link">How it Works</Link>
          <Link to="/login" className="navbar-link">Login</Link>
        </nav>

        {/* Right: Search + CTA + Login icon (mobile) + Hamburger */}
        <div className="navbar-actions">
          {/* Search */}
          <form className={`search ${searchOpen ? "open" : ""}`} onSubmit={onSubmitSearch}>
            <button
              type="button"
              className="icon-btn search-btn"
              onClick={toggleSearch}
              aria-label={searchOpen ? "Close search" : "Open search"}
              aria-expanded={searchOpen}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
                <path d="M10 18a8 8 0 1 1 5.293-14.293A8 8 0 0 1 10 18Zm0-2a6 6 0 1 0-4.243-1.757A5.78 5.78 0 0 0 10 16Zm8.707 5.293-4.11-4.11 1.414-1.414 4.11 4.11-1.414 1.414Z" />
              </svg>
            </button>

            <input
              ref={searchInputRef}
              className="search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search festivals…"
              aria-label="Search festivals"
            />

            {/* Close X (MyCause style) */}
            {searchOpen && (
              <button
                type="button"
                className="icon-btn search-close"
                onClick={toggleSearch}
                aria-label="Close search"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
                  <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.6l6.3-6.31 1.41 1.42Z" />
                </svg>
              </button>
            )}
          </form>

          {/* Create Festival CTA (desktop) */}
          <Link to="/create-festival" className="cta-btn" onClick={closeMenu}>
            Create Festival
          </Link>

          {/* Login icon (mobile only) */}
          <Link to="/login" className="icon-btn login-icon" aria-label="Login" onClick={closeMenu}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
              <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2-8 4.5V21h16v-2.5c0-2.5-3.58-4.5-8-4.5Z" />
            </svg>
          </Link>

          {/* Mobile hamburger (far right) */}
          <button
            type="button"
            className="icon-btn hamburger"
            onClick={toggleMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
              {menuOpen ? (
                <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.6l6.3-6.31 1.41 1.42Z" />
              ) : (
                <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      <div id="mobile-nav" className={`mobile-panel ${menuOpen ? "open" : ""}`}>
        <nav className="mobile-links" aria-label="Mobile navigation">
          <Link to="/" className="mobile-link" onClick={closeMenu}>Home</Link>
          <Link to="/fundraiser" className="mobile-link" onClick={closeMenu}>Fundraiser</Link>
          <Link to="/resources" className="mobile-link" onClick={closeMenu}>Resources</Link>
          <Link to="/how-it-works" className="mobile-link" onClick={closeMenu}>How it Works</Link>
          <Link to="/login" className="mobile-link" onClick={closeMenu}>Login</Link>
          <Link to="/create-festival" className="mobile-link mobile-cta" onClick={closeMenu}>
            Create Festival
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
