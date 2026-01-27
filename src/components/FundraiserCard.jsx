import { Link } from "react-router-dom";

function FundraiserCard(props) {
  const { fundraiserData: {image, title} } = props;

  return (
    <div>
      <Link to="/fundraiser">
        <img src={image} />
        <h3>{title}</h3>
      </Link>
    </div>
  );
}

export default FundraiserCard; // also can be fundraiserData.title etc see chapter 8. 