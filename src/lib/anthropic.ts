import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return _client
}

export const FAST_MODEL = 'claude-haiku-4-5-20251001'

const TIMEOUT_MS = 20000

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Claude request timed out')), ms)),
  ])
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1024
): Promise<string> {
  const client = getClient()
  let lastErr: unknown

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await withTimeout(
        client.messages.create({
          model: FAST_MODEL,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        TIMEOUT_MS
      )
      const block = response.content[0]
      if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
      return block.text
    } catch (err) {
      lastErr = err
      console.error(`[claude] attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err)
      if (attempt === 0) await new Promise(r => setTimeout(r, 500))
    }
  }
  throw lastErr
}
