import { Link } from "react-router-dom";
import "./FundraiserCard.css";

function FundraiserCard({ fundraiserData }) {
  const { id, image, title } = fundraiserData;
  const fundraiserLink = `/fundraiser/${id}`;

  return (
    <div className="fundraiser-card">
      <Link to={fundraiserLink}>
        <img src={image} alt={title} />
        <h3>{title}</h3>
      </Link>
    </div>
  );
}

export default FundraiserCard;
