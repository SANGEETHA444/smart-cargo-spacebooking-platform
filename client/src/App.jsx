import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import TraderRegister from "./pages/TraderRegister";
import LspApply from "./pages/LspApply";
import Search from "./pages/Search";
import ContainerDetail from "./pages/ContainerDetail";
import MyBookings from "./pages/MyBookings";
import LspDashboard from "./pages/LspDashboard";
import LspContainers from "./pages/LspContainers";
import AdminPanel from "./pages/AdminPanel";
import ChatPage from "./pages/ChatPage";
import { useAuthStore } from "./store/authStore";

function Private({ roles, children }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/trader" element={<TraderRegister />} />
        <Route path="/register/lsp" element={<LspApply />} />
        <Route
          path="/search"
          element={
            <Private roles={["TRADER", "LSP", "ADMIN"]}>
              <Search />
            </Private>
          }
        />
        <Route
          path="/containers/:id"
          element={
            <Private roles={["TRADER", "LSP", "ADMIN"]}>
              <ContainerDetail />
            </Private>
          }
        />
        <Route
          path="/bookings"
          element={
            <Private roles={["TRADER", "LSP"]}>
              <MyBookings />
            </Private>
          }
        />
        <Route
          path="/lsp/dashboard"
          element={
            <Private roles={["LSP"]}>
              <LspDashboard />
            </Private>
          }
        />
        <Route
          path="/lsp/containers"
          element={
            <Private roles={["LSP"]}>
              <LspContainers />
            </Private>
          }
        />
        <Route
          path="/admin"
          element={
            <Private roles={["ADMIN"]}>
              <AdminPanel />
            </Private>
          }
        />
        <Route
          path="/chat"
          element={
            <Private roles={["TRADER", "LSP"]}>
              <ChatPage />
            </Private>
          }
        />
      </Routes>
    </Layout>
  );
}
