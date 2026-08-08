import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/dashboard");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="w-12 h-12 rounded-full bg-hero-gradient text-white flex items-center justify-center mx-auto mb-3">
            <Compass size={22} />
          </span>
          <h1 className="text-2xl font-display font-bold text-ink">Welcome back</h1>
          <p className="text-ink/60 text-sm mt-1">Sign in to save places and plan your trip.</p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-ink/60 mt-4">
          New here?{" "}
          <Link to="/register" className="text-ocean font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
