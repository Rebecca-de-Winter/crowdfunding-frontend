const getMyFundraisersReport = async () => {
  const token = window.localStorage.getItem("token");
  const base = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  const url = `${base}/reports/my-fundraisers/`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
      Accept: "application/json",
    },
  });

  const text = await response.text();
  if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
  return text ? JSON.parse(text) : null;
};


export default getMyFundraisersReport;
