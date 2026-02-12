// src/components/LoginForm.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import postLogin from "../api/post-login.js";

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();

  // RequireAuth sends: state={{ from: location.pathname }}
  const from = location.state?.from || "/profile";

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setCredentials((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!credentials.username || !credentials.password) return;

    try {
      const response = await postLogin(credentials.username, credentials.password);

      window.localStorage.setItem("token", response.token);

      // ✅ tell NavBar (and anything else) auth state changed (same tab)
      window.dispatchEvent(new Event("auth-changed"));

      // ✅ send them back where they wanted to go
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || "Login failed");
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
          autoComplete="username"
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
          autoComplete="current-password"
        />
      </div>

      {error && <p>{error}</p>}

      <button type="submit">Login</button>
    </form>
  );
}

export default LoginForm;
