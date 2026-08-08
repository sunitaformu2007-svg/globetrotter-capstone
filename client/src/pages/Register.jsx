import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const INTERESTS = [
  { key: "restaurant", label: "Restaurants" },
  { key: "cafe", label: "Cafés" },
  { key: "nightlife", label: "Nightlife" },
  { key: "hotel", label: "Hotels" },
  { key: "culture", label: "Culture" },
  { key: "market", label: "Markets" },
  { key: "nature", label: "Nature" },
  { key: "transportation", label: "Getting around" },
];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("Douala");
  const [password, setPassword] = useState("");
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function toggle(key) {
    setInterests((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, email, password, location, preferences: interests });
      navigate("/dashboard");
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
          <h1 className="text-2xl font-display font-bold text-ink">Create your account</h1>
          <p className="text-ink/60 text-sm mt-1">Tell us what you're into so we can point you to the right spots.</p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Neighborhood in Douala</label>
            <input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bonapriso, Akwa, Deido"
              className="input"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">What are you into? (pick any)</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button
                  type="button"
                  key={i.key}
                  onClick={() => toggle(i.key)}
                  className={interests.includes(i.key) ? "chip-active" : "chip hover:bg-cloud"}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-ink/60 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-ocean font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
