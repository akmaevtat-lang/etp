import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

// Returns null when ANTHROPIC_API_KEY isn't set yet — callers fall back to a
// graceful placeholder reply instead of crashing the chat.
export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  if (!client) client = new Anthropic({ apiKey });
  return client;
}
