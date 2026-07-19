/**
 * Full modern-Chrome header set for the scrape fetch. Some job boards
 * (dou.ua behind Cloudflare) score requests on header completeness as well
 * as IP reputation; a bare User-Agent is an easy bot signal.
 * Accept-Encoding is deliberately omitted so the runtime negotiates and
 * decompresses transparently.
 */
export const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9,uk;q=0.8',
  'Cache-Control': 'max-age=0',
  'Referer': 'https://www.google.com/',
  'Sec-Ch-Ua':
    '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'cross-site',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

/** "acme-corp" -> "Acme Corp" */
export function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Derives the company name from the URL path alone for job boards with a
 * recognizable structure. Used as a fallback when the page itself cannot be
 * fetched (e.g. dou.ua's CDN blocks requests from hosting-provider IPs).
 */
export function extractCompanyFromUrl(hostname: string, url: string): string {
  if (hostname.includes('dou.ua')) {
    const match = url.match(/\/companies\/([^/]+)\//i);
    if (match) return humanizeSlug(match[1]);
  }

  if (hostname.includes('greenhouse.io')) {
    const match = url.match(/greenhouse\.io\/([^/]+)\/jobs/i);
    if (match) return humanizeSlug(match[1]);
  }

  if (hostname.includes('lever.co')) {
    const match = url.match(/lever\.co\/([^/]+)\//i);
    if (match) return humanizeSlug(match[1]);
  }

  return '';
}
