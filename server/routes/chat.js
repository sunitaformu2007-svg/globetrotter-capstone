import { Router } from "express";
import { PLACES, distanceKm } from "./places.js";

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
    reply = "I couldn't find a match for that in Douala yet — try asking about restaurants, hotels, hospitals, markets, or nightlife.";
  } else if (category === "emergency") {
    reply = wantsNearby
      ? `Here's the closest emergency service I have on file:`
      : `Here are emergency services and their numbers — call ahead if it's urgent:`;
  } else {
    reply = `Here's what I'd suggest${area ? ` in ${area[0].toUpperCase()}${area.slice(1)}` : ""}${budgetFcfa ? ` under ${budgetFcfa.toLocaleString()} FCFA` : ""}:`;
  }

  return { reply, results };
}

router.post("/", async (req, res) => {
  const { message, lat, lng, lang } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const systemPrompt =
        `You are the Douala Compass travel assistant for Douala, Cameroon. ` +
        `Answer briefly and helpfully in ${lang === "fr" ? "French" : lang === "pidgin" ? "Cameroonian Pidgin" : "English"}. ` +
        `You only know about the places listed below — never invent places, phone numbers, or prices. ` +
        `If asked about something not in this list, say so honestly.\n\n` +
        `PLACES (JSON): ${JSON.stringify(PLACES.slice(0, 60))}`;

      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          temperature: 0.4,
        }),
      });
      if (!r.ok) throw new Error(`OpenAI responded ${r.status}`);
      const data = await r.json();
      const reply = data.choices?.[0]?.message?.content;
      if (!reply) throw new Error("Empty completion");

      // Still attach matching place cards from the rule-based matcher so the
      // UI can render result cards alongside the model's natural-language answer.
      const { results } = ruleBasedReply(message, { lat, lng });
      return res.json({ reply, results, source: "openai" });
    } catch (err) {
      console.error("OpenAI chat failed, falling back to rule-based reply:", err.message);
      // fall through to rule-based reply below
    }
  }

  const { reply, results } = ruleBasedReply(message, { lat, lng });
  res.json({ reply, results, source: "rule-based" });
});

export default router;
