// Keyless global click counter via Abacus (abacus.jasoncameron.dev).
// No API key/secret — the namespace/key in the URL is a public bucket name,
// not a credential. `/get` reads, `/hit` increments; both return { value }.
// Vanity counter: every call degrades gracefully to null on any failure.

const BASE = 'https://abacus.jasoncameron.dev'
const NS = 'odokienkoan-site'
const KEY = 'avatar-plays'

async function call(action: 'get' | 'hit'): Promise<number | null> {
  try {
    const res = await fetch(`${BASE}/${action}/${NS}/${KEY}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { value?: number }
    return typeof data.value === 'number' ? data.value : null
  } catch {
    return null
  }
}

export const getViews = () => call('get')
export const hitViews = () => call('hit')
