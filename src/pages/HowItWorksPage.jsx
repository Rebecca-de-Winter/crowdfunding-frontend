import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./HowItWorksPage.css";

const STEPS = [
  {
    key: "idea",
    icon: "✨",
    title: "Start with the idea",
    image: "/hero/hero-spark.png",
    imageAlt: "Backyard stage mid-setup with fairy lights being strung",
    body: (
      <>
        <p className="hit-p">
          It usually starts with something small. A backyard gig. A poetry night you wish existed.
          A fundraiser for something that matters to you.
        </p>
        <p className="hit-p">
          Create a page for it. Give it a name. Add a photo. Write it the way you would invite a friend.
          Not a pitch. An invitation.
        </p>
        <p className="hit-tip">
          If you can picture the night in your head, you can start building it here.
        </p>
      </>
    ),
  },
  {
    key: "gather",
    icon: "🧰",
    title: "Gather what you need",
    image: "/hero/hero-movement.png",
    imageAlt: "People setting up equipment for an event",
    body: (
      <>
        <p className="hit-p">
          Instead of just asking for money, you list what would actually make it possible.
        </p>

        <ul className="hit-list">
          <li><strong>Money</strong> for venue hire, printing, permits.</li>
          <li><strong>Time</strong> for setup, running sound, greeting people at the door.</li>
          <li><strong>Items</strong> like speakers, mic cables, lights, chairs.</li>
        </ul>

        <p className="hit-p">
          Some people have cash. Some people have skills. Some people have gear.
          This lets everyone contribute in their own way.
        </p>
      </>
    ),
  },
  {
    key: "invite",
    icon: "📣",
    title: "Invite your people in",
    image: "/hero/hero-charities2.png",
    imageAlt: "People collaborating to set up an event",
    body: (
      <>
        <p className="hit-p">
          Share the page where your community already is. Group chats. Social feeds.
          Work mates. The local scene.
        </p>
        <p className="hit-p">
          You are not shouting into the void. You are inviting people who already care.
        </p>
        <p className="hit-tip">
          Backyard Festival is built for real communities, not algorithms.
        </p>
      </>
    ),
  },
  {
    key: "run",
    icon: "🛠️",
    title: "Choose how you want to run it",
    image: "/hero/hero-belonging1.png",
    imageAlt: "People working together under fairy lights",
    body: (
      <>
        <p className="hit-p">You decide how pledges are handled.</p>

        <div className="hit-split">
          <div className="hit-pill">
            <p className="hit-pill__title">Auto-approve</p>
            <p className="hit-pill__text">Pledges count straight away. Simple and fast.</p>
          </div>

          <div className="hit-pill">
            <p className="hit-pill__title">Manual approval</p>
            <p className="hit-pill__text">
              Review pledges before they go live. Good when you need a bit more coordination.
            </p>
          </div>
        </div>

        <p className="hit-p">
          You can also create rewards for anyone who contributes. Not just money.
          If someone runs the sound desk or lends you a PA system, you can thank them properly.
        </p>
      </>
    ),
  },
  {
    key: "shape",
    icon: "🌿",
    title: "Watch it take shape",
    image: "/hero/hero-rock.png",
    imageAlt: "Small crowd with warm lights and music",
    body: (
      <>
        <p className="hit-p">
          As pledges come in, totals update across money, time, and items.
          Your dashboard keeps everything in one place so you can see what is covered and what still needs love.
        </p>
        <p className="hit-p">
          Bit by bit, the numbers shift. The gear is sorted. The volunteers step up.
        </p>
        <p className="hit-tip">Turn "what if" into "we did it"!</p>
      </>
    ),
  },
];

export default function HowItWorksPage() {
  const [activeKey, setActiveKey] = useState(STEPS[0].key);

  const activeStep = useMemo(
    () => STEPS.find((s) => s.key === activeKey) || STEPS[0],
    [activeKey]
  );

  return (
    <div className="hit-page">
      <div className="hit-shell">
        <header className="hit-hero">
          <div className="hit-hero__inner">
            <h1 className="hit-title">How it works</h1>
            <p className="hit-subtitle">
              Backyard Festival is for tiny budgets and big ideas, the kind that start with fairy lights,
              borrowed gear, and a few brave humans saying “yeah… let’s make this thing happen!”
            </p>
          </div>
        </header>

        <main className="hit-main">
          <section className="hit-section">
            <h2 className="hit-h2">The short version</h2>

            <div className="hit-leadBlock">
              <p className="hit-lead">
                You create a fundraiser for your event and add exactly what you need. Money for venue hire.
                Time for the people power. Items for the gear. Then you share it with your community.
              </p>

              <p className="hit-lead">
                Supporters pledge what they can, whether that is cash, volunteer hours, or gear.
                You can customise rewards for anyone who contributes. From your dashboard, you manage donations,
                volunteers, and items in one place. Think of it as crowdfunding the events you have always wanted to see.
              </p>
            </div>

            <div className="hit-tabsWrap">
              <div className="hit-tabs" role="tablist" aria-label="How it works steps">
                {STEPS.map((s) => {
                  const isActive = s.key === activeKey;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      className={`hit-tab ${isActive ? "is-active" : ""}`}
                      onClick={() => setActiveKey(s.key)}
                      role="tab"
                      aria-selected={isActive}
                    >
                      <span className="hit-tab__icon" aria-hidden="true">{s.icon}</span>
                      <span className="hit-tab__label">{s.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="hit-panel" role="tabpanel">
                <div className="hit-panel__media">
                  <img
                    className="hit-panel__img"
                    src={activeStep.image}
                    alt={activeStep.imageAlt}
                    loading="lazy"
                  />
                </div>

                <div className="hit-panel__content">
                  <h3 className="hit-h3">{activeStep.title}</h3>
                  {activeStep.body}
                </div>
              </div>
            </div>
          </section>

          <section className="hit-section hit-section--lite">
            <h2 className="hit-h2">What makes Backyard Festival different?</h2>

            <div className="hit-grid3">
              <div className="hit-mini">
                <div className="hit-mini__top">
                  <span className="hit-mini__badge" aria-hidden="true">🧩</span>
                  <h3 className="hit-h3 hit-h3--mini">Not just money</h3>
                </div>
                <p className="hit-text">
                  People can pledge time and items, not just dollars, which makes it way more accessible for tiny-budget events.
                </p>
              </div>

              <div className="hit-mini">
                <div className="hit-mini__top">
                  <span className="hit-mini__badge" aria-hidden="true">🛠️</span>
                  <h3 className="hit-h3 hit-h3--mini">Built for real life</h3>
                </div>
                <p className="hit-text">
                  Live totals, ready made pre-filled event templates, rewards that auto-sync to the supporter, the stuff you actually need when you are organising chaos.
                </p>
              </div>

              <div className="hit-mini">
                <div className="hit-mini__top">
                  <span className="hit-mini__badge" aria-hidden="true">💛</span>
                  <h3 className="hit-h3 hit-h3--mini">Community-first</h3>
                </div>
                <p className="hit-text">
                  The whole point is shared effort: borrowed gear, volunteer shifts, small donations, and people showing up.
                </p>
              </div>
            </div>
          </section>

          <section className="hit-cta">
            <div className="hit-cta__inner">
              <div className="hit-cta__text">
                <h2 className="hit-cta__title">Ready to start yours?</h2>
                <p className="hit-cta__subtitle">
                  Start small. Keep it scrappy. Let people pitch in the way they can.
                </p>
              </div>

              <div className="hit-cta__buttons">
                <Link to="/fundraisers/new" className="cta-btn">
                  Create Festival
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
