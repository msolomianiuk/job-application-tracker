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
