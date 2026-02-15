import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./HeroCarousel.css";

import logo from "../assets/backyard-festival-logo.png";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mql) return;

    const onChange = () => setReduced(Boolean(mql.matches));
    onChange();

    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return reduced;
}

function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.(`(max-width: ${breakpointPx}px)`);
    if (!mql) return;

    const onChange = () => setIsMobile(Boolean(mql.matches));
    onChange();

    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [breakpointPx]);

  return isMobile;
}

function clampIndex(i, len) {
  return (i + len) % len;
}

function resolveTitle(title, isMobile) {
  if (!title) return "";
  if (typeof title === "string") return title;
  return (isMobile ? title.mobile : title.desktop) ?? title.desktop ?? "";
}

export default function HeroCarousel() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile(640);

  const slides = useMemo(
    () => [
      {
        key: "what",
        image: "/hero/hero-rock.png",
        title: "",
        subtitle: "Crowdfunding for grassroots festivals and community events.",
        ctaLabel: "Start your event",
        ctaTo: "/fundraisers/new",
      },
      {
        key: "spark",
        image: "/hero/hero-charities2.png",
        title: "Big ideas. Tiny budgets.",
        subtitle: "Start the thing you wish existed.",
        ctaLabel: "Let’s build it",
        ctaTo: "/fundraisers/new",
      },
      {
        key: "belonging",
        image: "/hero/hero-cables.png",
        title: {
          desktop: "A few dollars. Some hands.\nA spare\u00A0speaker.",
          mobile: "A few dollars.\nSome hands.\nA spare\u00A0speaker.",
        },
        subtitle: "Fund events with money, time,\nand shared resources.",
        ctaLabel: "Browse festivals",
        ctaTo: "/fundraisers",
      },
      {
        key: "movement",
        image: "/hero/hero-belonging1.png",
        title: "Make it real. Together.",
        subtitle: "From poetry slams to protest marches:\nIf it matters, fund it.",
        ctaLabel: "See what’s brewing",
        ctaTo: "/fundraisers",
      },
    ],
    []
  );

  const AUTO_MS = 7000;
  const FADE_MS = 240;

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  const jumpTo = (nextIndex) => setIndex(clampIndex(nextIndex, slides.length));

  const goTo = (next) => {
    const nextIndex = clampIndex(next, slides.length);

    // Desktop (or reduced motion): keep normal behavior
    if (!isMobile || prefersReducedMotion) {
      jumpTo(nextIndex);
      return;
    }

    // Mobile: fade-through to avoid double-image / crop jump
    setIsFading(true);

    window.setTimeout(() => {
      jumpTo(nextIndex);

      window.setTimeout(() => {
        setIsFading(false);
      }, FADE_MS);
    }, FADE_MS);
  };

  const goPrev = () => goTo(index - 1);
  const goNext = () => goTo(index + 1);

  useEffect(() => {
  if (prefersReducedMotion || isPaused) return;

  const id = window.setInterval(() => {
    setIndex((i) => clampIndex(i + 1, slides.length));
  }, AUTO_MS);

  return () => window.clearInterval(id);
}, [prefersReducedMotion, isPaused, slides.length]);


  const rootRef = useRef(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, index, isMobile, prefersReducedMotion]);

  const active = slides[index];
  const isLogoSlide = active.key === "what";

  return (
    <section
      ref={rootRef}
      className={`hero ${prefersReducedMotion ? "hero--reduced" : ""}`}
      aria-label="Backyard Festival hero"
      tabIndex={0}
      data-slide={active.key}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <div className="hero__bgStack" aria-hidden="true">
        {slides.map((s, i) => (
          <div
            key={s.key}
            className={`hero__bg ${i === index ? "is-active" : ""}`}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        ))}
      </div>

      <div className="hero__overlay" aria-hidden="true" />
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__tone" aria-hidden="true" />

      {/* Mobile-only fade cover (driven by state, harmless on desktop) */}
      <div className={`hero__fade ${isFading ? "is-on" : ""}`} aria-hidden="true" />

      <div className="hero__inner">
        <div className="hero__content">
          {isLogoSlide && (
            <div className="hero__logoWrap">
              <img src={logo} alt="Backyard Festival" className="hero__logo" />
            </div>
          )}

          <div className={`hero__contentBlock ${isLogoSlide ? "hero__contentBlock--what" : ""}`}>
            {!isLogoSlide && (
              <h1 className="hero__title">{resolveTitle(active.title, isMobile)}</h1>
            )}

            <p className="hero__subtitle">{active.subtitle}</p>

            <div className="hero__actions">
              <Link to={active.ctaTo} className="hero__cta">
                {active.ctaLabel}
              </Link>

              <button type="button" className="hero__arrow" onClick={goPrev} aria-label="Previous slide">
                ‹
              </button>
              <button type="button" className="hero__arrow" onClick={goNext} aria-label="Next slide">
                ›
              </button>
            </div>

            <div className="hero__dots" role="tablist" aria-label="Select hero slide">
              {slides.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  className={`hero__dot ${i === index ? "is-active" : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index ? "true" : "false"}
                />
              ))}
            </div>

            {!prefersReducedMotion && (
              <div className="hero__hint" aria-hidden="true">
                Pauses on hover
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
