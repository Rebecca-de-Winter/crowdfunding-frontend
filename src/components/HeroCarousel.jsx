import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./HeroCarousel.css";

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

function clampIndex(i, len) {
  return (i + len) % len;
}

export default function HeroCarousel() {
  const prefersReducedMotion = usePrefersReducedMotion();

  // ✅ Put images in /public/hero/... so these paths work
  const slides = useMemo(
    () => [
      {
        key: "spark",
        image: "/hero/hero-spark.png",
        title: "Big ideas. Tiny budgets.",
        subtitle: "Start the thing you wish existed.",
        ctaLabel: "Let’s build it",
        ctaTo: "/fundraisers/new",
      },
      {
        key: "belonging",
        image: "/hero/hero-belonging.png",
        title: "A few dollars. Some hands. A spare speaker.",
        subtitle: "Build the community you want to be part of.",
        ctaLabel: "Show me what’s brewing",
        ctaTo: "/fundraisers",
      },
      {
        key: "movement",
        image: "/hero/hero-movement.png",
        title: "Make it real.",
        subtitle: "From the ground up.",
        ctaLabel: "Join in",
        ctaTo: "/fundraisers",
      },
    ],
    []
  );

  const AUTO_MS = 7000;

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  const goPrev = () => setIndex((i) => clampIndex(i - 1, slides.length));
  const goNext = () => setIndex((i) => clampIndex(i + 1, slides.length));
  const goTo = (i) => setIndex(clampIndex(i, slides.length));

  // auto-rotate (disabled if reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (isPaused) return;

    const id = window.setInterval(() => {
      setIndex((i) => clampIndex(i + 1, slides.length));
    }, AUTO_MS);

    return () => window.clearInterval(id);
  }, [prefersReducedMotion, isPaused, slides.length]);

  // keyboard arrows (optional but nice)
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
  }, [slides.length]);

  return (
    <section
      ref={rootRef}
      className={`hero ${prefersReducedMotion ? "hero--reduced" : ""}`}
      aria-label="Backyard Festival hero"
      tabIndex={0}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      {/* Backgrounds (stacked for fade) */}
      <div className="hero__bgStack" aria-hidden="true">
        {slides.map((s, i) => (
          <div
            key={s.key}
            className={`hero__bg ${i === index ? "is-active" : ""}`}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        ))}
      </div>

      {/* Overlay for readability */}
      <div className="hero__overlay" aria-hidden="true" />

      <div className="hero__inner">
        <div className="hero__content">
          <h1 className="hero__title">{slides[index].title}</h1>
          <p className="hero__subtitle">{slides[index].subtitle}</p>

          <div className="hero__actions">
            <Link to={slides[index].ctaTo} className="hero__cta">
              {slides[index].ctaLabel}
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

          {/* subtle helper line: optional */}
          {!prefersReducedMotion && (
            <div className="hero__hint" aria-hidden="true">
              Pauses on hover
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
