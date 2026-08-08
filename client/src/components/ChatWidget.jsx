import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Star, Phone, Languages } from "lucide-react";
import { Api, fcfa } from "../lib/api";

const SUGGESTIONS = [
  "Find the nearest hospital",
  "Recommend hotels under 40,000 FCFA",
  "Best restaurants in Bonapriso",
  "Weekend nightlife ideas",
];

const LANGS = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "pidgin", label: "Pidgin" },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Mbolo! I'm your Douala assistant. Ask me about restaurants, hotels, hospitals, transport, or things to do — try one of the suggestions below.",
      results: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [coords, setCoords] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 4000 }
      );
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setSending(true);
    try {
      const res = await Api.chat({ message, lang, ...(coords || {}) });
      setMessages((m) => [...m, { role: "assistant", text: res.reply, results: res.results || [] }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "I couldn't reach the assistant server just now. Is it running?", results: [] },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-[150] w-14 h-14 rounded-full bg-hero-gradient text-white shadow-card-hover flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Open chat assistant"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-[150] w-[92vw] max-w-sm h-[70vh] max-h-[560px] card flex flex-col overflow-hidden">
          <div className="bg-hero-gradient text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-display font-semibold">Douala Assistant</p>
              <p className="text-xs text-white/70">Ask me anything about the city</p>
            </div>
            <div className="flex items-center gap-1 bg-white/15 rounded-full p-1">
              <Languages size={13} className="ml-1 text-white/70" />
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`text-[10px] px-2 py-1 rounded-full font-semibold transition ${
                    lang === l.code ? "bg-white text-ocean" : "text-white/80"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-mist">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-ocean text-white" : "bg-white border border-cloud text-ink"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.results?.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.results.map((r) => (
                        <div key={r.id} className="rounded-lg bg-mist border border-cloud px-2.5 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-ink">{r.name}</span>
                            {r.rating && (
                              <span className="text-[10px] flex items-center gap-0.5 text-ink/60">
                                <Star size={10} className="fill-sun text-sun" /> {r.rating}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[10px] text-ink/50">{r.area}</span>
                            {r.phone ? (
                              <a href={`tel:${r.phone}`} className="text-[10px] text-palm font-semibold flex items-center gap-0.5">
                                <Phone size={10} /> {r.phone}
                              </a>
                            ) : (
                              <span className="text-[10px] font-mono text-ocean">{fcfa(r.avg_cost_fcfa)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-cloud rounded-2xl px-3 py-2 text-sm text-ink/50">Typing…</div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-mist">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] chip hover:bg-ocean hover:text-white hover:border-ocean transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-cloud p-2 bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Douala…"
              className="input flex-1 text-sm"
            />
            <button type="submit" className="btn-primary !px-3 !py-2.5" aria-label="Send message" disabled={sending}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
