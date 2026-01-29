import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import FundraiserPage from "./pages/FundraiserPage.jsx";
import Layout from "./components/Layout.jsx";
import "./index.css";

const MyRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },

      // list page alias (so your NavBar link works)
      { path: "fundraisers", element: <HomePage /> },

      // detail page (relative path is best inside children)
      { path: "fundraiser/:id", element: <FundraiserPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={MyRouter} />
  </React.StrictMode>
);
