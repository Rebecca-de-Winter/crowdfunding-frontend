// src/pages/PledgeNeedPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";

import findNeedDetailId from "../api/find-need-detail-id";
import getNeedDetail from "../api/get-need-detail";
import ItemModeDropdown from "../components/ItemModeDropdown";

import "./PledgeNeedPage.css";

/**
 * Convert a local date+time into ISO string (UTC) like "2026-02-06T09:30:00.000Z"
 */
function localDateTimeToIso(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const local = `${dateStr}T${timeStr}`; // interpreted as local time by Date()
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Build a datetime-local string from date+time.
 * Used for hour calcs and comparisons.
 */
function toDatetimeLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";
  return `${dateStr}T${timeStr}`;
}

/**
 * ISO -> local date string "YYYY-MM-DD"
 */
function isoToLocalDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * ISO -> local time string "HH:mm"
 */
function isoToLocalTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${hh}:${mm}`;
}

/**
 * Friendly AU date like: "Saturday 20 Dec 2025"
 */
function formatAuDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Friendly AU time like: "8:00 pm"
 */
function formatAuTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .toLowerCase();
}

function formatShiftLines(startIso, endIso) {
  const dateLine = formatAuDate(startIso);
  const startTime = formatAuTime(startIso);
  const endTime = formatAuTime(endIso);
  const timeLine =
    startTime && endTime ? `${startTime} – ${endTime}` : startTime || endTime || "";
  return { dateLine, timeLine };
}

/**
 * Convert "$60" / " 60 " / "60.5" into "60.50"
 */
function normaliseMoney(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

/**
 * Convert hours to "2.00"
 */
function normaliseHours(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

function calcHoursFromDateTimeParts(startDate, startTime, endDate, endTime) {
  const startLocal = toDatetimeLocal(startDate, startTime);
  const endLocal = toDatetimeLocal(endDate, endTime);
  if (!startLocal || !endLocal) return "";
  const start = new Date(startLocal);
  const end = new Date(endLocal);
  const ms = end - start;
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const hours = ms / (1000 * 60 * 60);
  return hours.toFixed(2);
}

function sameMinuteDateTimeParts(aDate, aTime, bDate, bTime) {
  return aDate === bDate && aTime === bTime && Boolean(aDate && aTime && bDate && bTime);
}

export default function PledgeNeedPage() {
  const { id, needId } = useParams();
  const navigate = useNavigate();

  const [need, setNeed] = useState(null);
  const [timeDetail, setTimeDetail] = useState(null);

  // --- bottom-of-form fields (as requested)
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  // money
  const [amount, setAmount] = useState("");

  // item
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState("donation");

  // time (split date/time)
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hoursCommitted, setHoursCommitted] = useState("");

  // required shift (split date/time too)
  const [reqStartDate, setReqStartDate] = useState("");
  const [reqStartTime, setReqStartTime] = useState("");
  const [reqEndDate, setReqEndDate] = useState("");
  const [reqEndTime, setReqEndTime] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  const needType = useMemo(() => need?.need_type ?? null, [need]);

  // Load need + time detail and prefill
  useEffect(() => {
    let alive = true;

    async function loadNeedAndDetail() {
      try {
        setIsLoading(true);
        setError(null);
        setTimeDetail(null);

        // reset required
        setReqStartDate("");
        setReqStartTime("");
        setReqEndDate("");
        setReqEndTime("");

        // base need
        const url = `${import.meta.env.VITE_API_URL}needs/${needId}/`;
        const res = await authFetch(url, { method: "GET" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!alive) return;

        setNeed(data);

        // reset type fields
        if (data.need_type === "money") setAmount("");
        if (data.need_type === "item") setItemName(data.title ?? "");
        if (data.need_type === "time") {
          setStartDate("");
          setStartTime("");
          setEndDate("");
          setEndTime("");
          setHoursCommitted("");
        }

        // time detail fetch
        if (data.need_type === "time") {
          const detailId = await findNeedDetailId("time", needId);
          if (!alive) return;

          if (detailId) {
            const detail = await getNeedDetail("time", detailId);
            if (!alive) return;

            setTimeDetail(detail);

            const rsd = isoToLocalDate(detail?.start_datetime);
            const rst = isoToLocalTime(detail?.start_datetime);
            const red = isoToLocalDate(detail?.end_datetime);
            const ret = isoToLocalTime(detail?.end_datetime);

            // store required
            setReqStartDate(rsd);
            setReqStartTime(rst);
            setReqEndDate(red);
            setReqEndTime(ret);

            // prefill pledge with required
            setStartDate(rsd);
            setStartTime(rst);
            setEndDate(red);
            setEndTime(ret);
            setHoursCommitted(calcHoursFromDateTimeParts(rsd, rst, red, ret));
          }
        }
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    loadNeedAndDetail();
    return () => {
      alive = false;
    };
  }, [needId]);

  // Auto-calc hours whenever time inputs change
  useEffect(() => {
    if (needType !== "time") return;
    const computed = calcHoursFromDateTimeParts(startDate, startTime, endDate, endTime);
    setHoursCommitted(computed);
  }, [needType, startDate, startTime, endDate, endTime]);

  const shiftChanged =
    needType === "time" &&
    reqStartDate &&
    reqStartTime &&
    reqEndDate &&
    reqEndTime &&
    (!sameMinuteDateTimeParts(startDate, startTime, reqStartDate, reqStartTime) ||
      !sameMinuteDateTimeParts(endDate, endTime, reqEndDate, reqEndTime));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!needType) return;

    try {
      setSubmitLoading(true);
      setError(null);

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
        if (!startDate || !startTime || !endDate || !endTime) {
          throw new Error("Please choose a start and end date/time.");
        }

        const startIso = localDateTimeToIso(startDate, startTime);
        const endIso = localDateTimeToIso(endDate, endTime);
        if (!startIso || !endIso) throw new Error("Please enter valid start/end values.");
        if (new Date(endIso) <= new Date(startIso)) throw new Error("End must be after start.");

        const hrs = normaliseHours(hoursCommitted);
        if (!hrs) throw new Error("End must be after start (hours must be > 0).");
      }

      // 1) base pledge
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

      // 2) detail
      if (needType === "money") {
        const amt = normaliseMoney(amount);
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
        const startIso = localDateTimeToIso(startDate, startTime);
        const endIso = localDateTimeToIso(endDate, endTime);
        const hrs = normaliseHours(hoursCommitted);

        const timePayload = {
          pledge: pledgeId,
          start_datetime: startIso,
          end_datetime: endIso,
          hours_committed: hrs,
          comment,
        };

        const r = await authFetch(`${import.meta.env.VITE_API_URL}time-pledges/`, {
          method: "POST",
          body: JSON.stringify(timePayload),
        });

        if (!r.ok) throw new Error(await r.text());
      }

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

  const { dateLine, timeLine } = formatShiftLines(
    timeDetail?.start_datetime,
    timeDetail?.end_datetime
  );

  return (
    <div className="fundraiser pledgePage">
      <Link className="fundraiser__back pledgePage__back" to={`/fundraisers/${id}`}>
        ← Back to fundraiser
      </Link>

      <div className="pledgePage__titleRow">
        <h1 className="pledgePage__title">Pledge: {need.title}</h1>
        {needType ? <span className="pledgePage__typePill">{needType}</span> : null}
      </div>

      {need.description ? <p className="muted pledgePage__desc">{need.description}</p> : null}

      {needType === "time" && timeDetail && (
        <div className="panel shiftPanel">
          <h3 className="shiftPanel__title">Required shift</h3>

          <div className="shiftGrid">
            <div className="shiftRow">
              <div className="muted shiftLabel">Date of shift</div>
              <div className="shiftValue">{dateLine || "—"}</div>
            </div>

            <div className="shiftRow">
              <div className="muted shiftLabel">Time of shift</div>
              <div className="shiftValue">{timeLine || "—"}</div>
            </div>

            <div className="shiftRow">
              <div className="muted shiftLabel">Role</div>
              <div className="shiftValue shiftSubtle">{timeDetail.role_title || "—"}</div>
            </div>

            <div className="shiftRow">
              <div className="muted shiftLabel">Location</div>
              <div className="shiftValue shiftSubtle">{timeDetail.location || "—"}</div>
            </div>

            <div className="shiftRow">
              <div className="muted shiftLabel">Volunteers needed</div>
              <div className="shiftValue shiftSubtle">{timeDetail.volunteers_needed ?? "—"}</div>
            </div>
          </div>
        </div>
      )}

      {shiftChanged && (
        <div className="notice">
          <div className="notice__title">Heads up</div>
          <div className="notice__text">
            You’ve changed the pledge time from the required shift. If you’re offering a different
            time, add a quick note in the comment so the organiser understands.
          </div>
        </div>
      )}

      <form className="panel pledgeForm" onSubmit={handleSubmit}>
        {/* TIME inputs FIRST (as requested) */}
        {needType === "time" && (
          <>
            <div className="pledgeField">
              <label className="muted">Start date</label>
              <input
                className="pledgeInput"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="pledgeField">
              <label className="muted">Start time</label>
              <input
                className="pledgeInput"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="pledgeField">
              <label className="muted">End date</label>
              <input
                className="pledgeInput"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="pledgeField">
              <label className="muted">End time</label>
              <input
                className="pledgeInput"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="pledgeField">
              <label className="muted">Hours committed (auto)</label>
              <input className="pledgeInput pledgeHours" value={hoursCommitted} disabled placeholder="—" />
            </div>

            <div className="pledgeDivider" />
          </>
        )}

        {/* MONEY */}
        {needType === "money" && (
          <div className="pledgeField">
            <label className="muted">Amount (AUD)</label>
            <input
              className="pledgeInput"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 60.00"
              inputMode="decimal"
            />
          </div>
        )}

        {/* ITEM */}
        {needType === "item" && (
          <>
            <div className="pledgeField">
              <label className="muted">Item name</label>
              <input
                className="pledgeInput"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="PA Speakers"
              />
            </div>

            <div className="pledgeField">
              <label className="muted">Quantity</label>
              <input
                className="pledgeInput"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="pledgeField">
              <label className="muted">Mode</label>
              <ItemModeDropdown value={mode} onChange={setMode} disabled={submitLoading} />
            </div>

            <div className="pledgeDivider" />
          </>
        )}

        {/* COMMENT + ANON LAST (as requested) */}
        <div className="pledgeField">
          <label className="muted">Comment</label>
          <textarea
            className="pledgeTextarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
          />
        </div>

        <div className="pledgeToggleRow">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          <span>Anonymous</span>
        </div>

        <div className="pledgeDivider" />

        <button className="btn" type="submit" disabled={submitLoading}>
          {submitLoading ? "Submitting..." : "Submit pledge"}
        </button>
      </form>
    </div>
  );
}
