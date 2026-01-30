async function postLogin(username, password) {
  const url = `${import.meta.env.VITE_API_URL}fundraisers`;
  const response = await fetch(url, {
    method: "POST", // We need to tell the server that we are sending JSON data so we set the Content-Type header to application/json
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "title": "",
      "description": "",
      "goal": "",
      "image_url": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "status": "draft",
      "enable_rewards": true,
      "sort_order": 0
    }),
  });

  if (!response.ok) {
    const fallbackError = `Error trying to login`;

    const data = await response.json().catch(() => {
      throw new Error(fallbackError);
    });

    const errorMessage = data?.detail ?? fallbackError;
    throw new Error(errorMessage);
  }

  return await response.json();
}

export default postLogin;