import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import FundraisersPage from "./pages/FundraisersPage.jsx";

import HomePage from "./pages/HomePage.jsx";
import FundraiserPage from "./pages/FundraiserPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Layout from "./components/Layout.jsx";
import "./index.css";

const MyRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
  { index: true, element: <HomePage /> },
  { path: "fundraisers", element: <FundraisersPage /> },
  { path: "login", element: <LoginPage /> },
  { path: "fundraiser/:id", element: <FundraiserPage /> },
],

  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={MyRouter} />
  </React.StrictMode>
);
