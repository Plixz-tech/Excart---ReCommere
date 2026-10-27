
import { createBrowserRouter, Navigate } from "react-router-dom";

import Login from "../pages/Auth/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Orders from "../pages/Orders/Orders";
import AdminLayout from "../components/layout/AdminLayout";
import Users from "../pages/Users/Users";
import Brands from "../pages/DeviceCatalog/Brands";
import Models from "../pages/DeviceCatalog/Models";
import Catalog from "../pages/DeviceCatalog/Catalog";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "users",
        element: <Users />,
      },
      {
        path: "catalog",
        element: <Catalog />,
      },
      {
        path: "catalog/brands",
        element: <Brands />,
      },
      {
        path: "catalog/models",
        element: <Models />,
      },
    ],
  },
]);
