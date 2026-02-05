import { useParams, Link } from "react-router-dom";

export default function PledgeNeedPage() {
  const { id, needId } = useParams();

  return (
    <div className="fundraiser" style={{ paddingTop: 18 }}>
      <Link className="fundraiser__back" to={`/fundraisers/${id}`}>
        ← Back to fundraiser
      </Link>

      <h1>Pledge</h1>
      <p className="muted">Fundraiser ID: {id}</p>
      <p className="muted">Need ID: {needId}</p>

      <div className="panel" style={{ marginTop: 14 }}>
        <p className="muted">
          Next we’ll load the need details here and show the correct form (money/time/item).
        </p>
      </div>
    </div>
  );
}
