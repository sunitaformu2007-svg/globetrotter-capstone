import { useState } from "react";
import { Sun, Coffee, Sunset } from "lucide-react";
import { Api, fcfa } from "../lib/api";

const INTERESTS = [
  { key: "food", label: "Food" },
  { key: "nightlife", label: "Nightlife" },
  { key: "museums", label: "Museums" },
  { key: "shopping", label: "Shopping" },
  { key: "beaches", label: "Beaches / nature" },
  { key: "family", label: "Family" },
  { key: "adventure", label: "Adventure" },
];

export default function TripPlanner() {
  const [budget, setBudget] = useState(100000);
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState(["food", "nightlife"]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  function toggleInterest(key) {
    setInterests((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]));
  }

  async function generate(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await Api.planTrip({ budget_fcfa: Number(budget), days: Number(days), interests });
      setPlan(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <span className="eyebrow">Trip planner</span>
      <h1 className="section-title mt-1 mb-2">Build your Douala itinerary</h1>
      <p className="text-ink/60 mb-8 max-w-xl">
        Tell us your budget, how long you're around, and what you're into — we'll put together a
        day-by-day plan from real places around the city.
      </p>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8">
        <form onSubmit={generate} className="card p-6 space-y-5 h-fit">
          <div>
            <label className="label">Total budget (FCFA)</label>
            <input
              type="number"
              min="10000"
              step="5000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Number of days</label>
            <input
              type="number"
              min="1"
              max="14"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button
                  type="button"
                  key={i.key}
                  onClick={() => toggleInterest(i.key)}
                  className={interests.includes(i.key) ? "chip-active" : "chip hover:bg-cloud"}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Building your plan…" : "Generate itinerary"}
          </button>
        </form>

        <div>
          {!plan && (
            <div className="card p-10 text-center text-ink/50">
              Fill in the form and generate a plan to see it here.
            </div>
          )}

          {plan && (
            <div className="space-y-6">
              <div className="card p-5 flex flex-wrap gap-6">
                <Stat label="Days" value={plan.days} />
                <Stat label="Est. transport" value={fcfa(plan.estimated_transport_fcfa)} />
                <Stat label="Budget" value={fcfa(plan.budget_fcfa)} />
              </div>

              {plan.itinerary.map((day) => (
                <div key={day.day} className="card p-5">
                  <h3 className="font-display font-semibold text-lg mb-3">Day {day.day}</h3>
                  <div className="space-y-3">
                    <DaySlot icon={<Sun size={16} />} label="Morning" place={day.morning} />
                    <DaySlot icon={<Coffee size={16} />} label="Lunch" place={day.lunch} />
                    <DaySlot icon={<Sunset size={16} />} label="Afternoon / evening" place={day.afternoon} />
                  </div>
                </div>
              ))}

              <div className="card p-5">
                <h3 className="font-display font-semibold mb-3">Hotel recommendations</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {plan.hotel_recommendations.map((h) => (
                    <div key={h.id} className="rounded-xl border border-cloud p-3">
                      <p className="font-semibold text-sm text-ink">{h.name}</p>
                      <p className="text-xs text-ink/50">{h.area}</p>
                      <p className="text-sm font-mono text-ocean mt-1">{fcfa(h.avg_cost_fcfa)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink/40 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-display font-bold text-ink">{value}</p>
    </div>
  );
}

function DaySlot({ icon, label, place }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-full bg-mist text-ocean flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-xs text-ink/40 uppercase tracking-wide">{label}</p>
        {place ? (
          <>
            <p className="font-medium text-ink">{place.name}</p>
            <p className="text-xs text-ink/50">{place.area}</p>
          </>
        ) : (
          <p className="text-sm text-ink/40">Free time</p>
        )}
      </div>
    </div>
  );
}
