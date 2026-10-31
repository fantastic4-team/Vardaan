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

type Place = { name: string; admin1?: string; country?: string; latitude: number; longitude: number };

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Weather service error (${res.status})`);
  return res.json() as Promise<T>;
}

/** Current conditions plus a daily forecast (1–7 days) for a city or place name, as plain text. */
export async function getWeather(place: string, days = 3): Promise<string> {
  if (!place) return "Which city? Ask the user, or use the city you remember for them.";
  const geo = await json<{ results?: Place[] }>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`,
  );
  const p = geo.results?.[0];
  if (!p) return `I couldn't find a place called "${place}".`;

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

  const where = [p.name, p.admin1, p.country].filter(Boolean).join(", ");
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
