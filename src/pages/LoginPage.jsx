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
            Log in to create a festival, apply templates, and edit your fundraisers.
          </p>
        </header>

        <LoginForm />

        <footer className="login-footer">
          <p className="login-help">
            Just browsing? <Link to="/fundraisers">View fundraisers</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default LoginPage;
