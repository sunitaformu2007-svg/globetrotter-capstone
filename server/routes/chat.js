import { Router } from "express";
import { PLACES, distanceKm } from "./places.js";
import { optionalAuth } from "../middleware/auth.js";
import { logEvent } from "../utils/analytics.js";

const router = Router();

const CATEGORY_WORDS = {
  hospital: "emergency",
  hospitals: "emergency",
  clinic: "emergency",
  emergency: "emergency",
  police: "emergency",
  hotel: "hotel",
  hotels: "hotel",
  stay: "hotel",
  restaurant: "restaurant",
  restaurants: "restaurant",
  food: "restaurant",
  eat: "restaurant",
  nightlife: "nightlife",
  club: "nightlife",
  bar: "nightlife",
  bars: "nightlife",
  attraction: "culture",
  attractions: "culture",
  museum: "culture",
  museums: "culture",
  market: "market",
  markets: "market",
  shopping: "market",
  shop: "market",
  nature: "nature",
  park: "nature",
  taxi: "transportation",
  transport: "transportation",
  bus: "transportation",
  airport: "transportation",
};

const AREA_WORDS = ["bonapriso", "bonanjo", "akwa", "deido", "bali", "bonaberi", "ndokoti"];

function extractBudgetFcfa(text) {
  const match = text.match(/(\d[\d,\.]*)\s*(?:fcfa|xaf|frs?)?/i);
  if (!match) return null;
  const num = Number(match[1].replace(/[,\.]/g, ""));
  return Number.isFinite(num) && num > 100 ? num : null;
}

function ruleBasedReply(message, { lat, lng } = {}) {
  const text = message.toLowerCase();

  let category = null;
  for (const [word, cat] of Object.entries(CATEGORY_WORDS)) {
    if (text.includes(word)) {
      category = cat;
      break;
    }
  }

  const area = AREA_WORDS.find((a) => text.includes(a));
  const budgetFcfa = extractBudgetFcfa(text);
  const wantsNearby = /near me|nearby|closest|nearest/.test(text);
  const wantsWeekend = /weekend|tonight|this evening/.test(text);

  let pool = category ? PLACES.filter((p) => p.category === category) : PLACES;

  if (area) {
    pool = pool.filter((p) => p.area.toLowerCase().includes(area));
  }
  if (budgetFcfa) {
    pool = pool.filter((p) => p.avg_cost_fcfa <= budgetFcfa);
  }
  if (wantsWeekend && !category) {
    pool = PLACES.filter((p) => ["nightlife", "culture", "nature"].includes(p.category));
  }

  if (wantsNearby && lat && lng) {
    pool = pool
      .map((p) => ({ ...p, distance_km: Number(distanceKm(lat, lng, p.lat, p.lng).toFixed(2)) }))
      .sort((a, b) => a.distance_km - b.distance_km);
  } else {
    pool = [...pool].sort((a, b) => b.rating - a.rating);
  }

  const results = pool.slice(0, 5);

  let reply;
  if (results.length === 0) {
    reply =
      "I couldn't find a match for that in my curated list yet — try asking about restaurants, hotels, hospitals, markets, or nightlife. " +
      "(Tip: connect a Gemini or OpenAI API key to unlock richer answers beyond the built-in list.)";
  } else if (category === "emergency") {
    reply = wantsNearby
      ? `Here's the closest emergency service I have on file:`
      : `Here are emergency services and their numbers — call ahead if it's urgent:`;
  } else {
    reply = `Here's what I'd suggest${area ? ` in ${area[0].toUpperCase()}${area.slice(1)}` : ""}${budgetFcfa ? ` under ${budgetFcfa.toLocaleString()} FCFA` : ""}:`;
  }

  return { reply, results };
}

function buildSystemPrompt(lang) {
  const langName = lang === "fr" ? "French" : lang === "pidgin" ? "Cameroonian Pidgin" : "English";
  return (
    `You are the Douala Compass travel assistant for Douala, Cameroon. Answer briefly and helpfully in ${langName}.\n\n` +
    `You have two sources of information:\n` +
    `1. A curated list of real places below — these have verified prices, phone numbers and hours. Prefer these when they fit the question, and mention that they're from the app's verified list.\n` +
    `2. Your own general knowledge of Douala — you may use this to suggest additional real places, tips, or answers when the curated list doesn't cover what's asked, or when the person wants more options. When you do this, clearly say it's a general suggestion (e.g. "I'm not 100% certain this is still open, worth double-checking") since it isn't verified by the app.\n\n` +
    `Never blend the two without being clear which is which. Never invent fake phone numbers or prices — only state prices/phone numbers that come from the curated list below.\n\n` +
    `CURATED PLACES (JSON): ${JSON.stringify(PLACES)}`
  );
}

// Google has renamed/retired Gemini model versions multiple times recently,
// so this tries a short list of likely-current names in order rather than
// hard-coding just one that might get retired again later.
const GEMINI_MODEL_CANDIDATES = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-flash-latest"];

async function tryGemini(message, lang) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  let lastError = null;
  for (const model of GEMINI_MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt(lang) }] },
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 500 },
        }),
      });
      if (!r.ok) {
        lastError = new Error(`Gemini model "${model}" responded ${r.status}: ${await r.text()}`);
        continue; // try the next candidate model
      }
      const data = await r.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) {
        lastError = new Error(`Gemini model "${model}" returned an empty response`);
        continue;
      }
      return reply;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini model candidates failed");
}

async function tryOpenAI(message, lang) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(lang) },
        { role: "user", content: message },
      ],
      temperature: 0.5,
    }),
  });
  if (!r.ok) throw new Error(`OpenAI responded ${r.status}`);
  const data = await r.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty OpenAI completion");
  return reply;
}

router.post("/", optionalAuth, async (req, res) => {
  const { message, lat, lng, lang } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const { results } = ruleBasedReply(message, { lat, lng });
  let reply = null;
  let source = "rule-based";

  // Prefer Gemini (free tier) if configured, then OpenAI, then the
  // built-in rule-based matcher — so the assistant always answers even
  // with zero API keys set up.
  try {
    reply = await tryGemini(message, lang);
    if (reply) source = "gemini";
  } catch (err) {
    console.error("Gemini chat failed, trying next option:", err.message);
  }

  if (!reply) {
    try {
      reply = await tryOpenAI(message, lang);
      if (reply) source = "openai";
    } catch (err) {
      console.error("OpenAI chat failed, falling back to rule-based reply:", err.message);
    }
  }

  if (!reply) {
    reply = ruleBasedReply(message, { lat, lng }).reply;
  }

  logEvent("chat_message", {
    userId: req.userId,
    userEmail: req.userEmail,
    meta: { message, source },
  });

  res.json({ reply, results, source });
});

export default router;
