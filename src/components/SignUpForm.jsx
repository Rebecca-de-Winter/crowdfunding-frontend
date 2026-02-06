import { useState } from "react";
import { useNavigate } from "react-router-dom";
import postSignUp from "../api/post-signup";
import postLogin from "../api/post-login";

function SignUpForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in username, email, and both password fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1) create account
      await postSignUp({
        username: form.username,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
      });

      // 2) auto login
      const loginRes = await postLogin(form.username, form.password);
      window.localStorage.setItem("token", loginRes.token);

      // 3) go home with a flash message
      sessionStorage.setItem("flash", "Signup successful — you’re now logged in!");
navigate("/");

    } catch (e) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username:</label>
        <input id="username" value={form.username} onChange={handleChange} />
      </div>

      <div>
        <label htmlFor="first_name">First name:</label>
        <input id="first_name" value={form.first_name} onChange={handleChange} />
      </div>

      <div>
        <label htmlFor="last_name">Last name:</label>
        <input id="last_name" value={form.last_name} onChange={handleChange} />
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" value={form.email} onChange={handleChange} />
      </div>

      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={form.password}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm password:</label>
        <input
          type="password"
          id="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
        />
      </div>

      {error && <p>{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Sign up"}
      </button>
    </form>
  );
}

export default SignUpForm;
