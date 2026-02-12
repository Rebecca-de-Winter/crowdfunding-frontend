const getMyPledgesReport = async () => {
  const token = window.localStorage.getItem("token");

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}reports/my-pledges/`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch my pledges.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error loading my pledges:", err);
    throw err;
  }
};

export default getMyPledgesReport;
