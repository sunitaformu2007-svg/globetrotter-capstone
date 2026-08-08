import { Link } from "react-router-dom";
import { Compass, Share2, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink text-white/80 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 font-display font-bold text-lg text-white mb-3">
            <span className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center">
              <Compass size={16} strokeWidth={2.5} />
            </span>
            Douala Travel Assistant
          </div>
          <p className="text-sm text-white/60">
            Your guide to getting around Cameroon's economic capital — restaurants, hotels, transport
            and safety, all in one place.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" aria-label="Share on social" className="hover:text-white transition-colors"><Share2 size={18} /></a>
            <a href="mailto:hello@doualatravel.app" aria-label="Email" className="hover:text-white transition-colors"><Mail size={18} /></a>
          </div>
        </div>

        <FooterCol title="Explore" links={[
          ["/restaurants", "Restaurants"],
          ["/hotels", "Hotels"],
          ["/attractions", "Attractions"],
          ["/map", "Map"],
        ]} />
        <FooterCol title="Plan" links={[
          ["/planner", "Trip Planner"],
          ["/emergency", "Emergency services"],
          ["/dashboard", "Your dashboard"],
        ]} />
        <FooterCol title="Account" links={[
          ["/login", "Sign in"],
          ["/register", "Create account"],
        ]} />
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        Built for Douala. Places data is a curated starting set — verify hours and prices before you go.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="text-white font-semibold text-sm mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="text-sm text-white/60 hover:text-white transition-colors">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
