import { NextRequest, NextResponse } from 'next/server';
import { ScrapeResult } from '@/types/job';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required', jobTitle: '', companyName: '' },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format', jobTitle: '', companyName: '' },
        { status: 400 }
      );
    }

    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch page: ${response.status}`, jobTitle: '', companyName: '' },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Extract job title and company name using various patterns
    const result = extractJobInfo(html, parsedUrl.hostname);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to scrape the page', jobTitle: '', companyName: '' },
      { status: 500 }
    );
  }
}

function extractJobInfo(html: string, hostname: string): ScrapeResult {
  let jobTitle = '';
  let companyName = '';

  // Try to extract from meta tags first (most reliable)
  const ogTitle = extractMetaContent(html, 'og:title');
  const ogSiteName = extractMetaContent(html, 'og:site_name');

  // Try to get the page title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';

  // LinkedIn specific patterns
  if (hostname.includes('linkedin.com')) {
    // LinkedIn job titles often in format "Job Title at Company"
    const linkedinPattern = /^(.+?)\s+(?:at|@|-)\s+(.+?)(?:\s*\||\s*-|\s*·|$)/i;
    const match = (ogTitle || pageTitle).match(linkedinPattern);
    if (match) {
      jobTitle = match[1].trim();
      companyName = match[2].trim();
    }
  }

  // Indeed specific patterns
  if (hostname.includes('indeed.com')) {
    const indeedPattern = /^(.+?)\s*-\s*(.+?)\s*-\s*Indeed/i;
    const match = pageTitle.match(indeedPattern);
    if (match) {
      jobTitle = match[1].trim();
      companyName = match[2].trim();
    }
  }

  // Glassdoor specific patterns
  if (hostname.includes('glassdoor.com')) {
    const glassdoorPattern = /^(.+?)\s+(?:Job|job)\s+(?:in|at)\s+.+?\s*\|\s*(.+?)\s*\|/i;
    const match = pageTitle.match(glassdoorPattern);
    if (match) {
      jobTitle = match[1].trim();
      companyName = match[2].trim();
    }
  }

  // Generic patterns if specific ones didn't work
  if (!jobTitle || !companyName) {
    // Try common patterns in title
    const patterns = [
      /^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*\||\s*-|$)/i,
      /^(.+?)\s*-\s*(.+?)(?:\s*\||\s*-|$)/i,
      /^(.+?)\s*\|\s*(.+?)(?:\s*\||\s*-|$)/i,
    ];

    for (const pattern of patterns) {
      const match = (ogTitle || pageTitle).match(pattern);
      if (match && !jobTitle) {
        jobTitle = match[1].trim();
        if (!companyName) {
          companyName = match[2].trim();
        }
        break;
      }
    }
  }

  // Try to extract from structured data (JSON-LD)
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const data = JSON.parse(jsonContent);
        
        if (data['@type'] === 'JobPosting' || (Array.isArray(data['@graph']) && data['@graph'].some((item: { '@type': string }) => item['@type'] === 'JobPosting'))) {
          const jobData = data['@type'] === 'JobPosting' ? data : data['@graph'].find((item: { '@type': string }) => item['@type'] === 'JobPosting');
          
          if (jobData) {
            if (jobData.title && !jobTitle) {
              jobTitle = jobData.title;
            }
            if (jobData.hiringOrganization && !companyName) {
              companyName = typeof jobData.hiringOrganization === 'string' 
                ? jobData.hiringOrganization 
                : jobData.hiringOrganization.name || '';
            }
          }
        }
      } catch {
        // JSON parsing failed, continue
      }
    }
  }

  // Fallback: use og:site_name for company if available
  if (!companyName && ogSiteName) {
    companyName = ogSiteName;
  }

  // Fallback: use page title as job title if nothing else worked
  if (!jobTitle && pageTitle) {
    // Clean up common suffixes
    jobTitle = pageTitle
      .replace(/\s*\|.*$/, '')
      .replace(/\s*-\s*(?:Jobs?|Careers?|Apply|Hiring).*$/i, '')
      .trim();
  }

  // Clean up extracted values
  jobTitle = cleanText(jobTitle);
  companyName = cleanText(companyName);

  return {
    jobTitle: jobTitle || 'Unknown Position',
    companyName: companyName || 'Unknown Company',
    success: !!(jobTitle || companyName),
  };
}

function extractMetaContent(html: string, property: string): string {
  // Try property attribute
  let match = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
  if (match) return decodeHtmlEntities(match[1]);

  // Try name attribute
  match = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
  if (match) return decodeHtmlEntities(match[1]);

  // Try reverse order (content before property/name)
  match = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`, 'i'));
  if (match) return decodeHtmlEntities(match[1]);

  return '';
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/^["']|["']$/g, '')
    .trim();
}
