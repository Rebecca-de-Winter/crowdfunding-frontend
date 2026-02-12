import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import "./LoginPage.css";
import bfLogo from "../assets/backyard-festival-logo.png";

function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <img className="login-logo" src={bfLogo} alt="Backyard Festival" />
          <h1 className="login-title">Welcome back</h1>

          <p className="login-subtitle">
            Log in to create a festival, apply templates, manage pledges,
            and edit your fundraisers.
          </p>
        </header>

        <LoginForm />

        <footer className="login-footer">
          <p className="login-help">
            Just browsing? <Link to="/fundraisers">Explore festivals</Link>
          </p>

          <p className="login-help">
            New here? <Link to="/signup">Create an account</Link> and start your own festival.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default LoginPage;
