/**
 * Canonical absolute base URL for the docs site, used for metadata, Open Graph
 * tags, the sitemap, and robots.txt.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL          — set this to the production domain
 *   2. VERCEL_PROJECT_PRODUCTION_URL — provided automatically on Vercel
 *   3. http://localhost:3000         — local development fallback
 */
export const siteUrl: string =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

export const siteName = 'StellarLens'
export const siteDescription =
  'Smart RPC routing with automatic latency-ranked fallback, Soroban transaction pre-flight simulation, and human-readable XDR error decoding.'
