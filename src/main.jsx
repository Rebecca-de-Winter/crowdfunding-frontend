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
import PledgeNeedPage from "./pages/PledgeNeedPage.jsx";

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

      // pledge a specific need
      { path: "fundraisers/:id/needs/:needId/pledge", element: <PledgeNeedPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={MyRouter} />
  </React.StrictMode>
);
