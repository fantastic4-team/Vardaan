// Minimal client for any OpenAI-compatible chat API with tool calling. That covers the free
// options: Groq, Google Gemini (OpenAI-compatible endpoint), OpenRouter's free models, and a
// local Ollama server. Configure with environment variables (see .env.example).

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

export type ToolSpec = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

type Provider = { baseUrl: string; apiKey?: string; model: string; name: string };

/** Picks the provider from the environment. Explicit LLM_* settings win over the shortcuts. */
export function provider(): Provider | null {
  const env = process.env;
  if (env.LLM_BASE_URL && env.LLM_MODEL) {
    return { baseUrl: env.LLM_BASE_URL, apiKey: env.LLM_API_KEY, model: env.LLM_MODEL, name: "custom" };
  }
  if (env.GROQ_API_KEY) {
    return {
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: env.GROQ_API_KEY,
      // llama-3.3-70b-versatile was retired by Groq; gpt-oss-120b supports tool calling well.
      model: env.LLM_MODEL || "openai/gpt-oss-120b",
      name: "Groq",
    };
  }
  if (env.GEMINI_API_KEY) {
    return {
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: env.GEMINI_API_KEY,
      model: env.LLM_MODEL || "gemini-2.5-flash",
      name: "Gemini",
    };
  }
  return null;
}

export class LLMNotConfigured extends Error {
  constructor() {
    super("No AI model is configured. Add a free GROQ_API_KEY or GEMINI_API_KEY to .env.local and restart.");
  }
}

/**
 * Models to try in order. Groq's free tier limits tokens per minute *per model*, so when one is
 * rate-limited (or retired) we move to the next instead of failing the call. Override with
 * LLM_FALLBACK_MODELS (comma-separated).
 */
function modelChain(p: Provider) {
  const extra = process.env.LLM_FALLBACK_MODELS?.split(",").map((m) => m.trim()).filter(Boolean)
    ?? (p.name === "Groq" ? ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"] : []);
  return [...new Set([p.model, ...extra])];
}

const retryable = (status: number) => status === 429 || status === 404 || status === 400 || status >= 500;

export async function chat(messages: ChatMessage[], tools: ToolSpec[]) {
  const p = provider();
  if (!p) throw new LLMNotConfigured();

  let lastError = "";
  let data: { choices?: { message?: Record<string, unknown> }[] } | null = null;
  for (const model of modelChain(p)) {
    const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(p.apiKey ? { Authorization: `Bearer ${p.apiKey}` } : {}),
      },
      body: JSON.stringify({ model, messages, tools, tool_choice: "auto", temperature: 0.3 }),
      signal: AbortSignal.timeout(20_000),
    }).catch((err: Error) => ({ ok: false, status: 599, text: async () => err.message }) as unknown as Response);

    if (res.ok) {
      data = await res.json();
      break;
    }
    const text = await res.text().catch(() => "");
    lastError = `${p.name} request failed (${res.status}) on ${model}: ${text.slice(0, 300)}`;
    if (!retryable(res.status)) break;
    console.warn(`LLM ${model} unavailable (${res.status}); trying the next model.`);
  }
  if (!data) throw new Error(lastError || `${p.name} request failed.`);
  const message = data?.choices?.[0]?.message;
  if (!message) throw new Error(`${p.name} returned no message.`);
  return {
    content: (message.content as string | null) ?? null,
    toolCalls: (message.tool_calls as ToolCall[] | undefined) ?? [],
  };
}
