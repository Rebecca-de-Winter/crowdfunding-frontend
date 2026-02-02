import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import FundraisersPage from "./pages/FundraisersPage.jsx";
import FundraiserPage from "./pages/FundraiserPage.jsx";
import CreateFestivalPage from "./pages/CreateFestivalPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

import EditFestivalPage from "./pages/EditFestivalPage.jsx";

import "./index.css";

const MyRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },

      { path: "login", element: <LoginPage /> },

      // list page
      { path: "fundraisers", element: <FundraisersPage /> },

      // create page
      { path: "fundraisers/new", element: <CreateFestivalPage /> },

      // detail page
      { path: "fundraisers/:id", element: <FundraiserPage /> },

      // edit page
      { path: "fundraisers/:id/edit", element: <EditFestivalPage /> },

      // NOTE:
      // We intentionally remove the old singular route:
      // { path: "fundraiser/:id", element: <FundraiserPage /> },
      // because it conflicts with your new consistent URL scheme.
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={MyRouter} />
  </React.StrictMode>
);
