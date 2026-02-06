import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";

/**
 * datetime-local gives: "2026-02-06T19:30"
 * Convert to ISO string (UTC) like: "2026-02-06T09:30:00.000Z"
 */
function toISOZ(datetimeLocalValue) {
  if (!datetimeLocalValue) return "";
  const d = new Date(datetimeLocalValue);
  return d.toISOString();
}

/**
 * Convert something like "$60", " 60 ", "60.5" into "60.50"
 * Return null if invalid.
 */
function normaliseMoney(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return n.toFixed(2);
}

/**
 * Convert hours to "2.00" style string
 */
function normaliseHours(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return n.toFixed(2);
}

function calcHours(startLocal, endLocal) {
  if (!startLocal || !endLocal) return "";
  const start = new Date(startLocal);
  const end = new Date(endLocal);
  const ms = end - start;
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const hours = ms / (1000 * 60 * 60);
  return hours.toFixed(2);
}

export default function PledgeNeedPage() {
  const { id, needId } = useParams();
  const navigate = useNavigate();

  const [need, setNeed] = useState(null);

  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  // money
  const [amount, setAmount] = useState("");

  // item
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState("donation");

  // time
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [hoursCommitted, setHoursCommitted] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load need
  useEffect(() => {
    let alive = true;

    async function loadNeed() {
      try {
        setIsLoading(true);
        setError(null);

        const url = `${import.meta.env.VITE_API_URL}needs/${needId}/`;
        const res = await authFetch(url, { method: "GET" });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!alive) return;

        setNeed(data);

        // prefill type-specific fields
        if (data.need_type === "money") setAmount("");
        if (data.need_type === "item") setItemName(data.title ?? "");
        if (data.need_type === "time") {
          setStartLocal("");
          setEndLocal("");
          setHoursCommitted("");
        }
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    loadNeed();
    return () => {
      alive = false;
    };
  }, [needId]);

  const needType = useMemo(() => need?.need_type ?? null, [need]);

  // Auto-calc hours whenever start/end changes
  useEffect(() => {
    if (needType !== "time") return;
    const computed = calcHours(startLocal, endLocal);
    setHoursCommitted(computed);
  }, [needType, startLocal, endLocal]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!needType) return;

    try {
      setSubmitLoading(true);
      setError(null);

      // --- validate before posting ---
      if (needType === "money") {
        const amt = normaliseMoney(amount);
        if (!amt) throw new Error("Please enter a valid amount (e.g. 60.00).");
      }

      if (needType === "item") {
        if (!itemName.trim()) throw new Error("Please enter an item name.");
        const q = Number(quantity);
        if (!Number.isFinite(q) || q <= 0) throw new Error("Quantity must be at least 1.");
      }

      if (needType === "time") {
        if (!startLocal || !endLocal) throw new Error("Please choose a start and end time.");
        const hrs = normaliseHours(hoursCommitted);
        if (!hrs) throw new Error("End time must be after start time.");
      }

      // 1) Create base pledge
      // NOTE: Set to "approved" so your report totals update immediately.
      // Later, when you build moderation, switch this back to "pending".
      const pledgePayload = {
        fundraiser: Number(id),
        need: Number(needId),
        comment,
        anonymous,
        status: "approved",
      };

      const pledgeRes = await authFetch(`${import.meta.env.VITE_API_URL}pledges/`, {
        method: "POST",
        body: JSON.stringify(pledgePayload),
      });

      if (!pledgeRes.ok) throw new Error(await pledgeRes.text());
      const pledgeData = await pledgeRes.json();
      const pledgeId = pledgeData.id;

      // 2) Create detail record
      if (needType === "money") {
        const amt = normaliseMoney(amount); // already validated
        const moneyPayload = { pledge: pledgeId, amount: amt, comment };

        const r = await authFetch(`${import.meta.env.VITE_API_URL}money-pledges/`, {
          method: "POST",
          body: JSON.stringify(moneyPayload),
        });

        if (!r.ok) throw new Error(await r.text());
      }

      if (needType === "item") {
        const itemPayload = {
          pledge: pledgeId,
          item_name: itemName.trim(),
          quantity: Number(quantity),
          mode,
          comment,
        };

        const r = await authFetch(`${import.meta.env.VITE_API_URL}item-pledges/`, {
          method: "POST",
          body: JSON.stringify(itemPayload),
        });

        if (!r.ok) throw new Error(await r.text());
      }

      if (needType === "time") {
        const hrs = normaliseHours(hoursCommitted);
        const timePayload = {
          pledge: pledgeId,
          start_datetime: toISOZ(startLocal),
          end_datetime: toISOZ(endLocal),
          hours_committed: hrs,
          comment,
        };

        const r = await authFetch(`${import.meta.env.VITE_API_URL}time-pledges/`, {
          method: "POST",
          body: JSON.stringify(timePayload),
        });

        if (!r.ok) throw new Error(await r.text());
      }

      // success
      navigate(`/fundraisers/${id}`);
    } catch (e) {
      setError(e);
    } finally {
      setSubmitLoading(false);
    }
  }

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>{String(error.message ?? error)}</p>;
  if (!need) return <p>Need not found.</p>;

  return (
    <div className="fundraiser">
      <Link className="fundraiser__back" to={`/fundraisers/${id}`}>
        ← Back to fundraiser
      </Link>

      <h1>Pledge: {need.title}</h1>
      {need.description ? <p className="muted">{need.description}</p> : null}

      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel__row">
          <div className="panel__label">Type</div>
          <div className="panel__value">{needType}</div>
        </div>

        <label className="muted">Comment</label>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)"
          style={{ width: "100%", margin: "8px 0 12px", padding: "10px", borderRadius: "12px" }}
        />

        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          Anonymous
        </label>

        <div style={{ height: 14 }} />

        {needType === "money" && (
          <>
            <label className="muted">Amount (AUD)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="60.00"
              inputMode="decimal"
              style={{ width: "100%", margin: "8px 0 12px", padding: "10px", borderRadius: "12px" }}
            />
          </>
        )}

        {needType === "item" && (
          <>
            <label className="muted">Item name</label>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="PA Speakers"
              style={{ width: "100%", margin: "8px 0 12px", padding: "10px", borderRadius: "12px" }}
            />

            <label className="muted">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ width: "100%", margin: "8px 0 12px", padding: "10px", borderRadius: "12px" }}
            />

            <label className="muted">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{ width: "100%", margin: "8px 0 12px", padding: "10px", borderRadius: "12px" }}
            >
              <option value="donation">Donation</option>
              <option value="loan">Loan</option>
            </select>
          </>
        )}

        {needType === "time" && (
          <>
            <label className="muted">Start</label>
            <input
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              style={{ width: "100%", margin: "8px 0 12px", padding: "10px", borderRadius: "12px" }}
            />

            <label className="muted">End</label>
            <input
              type="datetime-local"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
              style={{ width: "100%", margin: "8px 0 12px", padding: "10px", borderRadius: "12px" }}
            />

            <label className="muted">Hours committed (auto)</label>
            <input
              value={hoursCommitted}
              disabled
              placeholder="—"
              style={{
                width: "100%",
                margin: "8px 0 12px",
                padding: "10px",
                borderRadius: "12px",
                opacity: 0.85,
              }}
            />
          </>
        )}

        <button className="btn" type="submit" disabled={submitLoading}>
          {submitLoading ? "Submitting..." : "Submit pledge"}
        </button>
      </form>
    </div>
  );
}
