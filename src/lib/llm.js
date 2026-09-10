/**
 * Multi-provider LLM client — one OpenAI-compatible `/chat/completions` call
 * per provider, tried in the order given by `LLM_PROVIDER_ORDER`.
 *
 * Env schema:
 *   LLM_PROVIDER_ORDER      optional; comma list of model-var names, e.g.
 *                           "MISTRAL_MODEL,WORKERS_AI_MODEL,OPENCODE_GO_MODEL".
 *                           The prefix before "_MODEL" selects the provider.
 *                           Default: the three above, in that order.
 *   MISTRAL_API_KEY         https://console.mistral.ai
 *   MISTRAL_MODEL           default codestral-2508
 *   CLOUDFLARE_API_TOKEN    token with Workers AI Edit permission
 *   CLOUDFLARE_ACCOUNT_ID   dashboard account id (builds the REST base URL)
 *   WORKERS_AI_MODEL        default @cf/qwen/qwen3-30b-a3b-fp8
 *   OPENCODE_GO_API_KEY     https://opencode.ai/auth (OpenCode Go plan)
 *   OPENCODE_GO_MODEL       default mimo-v2.5
 *
 * Failover: providers without credentials are skipped (logged); on any error
 * (429, 5xx, timeout, empty content, caller validation) the next provider is
 * tried — one attempt each, no intra-provider retries. When every provider
 * fails, withFailover() throws an aggregated error and callers fail open.
 *
 * All three providers speak the OpenAI chat-completions wire format. OpenCode
 * Go additionally requires an app-identifying user agent and a stable
 * `x-opencode-session` id per request (their gateway rejects generic clients).
 * Runs in workerd (route) and plain Node (scripts/ingest.mjs) — no SDKs.
 */

const PROVIDERS = {
  MISTRAL: {
    name: 'mistral',
    keyVar: 'MISTRAL_API_KEY',
    defaultModel: 'codestral-2508',
    baseUrl: () => 'https://api.mistral.ai/v1',
  },
  WORKERS_AI: {
    name: 'workers-ai',
    keyVar: 'CLOUDFLARE_API_TOKEN',
    requires: ['CLOUDFLARE_ACCOUNT_ID'],
    defaultModel: '@cf/qwen/qwen3-30b-a3b-fp8',
    baseUrl: (getEnv) =>
      `https://api.cloudflare.com/client/v4/accounts/${getEnv('CLOUDFLARE_ACCOUNT_ID')}/ai/v1`,
  },
  OPENCODE_GO: {
    name: 'opencode-go',
    keyVar: 'OPENCODE_GO_API_KEY',
    defaultModel: 'mimo-v2.5',
    baseUrl: () => 'https://opencode.ai/zen/go/v1',
    extraHeaders: () => ({
      'user-agent': 'labormin/1.0',
      'x-opencode-session': crypto.randomUUID(),
    }),
  },
};

const DEFAULT_ORDER = 'MISTRAL_MODEL,WORKERS_AI_MODEL,OPENCODE_GO_MODEL';

/** Resolves the provider chain from LLM_PROVIDER_ORDER + credentials.
 *  Entries are model-var names ("MISTRAL_MODEL"); unknown prefixes are logged
 *  and skipped, duplicates deduped, providers missing credentials dropped. */
export function resolveChain(getEnv, log = () => {}) {
  const order = (getEnv('LLM_PROVIDER_ORDER') || DEFAULT_ORDER).trim();
  const chain = [];
  const seen = new Set();
  for (const rawEntry of order.split(',')) {
    const entry = rawEntry.trim().toUpperCase();
    if (!entry) continue;
    const id = entry.replace(/_MODEL$/, '');
    const provider = PROVIDERS[id];
    if (!provider) {
      log(`[llm] unknown provider entry "${rawEntry.trim()}" — skipped`);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    const key = getEnv(provider.keyVar);
    if (!key) {
      log(`[llm] ${provider.name}: missing ${provider.keyVar} — skipped`);
      continue;
    }
    const missing = (provider.requires || []).filter((v) => !getEnv(v));
    if (missing.length) {
      log(`[llm] ${provider.name}: missing ${missing.join(', ')} — skipped`);
      continue;
    }
    chain.push({
      id,
      name: provider.name,
      key,
      model: getEnv(`${id}_MODEL`) || provider.defaultModel,
      baseUrl: provider.baseUrl(getEnv),
      extraHeaders: provider.extraHeaders,
    });
  }
  return chain;
}

/** One chat-completions call against one provider. Resolves to the assistant
 *  content string; throws on HTTP errors, timeouts or empty content so the
 *  caller can fall through to the next provider. */
export async function callProvider(provider, { messages, maxTokens, timeoutMs = 60_000 }) {
  const body = { model: provider.model, temperature: 0, messages };
  if (maxTokens) body.max_tokens = maxTokens;
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${provider.key}`,
      ...(provider.extraHeaders ? provider.extraHeaders() : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${provider.name} HTTP ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error(`${provider.name}: empty content`);
  return content;
}

/** Runs attempt(provider) over the chain, first success wins. One attempt per
 *  provider; throws an aggregated error once every provider has failed. */
export async function withFailover(chain, attempt, log = () => {}) {
  const errors = [];
  for (const provider of chain) {
    try {
      return await attempt(provider);
    } catch (err) {
      errors.push(`${provider.name}/${provider.model}: ${err?.message || err}`);
      log(`[llm] ${errors[errors.length - 1]}`);
    }
  }
  throw new Error(`all LLM providers failed — ${errors.join(' | ')}`);
}

/** Strips thinking blocks + code fences and returns the JSON payload embedded
 *  in a completion (object or array). Thinking models (qwen3, glm, muse, mimo)
 *  may wrap or precede the JSON with reasoning text. */
export function extractJson(raw) {
  const s = String(raw ?? '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
  const m = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return m ? m[0] : s;
}
