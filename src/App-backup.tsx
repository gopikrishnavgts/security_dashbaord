import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Live from './pages/Live';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Zones from './pages/Zones';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "live",
        element: <Live />,
      },
      {
        path: "alerts",
        element: <Alerts />,
      },
      {
        path: "analytics",
        element: <Analytics />,
      },
      {
        path: "zones",
        element: <Zones />,
      },
    ],
  },
]);

export default function App() {
  const { user } = useStore();

  // If no user is logged in, show login page
  if (!user) {
    return <Login />;
  }

  return <RouterProvider router={router} />;
}
