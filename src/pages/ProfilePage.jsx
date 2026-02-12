// src/pages/ProfilePage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getMyFundraisersReport from "../api/get-my-fundraisers-report";
import getMyPledgesReport from "../api/get-my-pledges-report";
import postPledgeCancel from "../api/post-pledge-cancel";
import "./ProfilePage.css";

function ProfilePage() {
  const [myFundraisers, setMyFundraisers] = useState([]);
  const [myPledges, setMyPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const [fundraisersData, pledgesData] = await Promise.all([
          getMyFundraisersReport(),
          getMyPledgesReport(),
        ]);

        setMyFundraisers(Array.isArray(fundraisersData) ? fundraisersData : []);
        setMyPledges(Array.isArray(pledgesData) ? pledgesData : []);
      } catch (err) {
        console.error(err);
        setError(err?.message || "Something went wrong loading your dashboard.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleCancelPledge(id) {
    try {
      const updated = await postPledgeCancel(id);

      setMyPledges((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      console.error(err);
      setError(err?.message || "Could not cancel pledge.");
    }
  }

  return (
    <div className="profilePage">
      <header className="profilePage__header">
        <h1 className="profilePage__title">My Dashboard</h1>
        <p className="profilePage__subtitle">
          Your fundraisers + your pledges — all in one place.
        </p>
      </header>

      {loading && <div className="profilePage__state">Loading…</div>}
      {!loading && error && <div className="profilePage__error">{error}</div>}

      {!loading && !error && (
        <div className="profileGrid">
          {/* My Fundraisers */}
          <section className="profileCard">
            <div className="profileCard__top">
              <h2 className="profileCard__title">My Fundraisers</h2>
              <Link className="profileCard__link" to="/fundraisers/new">
                + New fundraiser
              </Link>
            </div>

            {myFundraisers.length === 0 ? (
              <div className="profileCard__empty">
                You haven’t created any fundraisers yet.
              </div>
            ) : (
              <ul className="profileList">
                {myFundraisers.map((f, idx) => {
                  const fundraiserId = f.id ?? f.fundraiser_id ?? f.pk ?? null;
                  const key = fundraiserId ?? `fundraiser-${idx}`;

                  return (
                    <li key={key} className="profileRow">
                      <div className="profileRow__main">
                        {fundraiserId ? (
                          <Link
                            className="profileRow__title"
                            to={`/fundraisers/${fundraiserId}`}
                          >
                            {f.title || f.name || `Fundraiser #${fundraiserId}`}
                          </Link>
                        ) : (
                          <span className="profileRow__title">
                            {f.title || f.name || "Fundraiser"}
                          </span>
                        )}

                        <div className="profileRow__meta">
                          Status: <strong>{f.status || f.lifecycle || "—"}</strong>
                        </div>
                      </div>

                      <div className="profileRow__actions">
                        {fundraiserId ? (
                          <>
                            <Link
                              className="btnTiny"
                              to={`/fundraisers/${fundraiserId}`}
                            >
                              View
                            </Link>
                            <Link
                              className="btnTiny"
                              to={`/fundraisers/${fundraiserId}/edit`}
                            >
                              Edit
                            </Link>
                          </>
                        ) : (
                          <span className="muted">Missing ID</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* My Pledges */}
          <section className="profileCard">
            <div className="profileCard__top">
              <h2 className="profileCard__title">My Pledges</h2>
              <Link className="profileCard__link" to="/fundraisers">
                Browse fundraisers →
              </Link>
            </div>

            {myPledges.length === 0 ? (
              <div className="profileCard__empty">
                You haven’t made any pledges yet.
              </div>
            ) : (
              <ul className="profileList">
                {myPledges.map((p, idx) => {
                  const pledgeKey = p.id ?? `pledge-${idx}`;
                  const fundraiserId =
                    p.fundraiser_id ?? p.fundraiser ?? null;

                  return (
                    <li key={pledgeKey} className="profileRow">
                      <div className="profileRow__main">
                        {fundraiserId ? (
                          <Link
                            className="profileRow__title"
                            to={`/fundraisers/${fundraiserId}`}
                          >
                            {p.fundraiser_title || "Fundraiser"}
                          </Link>
                        ) : (
                          <span className="profileRow__title">
                            {p.fundraiser_title || "Fundraiser"}
                          </span>
                        )}

                        <div className="profileRow__meta">
                          Need: <strong>{p.need_title || "—"}</strong>{" "}
                          <span className="muted">
                            ({p.need_type || "—"})
                          </span>
                        </div>

                        <div className="profileRow__meta">
                          Status: <strong>{p.status || "—"}</strong>
                        </div>
                      </div>

                      <div className="profileRow__actions">
                        {fundraiserId && (
                          <Link
                            className="btnTiny"
                            to={`/fundraisers/${fundraiserId}`}
                          >
                            View
                          </Link>
                        )}

                        {p.status === "pending" && (
                          <button
                            className="btnTiny btnDanger"
                            onClick={() => handleCancelPledge(p.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
