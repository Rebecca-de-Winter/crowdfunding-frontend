import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import FundraisersPage from "./pages/FundraisersPage.jsx";
import FundraiserPage from "./pages/FundraiserPage.jsx";
import CreateFestivalPage from "./pages/CreateFestivalPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import EditFestivalPage from "./pages/EditFestivalPage.jsx";
import PledgeNeedPage from "./pages/PledgeNeedPage.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

import "./index.css";

const MyRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },

      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignUpPage /> },

      // list page
      { path: "fundraisers", element: <FundraisersPage /> },

      // create page (protected)
      {
        path: "fundraisers/new",
        element: (
          <RequireAuth>
            <CreateFestivalPage />
          </RequireAuth>
        ),
      },

      // detail page
      { path: "fundraisers/:id", element: <FundraiserPage /> },

      // edit page (protected)
      {
        path: "fundraisers/:id/edit",
        element: (
          <RequireAuth>
            <EditFestivalPage />
          </RequireAuth>
        ),
      },

      // pledge a specific need (protected)
      {
        path: "fundraisers/:id/needs/:needId/pledge",
        element: (
          <RequireAuth>
            <PledgeNeedPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={MyRouter} />
  </React.StrictMode>
);
