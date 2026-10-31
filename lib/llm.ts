// Minimal client for any OpenAI-compatible chat API with tool calling: OpenAI, Groq, Google Gemini
// (OpenAI-compatible endpoint), OpenRouter, or a local Ollama server. Configure with environment
// variables (see .env.example).
//
// Several providers can be configured at once. They are tried in order (custom, OpenAI, Groq,
// Gemini), and each can have backup models. If one is out of credit, rate-limited or down, the
// next one answers instead, so a call never stalls on a single provider.

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

export type ToolSpec = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

type Provider = { baseUrl: string; apiKey?: string; models: string[]; name: string };

const list = (v?: string) => v?.split(",").map((m) => m.trim()).filter(Boolean);

/** Every configured provider, in the order they're tried. */
export function providers(): Provider[] {
  const env = process.env;
  const out: Provider[] = [];
  if (env.LLM_BASE_URL && env.LLM_MODEL) {
    out.push({ baseUrl: env.LLM_BASE_URL, apiKey: env.LLM_API_KEY, models: [env.LLM_MODEL], name: "custom" });
  }
  if (env.OPENAI_API_KEY) {
    out.push({
      baseUrl: "https://api.openai.com/v1",
      apiKey: env.OPENAI_API_KEY,
      models: list(env.OPENAI_MODEL) ?? ["gpt-5.4-mini"],
      name: "OpenAI",
    });
  }
  if (env.GROQ_API_KEY) {
    // llama-3.3-70b-versatile was retired by Groq. Groq's free tier limits tokens per minute *per
    // model*, so the backups add capacity as well as resilience.
    const main = env.LLM_BASE_URL ? undefined : env.LLM_MODEL;
    out.push({
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: env.GROQ_API_KEY,
      models: [...new Set([main || "openai/gpt-oss-120b", ...(list(env.LLM_FALLBACK_MODELS) ?? ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"])])],
      name: "Groq",
    });
  }
  if (env.GEMINI_API_KEY) {
    // gemini-2.5-flash is closed to new keys; flash-lite answers a full tool round trip in ~2s
    // (gemini-3.5-flash took ~30s, too slow for a phone call).
    out.push({
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: env.GEMINI_API_KEY,
      models: list(env.GEMINI_MODEL) ?? ["gemini-flash-lite-latest"],
      name: "Gemini",
    });
  }
  return out;
}

/** The provider that will answer next (the first one not cooling down), for status displays. */
export function provider(): { name: string } | null {
  const all = providers();
  const ready = all.find((p) => !coolingDown(p.name));
  const first = ready ?? all[0];
  if (!first) return null;
  const backups = all.filter((p) => p !== first).map((p) => p.name);
  return { name: backups.length ? `${first.name} (backup: ${backups.join(", ")})` : first.name };
}

export class LLMNotConfigured extends Error {
  constructor() {
    super("No AI model is configured. Add a free GROQ_API_KEY or GEMINI_API_KEY to .env.local and restart.");
  }
}

// ---- Skipping providers that can't answer right now ------------------------------------------
// Out of credit or a bad key won't fix itself in seconds, so skip that provider for a while
// instead of paying a wasted round trip on every step of every call.

const cooldown = ((globalThis as { __vardaanLlmCooldown?: Map<string, number> }).__vardaanLlmCooldown ??= new Map());
const coolingDown = (key: string) => (cooldown.get(key) ?? 0) > Date.now();

function noteFailure(p: Provider, model: string, status: number, body: string) {
  if (status === 401 || status === 402 || status === 403 || /insufficient_quota|credit_balance|billing|exceeded your current quota/i.test(body)) {
    cooldown.set(p.name, Date.now() + 10 * 60_000); // whole provider: bad key or no credit
  } else if (status === 429) {
    cooldown.set(`${p.name}/${model}`, Date.now() + 20_000); // just this model: rate limit
  }
}

/** Model-specific settings: short hidden "thinking" (it costs tokens and slows calls). */
function options(model: string): Record<string, unknown> {
  if (/gpt-oss/.test(model)) return { temperature: 0.3, reasoning_effort: "low" };
  if (/qwen3/.test(model)) return { temperature: 0.3, reasoning_effort: "none" };
  // OpenAI reasoning models (gpt-5 and later, o-series) reject custom temperature.
  if (/^(gpt-[5-9]|o\d)/.test(model)) return { reasoning_effort: "low" };
  return { temperature: 0.3 };
}

const retryable = (status: number) => status === 429 || status === 404 || status === 400 || status === 401 || status === 402 || status === 403 || status >= 500;

export async function chat(messages: ChatMessage[], tools: ToolSpec[]) {
  const all = providers();
  if (!all.length) throw new LLMNotConfigured();

  const errors: string[] = [];
  for (const p of all) {
    if (coolingDown(p.name)) continue;
    for (const model of p.models) {
      if (coolingDown(`${p.name}/${model}`)) continue;
      const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(p.apiKey ? { Authorization: `Bearer ${p.apiKey}` } : {}) },
        body: JSON.stringify({ model, messages, tools, tool_choice: "auto", ...options(model) }),
        signal: AbortSignal.timeout(20_000),
      }).catch((err: Error) => ({ ok: false, status: 599, text: async () => err.message }) as unknown as Response);

      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: Record<string, unknown> }[] };
        const message = data?.choices?.[0]?.message;
        if (!message) {
          errors.push(`${p.name}/${model}: no message`);
          continue;
        }
        return {
          content: (message.content as string | null) ?? null,
          toolCalls: (message.tool_calls as ToolCall[] | undefined) ?? [],
        };
      }
      const text = await res.text().catch(() => "");
      errors.push(`${p.name}/${model} (${res.status}): ${text.slice(0, 200)}`);
      noteFailure(p, model, res.status, text);
      console.warn(`LLM ${p.name}/${model} unavailable (${res.status}); trying the next one.`);
      if (!retryable(res.status)) break;
      if (coolingDown(p.name)) break; // the whole provider is out (e.g. no credit): skip its other models
    }
  }
  throw new Error(errors.length ? `All AI models failed. ${errors.join(" | ")}` : "All AI models are cooling down after errors; try again shortly.");
}
