import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-brand">
            CargoShare
          </Link>
          <nav className="flex gap-4 text-sm items-center">
            {user?.role === "TRADER" && (
              <>
                <NavLink to="/search" className="nav-link">
                  Search
                </NavLink>
                <NavLink to="/bookings" className="nav-link">
                  My bookings
                </NavLink>
                <NavLink to="/chat" className="nav-link">
                  Chat
                </NavLink>
              </>
            )}
            {user?.role === "LSP" && (
              <>
                <NavLink to="/lsp/dashboard" className="nav-link">
                  Dashboard
                </NavLink>
                <NavLink to="/lsp/containers" className="nav-link">
                  Containers
                </NavLink>
              </>
            )}
            {user?.role === "ADMIN" && (
              <NavLink to="/admin" className="nav-link">
                Admin
              </NavLink>
            )}
            {user ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="text-slate-400 hover:text-white"
              >
                Logout ({user.name})
              </button>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register/trader" className="bg-brand px-3 py-1 rounded-md text-white">
                  Sign up
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
