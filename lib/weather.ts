// Live weather from Open-Meteo (https://open-meteo.com): free, no API key. Used by the agent's
// get_weather tool, on calls and in background tasks.

const CODES: Record<number, string> = {
  0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 48: "freezing fog",
  51: "light drizzle", 53: "drizzle", 55: "heavy drizzle", 56: "freezing drizzle", 57: "freezing drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain", 66: "freezing rain", 67: "freezing rain",
  71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains",
  80: "light showers", 81: "showers", 82: "violent showers", 85: "snow showers", 86: "heavy snow showers",
  95: "thunderstorm", 96: "thunderstorm with hail", 99: "thunderstorm with heavy hail",
};
const describe = (code: number) => CODES[code] ?? "mixed weather";

type Place = { name: string; latitude: number; longitude: number };

async function json<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Weather service error (${res.status})`);
  return res.json() as Promise<T>;
}

// ---- Finding the place --------------------------------------------------------------------
// Callers say places in many ways: "Kolkata", "Calcutta", "कोलकाता", "Salt Lake, Kolkata",
// "Kolkata West Bengal India". OpenStreetMap's Nominatim handles all of these (any script, old
// names, neighbourhoods); Open-Meteo's own search only matches clean English names. Vardaan is
// India-first, so Indian places win, but anywhere in the world works.

const cache = new Map<string, Place | null>();

/** Drop filler words the model or caller adds: "Kolkata city" → "Kolkata". */
const tidy = (s: string) =>
  s.replace(/\b(weather|forecast|in|at|for|city|town|district|area|today|tomorrow)\b/gi, " ").replace(/\s+/g, " ").replace(/^[\s,]+|[\s,]+$/g, "");

type NominatimHit = { lat: string; lon: string; name?: string; display_name: string; category?: string; importance?: number };

async function nominatim(q: string, india: boolean): Promise<Place | null> {
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=en&q=${encodeURIComponent(q)}` +
    (india ? "&countrycodes=in" : "");
  // Nominatim's usage policy asks for an identifying User-Agent and light use (we cache).
  const hits = await json<NominatimHit[]>(url, { "User-Agent": "Vardaan/0.1 (voice assistant; weather lookups)" });
  // Real places only (cities, towns, neighbourhoods), not shops or streets that share the name.
  const place = hits.find((h) => (h.category === "place" || h.category === "boundary") && (!india || (h.importance ?? 0) >= 0.25));
  if (!place) return null;
  const parts = place.display_name.split(",").map((x) => x.trim()).filter((x) => !/^\d[\d\s-]*$/.test(x)); // drop PIN codes
  const label = [...new Set([place.name || parts[0], parts.at(-2), parts.at(-1)].filter(Boolean))].join(", ");
  return { name: label, latitude: Number(place.lat), longitude: Number(place.lon) };
}

async function openMeteoExact(q: string): Promise<Place | null> {
  const first = q.split(",")[0].trim();
  const geo = await json<{ results?: { name: string; admin1?: string; country?: string; latitude: number; longitude: number; population?: number }[] }>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(first)}&count=10&language=en&format=json`,
  );
  // Its search is prefix-based ("Kolkatta" → "Kolkattampālaiyam"), so only accept an exact name.
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const exact = (geo.results ?? []).filter((r) => fold(r.name) === fold(first)).sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
  return exact ? { name: [exact.name, exact.admin1, exact.country].filter(Boolean).join(", "), latitude: exact.latitude, longitude: exact.longitude } : null;
}

async function findPlace(raw: string): Promise<Place | null> {
  const q = tidy(raw) || raw.trim();
  const key = q.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  let found: Place | null = null;
  for (const attempt of [() => nominatim(q, true), () => openMeteoExact(q), () => nominatim(q, false)]) {
    found = await attempt().catch(() => null);
    if (found) break;
  }
  cache.set(key, found);
  return found;
}

/** Current conditions plus a daily forecast (1–7 days) for a city or place name, as plain text. */
export async function getWeather(place: string, days = 3): Promise<string> {
  if (!place) return "Which city? Ask the user, or use the city you remember for them.";
  const p = await findPlace(place);
  if (!p) return `I couldn't find "${place}". Ask the user to repeat the city name, then retry with its English spelling.`;

  const n = Math.min(7, Math.max(1, Math.round(days)));
  const w = await json<{
    current: { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number };
    daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: (number | null)[] };
  }>(
    `https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}` +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      `&timezone=auto&forecast_days=${n}`,
  );

  const where = p.name;
  const c = w.current;
  const lines = [
    `Weather in ${where} right now: ${describe(c.weather_code)}, ${Math.round(c.temperature_2m)}°C (feels like ${Math.round(c.apparent_temperature)}°C), humidity ${c.relative_humidity_2m}%, wind ${Math.round(c.wind_speed_10m)} km/h.`,
    "Forecast:",
    ...w.daily.time.map((day, i) => {
      const label = new Date(`${day}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
      const rain = w.daily.precipitation_probability_max[i];
      return `- ${label}: ${describe(w.daily.weather_code[i])}, ${Math.round(w.daily.temperature_2m_min[i])}–${Math.round(w.daily.temperature_2m_max[i])}°C${rain != null ? `, ${rain}% chance of rain` : ""}`;
    }),
  ];
  return lines.join("\n");
}
