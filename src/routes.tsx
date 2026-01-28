import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Login } from "./pages/auth/login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: (
      <div className="text-white p-10">Página de Registro (Em construção)</div>
    ),
  },
]);
