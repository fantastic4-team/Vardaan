// Web search for the Vardaan agent. Uses Brave Search or Tavily if configured, and falls
// back to DuckDuckGo HTML scraping (no key required) for local development.
// Configure BRAVE_API_KEY or TAVILY_API_KEY in .env.local for production-grade results.

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

/** Fetch up to `limit` web search results for `query`. Never throws; returns [] on failure. */
export async function webSearch(query: string, limit = 5): Promise<SearchResult[]> {
  try {
    if (process.env.TAVILY_API_KEY) return await tavilySearch(query, limit);
    if (process.env.BRAVE_API_KEY) return await braveSearch(query, limit);
    return await duckduckgoSearch(query, limit);
  } catch (err) {
    console.error("[search] error:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ---- Tavily (https://tavily.com, free tier available) ------------------------------------------

async function tavilySearch(query: string, limit: number): Promise<SearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: limit,
      search_depth: "basic",
      include_answer: false,
    }),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  const data = await res.json();
  return ((data.results ?? []) as { title: string; url: string; content: string }[]).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content?.slice(0, 400) ?? "",
  }));
}

// ---- Brave Search (https://api.search.brave.com, free tier: 2000 queries/month) ----------------

async function braveSearch(query: string, limit: number): Promise<SearchResult[]> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(limit));
  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": process.env.BRAVE_API_KEY!,
    },
  });
  if (!res.ok) throw new Error(`Brave ${res.status}`);
  const data = await res.json();
  return ((data.web?.results ?? []) as { title: string; url: string; description: string }[]).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description ?? "",
  }));
}

// ---- DuckDuckGo scrape (no key, rate-limited, good for local dev) ------------------------------

async function duckduckgoSearch(query: string, limit: number): Promise<SearchResult[]> {
  // Use the DuckDuckGo instant-answer JSON API (no auth required, limited but useful).
  const url = new URL("https://api.duckduckgo.com/");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("no_redirect", "1");
  url.searchParams.set("no_html", "1");
  url.searchParams.set("t", "vardaan");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Vardaan/1.0 (personal AI assistant)" },
  });
  if (!res.ok) throw new Error(`DuckDuckGo ${res.status}`);
  const data = await res.json();

  const results: SearchResult[] = [];

  // Primary abstract
  if (data.AbstractText && data.AbstractURL) {
    results.push({ title: data.Heading || query, url: data.AbstractURL, snippet: data.AbstractText });
  }

  // Related topics
  for (const topic of (data.RelatedTopics ?? []) as { Text?: string; FirstURL?: string; Topics?: unknown[] }[]) {
    if (results.length >= limit) break;
    if (topic.Text && topic.FirstURL) {
      results.push({ title: topic.Text.slice(0, 80), url: topic.FirstURL, snippet: topic.Text });
    }
  }

  // Results (instant answers)
  for (const r of (data.Results ?? []) as { Text?: string; FirstURL?: string }[]) {
    if (results.length >= limit) break;
    if (r.Text && r.FirstURL) {
      results.push({ title: r.Text.slice(0, 80), url: r.FirstURL, snippet: r.Text });
    }
  }

  return results;
}

/** Format search results as a concise text block for the LLM prompt. */
export function formatResults(results: SearchResult[]): string {
  if (!results.length) return "No search results found.";
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
    .join("\n\n");
}
