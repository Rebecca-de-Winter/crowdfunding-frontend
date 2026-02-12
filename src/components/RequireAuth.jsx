// src/components/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    const from = location.pathname + location.search;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return children;
}
