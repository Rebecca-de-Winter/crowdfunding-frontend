import { allFundraisers } from "../data.js";
import FundraiserCard from "../components/FundraiserCard";
import "./HomePage.css";

function HomePage() {
    console.log("HomePage rendered");
    console.log("Fundraisers length:", allFundraisers.length);

    return (
        <div id="fundraiser-list">
            {allFundraisers.map((fundraiserData, key) => {
              return <FundraiserCard key={key} fundraiserData={fundraiserData} />;  
            })}
        </div>
    );  
}

export default HomePage;