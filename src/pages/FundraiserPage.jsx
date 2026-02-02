import { useParams, Link } from "react-router-dom";
import useFundraiser from "../hooks/use-fundraiser";
import "./FundraiserPage.css";

function FundraiserPage() {
  const { id } = useParams();
  const { fundraiser, isLoading, error } = useFundraiser(id);

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>{error.message}</p>;
  if (!fundraiser) return <p>Fundraiser not found.</p>;

  const {
    title,
    description,
    image_url,
    goal,
    location,
    start_date,
    end_date,
    is_open,
    enable_rewards,
    needs = [],
    reward_tiers = [],
    pledges = [],
  } = fundraiser;

  const moneyNeeds = needs.filter((n) => n.need_type === "money");
  const timeNeeds = needs.filter((n) => n.need_type === "time");
  const itemNeeds = needs.filter((n) => n.need_type === "item");

  const heroImg = image_url || "https://picsum.photos/1200/700";

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div className="fundraiser">
      <Link className="fundraiser__back" to="/fundraisers">
        ← Back to fundraisers
      </Link>

      <div className="fundraiser__top">
        {/* LEFT: hero + story */}
        <div className="fundraiser__left">
          <div className="fundraiser__hero">
            <img className="fundraiser__heroImg" src={heroImg} alt={title} />
          </div>

          <h1 className="fundraiser__title">{title}</h1>

          <div className="fundraiser__meta">
            {location ? <span>{location}</span> : null}

            {/* show formatted dates, and allow blanks */}
            {start_date || end_date ? (
              <span>
                {formatDate(start_date)} {end_date ? `→ ${formatDate(end_date)}` : ""}
              </span>
            ) : (
              <span>Dates: —</span>
            )}

            <span className="statusPill">
              <span
                className={`statusDot ${
                  is_open ? "statusDot--open" : "statusDot--closed"
                }`}
              />
              {is_open ? "Open" : "Closed"}
            </span>

            {/*  handy edit link (especially for your new creation flow) */}
            <Link className="fundraiser__editLink" to={`/fundraisers/${id}/edit`}>
              Edit
            </Link>
          </div>

          <p className="fundraiser__desc">{description}</p>

          {/* NEEDS */}
          <section className="fundraiser__section">
            <h2>What this fundraiser needs</h2>

            <div className="needs__grid">
              {/* Money block */}
              <div className="needs__block">
                <div className="needs__blockHeader">
                  <h3 className="needs__blockTitle">Money</h3>
                  <span className="needs__count">{moneyNeeds.length}</span>
                </div>

                {moneyNeeds.length === 0 ? (
                  <p className="needs__empty">No money needs yet.</p>
                ) : (
                  <ul className="needs__list">
                    {moneyNeeds.map((n) => (
                      <li key={n.id} className="needItem">
                        <div className="needItem__top">
                          <div className="needItem__name">{n.title}</div>
                          <span className={`badge badge--${n.status}`}>{n.status}</span>
                        </div>

                        {n.description ? (
                          <p className="needItem__desc">{n.description}</p>
                        ) : null}

                        <div className="needItem__meta">
                          <span className={`badge badge--priority-${n.priority}`}>
                            {n.priority}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Time block */}
              <div className="needs__block">
                <div className="needs__blockHeader">
                  <h3 className="needs__blockTitle">Time</h3>
                  <span className="needs__count">{timeNeeds.length}</span>
                </div>

                {timeNeeds.length === 0 ? (
                  <p className="needs__empty">No time needs yet.</p>
                ) : (
                  <ul className="needs__list">
                    {timeNeeds.map((n) => (
                      <li key={n.id} className="needItem">
                        <div className="needItem__top">
                          <div className="needItem__name">{n.title}</div>
                          <span className={`badge badge--${n.status}`}>{n.status}</span>
                        </div>

                        {n.description ? (
                          <p className="needItem__desc">{n.description}</p>
                        ) : null}

                        <div className="needItem__meta">
                          <span className={`badge badge--priority-${n.priority}`}>
                            {n.priority}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Items block */}
              <div className="needs__block">
                <div className="needs__blockHeader">
                  <h3 className="needs__blockTitle">Items</h3>
                  <span className="needs__count">{itemNeeds.length}</span>
                </div>

                {itemNeeds.length === 0 ? (
                  <p className="needs__empty">No item needs yet.</p>
                ) : (
                  <ul className="needs__list">
                    {itemNeeds.map((n) => (
                      <li key={n.id} className="needItem">
                        <div className="needItem__top">
                          <div className="needItem__name">{n.title}</div>
                          <span className={`badge badge--${n.status}`}>{n.status}</span>
                        </div>

                        {n.description ? (
                          <p className="needItem__desc">{n.description}</p>
                        ) : null}

                        <div className="needItem__meta">
                          <span className={`badge badge--priority-${n.priority}`}>
                            {n.priority}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* PLEDGES */}
          <section className="fundraiser__section">
            <h2>Pledges</h2>

            {pledges.length === 0 ? (
              <p className="muted">No pledges yet.</p>
            ) : (
              <ul className="simpleList">
                {pledges.map((p) => (
                  <li key={p.id}>
                    {p.amount ?? "—"} from {p.supporter ?? "anonymous"}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* RIGHT: action stack */}
        <aside className="fundraiser__right">
          <div className="panel">
            <div className="panel__row">
              <div className="panel__label">Goal</div>
              <div className="panel__value">${goal}</div>
            </div>

            <div className="panel__actions">
              {is_open ? (
                <>
                  {/* UPDATED ROUTES: plural fundraisers */}
                  <Link className="btn" to={`/fundraisers/${id}/pledge/money`}>
                    Pledge money
                  </Link>

                  <Link className="btn btn--ghost" to={`/fundraisers/${id}/pledge/time`}>
                    Volunteer time
                  </Link>

                  <Link className="btn btn--ghost" to={`/fundraisers/${id}/pledge/items`}>
                    Pledge items
                  </Link>
                </>
              ) : (
                <p className="muted">
                  This fundraiser is closed. Pledges are no longer being accepted.
                </p>
              )}
            </div>
          </div>

          <div className="panel">
            <h3 className="panel__title">Rewards</h3>

            {!enable_rewards ? (
              <p className="muted">Rewards are disabled for this fundraiser.</p>
            ) : reward_tiers && reward_tiers.length > 0 ? (
              <ul className="rewardList">
                {reward_tiers.map((r) => (
                  <li className="reward" key={r.id}>
                    <div className="reward__name">{r.name ?? "Reward tier"}</div>
                    <div className="reward__desc muted">{r.description ?? ""}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No reward tiers yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default FundraiserPage;
