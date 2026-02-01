import { useState } from "react";
import { useNavigate } from "react-router-dom";
import postFundraiser from "../api/post-fundraiser.js";

function FundraiserForm() {
  const navigate = useNavigate();

  const [fundraiser, setFundraiser] = useState({
    title: "",
    description: "",
    goal: "",          // keep as "" for the form, convert on submit
    image_url: "",
    location: "",
    start_date: "",
    end_date: "",
    status: "draft",
    enable_rewards: false,
    sort_order: 0,
  });

  const handleChange = (event) => {
    const { id, value, type, checked } = event.target;

    setFundraiser((prev) => ({
      ...prev,
      [id]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? (value === "" ? "" : Number(value))
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // basic required validation
    if (
      !fundraiser.title ||
      !fundraiser.description ||
      fundraiser.goal === "" ||
      !fundraiser.location ||
      !fundraiser.start_date ||
      !fundraiser.end_date
    ) {
      console.log("Missing required fields");
      return;
    }

    try {
      const response = await postFundraiser(
        fundraiser.title,
        fundraiser.description,
        Number(fundraiser.goal),          // ensure number
        fundraiser.image_url,
        fundraiser.location,
        fundraiser.start_date,
        fundraiser.end_date,
        fundraiser.status,
        fundraiser.enable_rewards,
        Number(fundraiser.sort_order)     // ensure number
      );

      console.log(response);

      // If your API returns an id, you can navigate:
      // navigate(`/fundraisers/${response.id}`);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Name of Festival:</label>
        <input
          type="text"
          id="title"
          placeholder="Enter the name of your event/fundraiser/festival"
          value={fundraiser.title}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          placeholder="Short description of your event"
          value={fundraiser.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="goal">Goal:</label>
        <input
          type="number"
          id="goal"
          placeholder="Enter your money goal"
          value={fundraiser.goal}
          onChange={handleChange}
          min="0"
        />
      </div>

      <div>
        <label htmlFor="image_url">Link your Festival Image:</label>
        <input
          type="text"
          id="image_url"
          placeholder="Enter your image link here"
          value={fundraiser.image_url}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="location">Location:</label>
        <input
          type="text"
          id="location"
          placeholder="Enter your location"
          value={fundraiser.location}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="start_date">Start Date:</label>
        <input
          type="date"
          id="start_date"
          value={fundraiser.start_date}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="end_date">End Date:</label>
        <input
          type="date"
          id="end_date"
          value={fundraiser.end_date}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="status">Status:</label>
        <select id="status" value={fundraiser.status} onChange={handleChange}>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
        </select>
      </div>

      <div>
        <label htmlFor="enable_rewards">Enable Rewards</label>
        <input
          type="checkbox"
          id="enable_rewards"
          checked={fundraiser.enable_rewards}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="sort_order">Importance</label>
        <input
          type="number"
          id="sort_order"
          placeholder="Enter order of importance (0 for highest)"
          value={fundraiser.sort_order}
          onChange={handleChange}
          min="0"
        />
      </div>

      <button type="submit">Create Fundraiser</button>
    </form>
  );
}

export default FundraiserForm;
