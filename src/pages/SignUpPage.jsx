import { Link } from "react-router-dom";
import SignUpForm from "../components/SignUpForm";
import "./LoginPage.css"; // ✅ reuse the same CSS as LoginPage
import bfLogo from "../assets/backyard-festival-logo.png";

function SignUpPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <img className="login-logo" src={bfLogo} alt="Backyard Festival" />
          <h1 className="login-title">Create your account</h1>
          <p className="login-subtitle">
            Sign up to create a festival, apply templates, and edit your fundraisers.
          </p>
        </header>

        <SignUpForm />

        <footer className="login-footer">
          <p className="login-help">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
          <p className="login-help" style={{ marginTop: 8 }}>
            Just browsing? <Link to="/fundraisers">View fundraisers</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default SignUpPage;

