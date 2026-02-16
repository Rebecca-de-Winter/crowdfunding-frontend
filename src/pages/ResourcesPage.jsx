import "./ResourcesPage.css";

function ResourcesPage() {
  return (
    <div className="resourcesPage">
      <div className="resourcesPage__inner">
        <header className="resourcesPage__hero">
          <h1>Resources</h1>
          <p>
            Everything you need to plan, promote, and run a community event —
            whether it’s a backyard gig, poetry slam, fundraiser dinner, or a tiny
            protest with a big heart.
          </p>
        </header>

        <section className="resourcesPage__grid" aria-label="Resources">
          <article className="resourcesCard">
            <h3>Event Planning Checklist</h3>
            <p>
              A practical checklist covering the essentials: permissions, power,
              sound, weather plans, access, and the little things everyone forgets.
            </p>
            <div className="resourcesCard__actions">
              <a href="#" className="cta-btn">Open Checklist</a>
              <a href="#" className="resourcesLinkBtn">Download</a>
            </div>
          </article>

          <article className="resourcesCard">
            <h3>Budget Builder</h3>
            <p>
              Work out costs, targets, and what's realistic. Helps you set a goal
              that actually matches your event.
            </p>
            <div className="resourcesCard__actions">
              <a href="#" className="cta-btn">Use Template</a>
              <a href="#" className="resourcesLinkBtn">Download</a>
            </div>
          </article>

          <article className="resourcesCard">
            <h3>Needs & Pledges Guide</h3>
            <p>
              How to think in money, time, and items. Includes examples like borrowing
              speakers, getting volunteers, and funding basics.
            </p>
            <div className="resourcesCard__actions">
              <a href="#" className="cta-btn">Read Guide</a>
            </div>
          </article>

          <article className="resourcesCard">
            <h3>Promotion Toolkit</h3>
            <p>
              Caption ideas, launch messaging, and a simple promo plan that doesn't
              require being an influencer or spending money.
            </p>
            <div className="resourcesCard__actions">
              <a href="#" className="cta-btn">View Toolkit</a>
              <a href="#" className="resourcesLinkBtn">Poster Copy</a>
            </div>
          </article>

          <article className="resourcesCard">
            <h3>Volunteer Team Basics</h3>
            <p>
              How to recruit, brief, and look after volunteers. Includes shift ideas
              and making time pledges feel organised and appreciated.
            </p>
            <div className="resourcesCard__actions">
              <a href="#" className="cta-btn">Read Guide</a>
            </div>
          </article>

          <article className="resourcesCard">
            <h3>Run Sheet Template</h3>
            <p>
              A simple timeline template to keep your event flowing: bump in, sound
              check, performers, speeches, pack down, thank-yous.
            </p>
            <div className="resourcesCard__actions">
              <a href="#" className="cta-btn">Open Run Sheet</a>
              <a href="#" className="resourcesLinkBtn">Download</a>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

export default ResourcesPage;
