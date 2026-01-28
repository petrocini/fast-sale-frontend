import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Login } from "@/pages/auth/login";
import App from "./App";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/products",
        element: (
          <div className="text-foreground p-10">
            Página de Produtos (Em breve)
          </div>
        ),
      },
      {
        path: "/events",
        element: (
          <div className="text-foreground p-10">
            Página de Eventos (Em breve)
          </div>
        ),
      },
      {
        path: "/settings",
        element: (
          <div className="text-foreground p-10">Configurações (Em breve)</div>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);
