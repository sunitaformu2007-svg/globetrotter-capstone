import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Compass, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/explore", label: "Explore" },
  { to: "/map", label: "Map" },
  { to: "/planner", label: "Trip Planner" },
  { to: "/hotels", label: "Hotels" },
  { to: "/restaurants", label: "Restaurants" },
  { to: "/attractions", label: "Attractions" },
  { to: "/emergency", label: "Emergency" },
];

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? "text-ocean" : "text-ink/70 hover:text-ocean"}`;

  return (
    <header className="sticky top-0 z-50 glass shadow-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2 font-display font-bold text-lg text-ink">
            <span className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center text-white">
              <Compass size={18} strokeWidth={2.5} />
            </span>
            Douala Travel Assistant
          </NavLink>

          <nav className="hidden lg:flex items-center gap-6">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <NavLink to="/dashboard" className="btn-ghost">
                  {user?.name?.split(" ")[0] || "Dashboard"}
                </NavLink>
                <button
                  className="btn-primary"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn-ghost">
                  Sign in
                </NavLink>
                <NavLink to="/register" className="btn-primary">
                  Get started
                </NavLink>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 rounded-lg text-ink hover:bg-mist"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-cloud bg-white px-4 py-4 flex flex-col gap-3">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <div className="border-t border-cloud pt-3 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <NavLink to="/dashboard" className="btn-ghost w-full" onClick={() => setOpen(false)}>
                  Dashboard
                </NavLink>
                <button
                  className="btn-primary w-full"
                  onClick={() => {
                    logout();
                    setOpen(false);
                    navigate("/");
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn-ghost w-full" onClick={() => setOpen(false)}>
                  Sign in
                </NavLink>
                <NavLink to="/register" className="btn-primary w-full" onClick={() => setOpen(false)}>
                  Get started
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
