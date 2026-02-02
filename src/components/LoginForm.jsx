import { useState } from "react";
import { useNavigate } from "react-router-dom";
import postLogin from "../api/post-login.js";

function LoginForm() {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setCredentials((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!credentials.username || !credentials.password) return;

    try {
      const response = await postLogin(credentials.username, credentials.password);
      window.localStorage.setItem("token", response.token);
      navigate("/");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          placeholder="Enter username"
          onChange={handleChange}
          value={credentials.username}
        />
      </div>

      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          placeholder="Password"
          onChange={handleChange}
          value={credentials.password}
        />
      </div>

      {error && <p>{error}</p>}

      <button type="submit">Login</button>
    </form>
  );
}

export default LoginForm;
