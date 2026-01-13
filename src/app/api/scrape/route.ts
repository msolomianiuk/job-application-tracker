import { NextRequest, NextResponse } from "next/server";
import { ScrapeResult } from "@/types/job";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required",
          jobTitle: "",
          companyName: "",
        },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
          jobTitle: "",
          companyName: "",
        },
        { status: 400 }
      );
    }

    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch page: ${response.status}`,
          jobTitle: "",
          companyName: "",
        },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Extract job title and company name using various patterns
    const result = extractJobInfo(html, parsedUrl.hostname, url);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to scrape the page",
        jobTitle: "",
        companyName: "",
      },
      { status: 500 }
    );
  }
}

function extractJobInfo(
  html: string,
  hostname: string,
  url?: string
): ScrapeResult {
  let jobTitle = "";
  let companyName = "";

  // Try to extract from meta tags first (most reliable)
  const ogTitle = extractMetaContent(html, "og:title");
  const ogSiteName = extractMetaContent(html, "og:site_name");

  // Try to get the page title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : "";

  // DOU.ua specific patterns (Ukrainian job board)
  if (hostname.includes("dou.ua") || hostname.includes("jobs.dou.ua")) {
    // Extract company name from URL: /companies/nerdysoft/
    if (url) {
      const companyMatch = url.match(/\/companies\/([^\/]+)\//i);
      if (companyMatch) {
        companyName = companyMatch[1].replace(/-/g, " ");
        // Capitalize first letter of each word
        companyName = companyName.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }

    // Try to extract job title from page - look for h1 with vacancy title
    const h1Match =
      html.match(/<h1[^>]*class="[^"]*vacancy[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
      html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      jobTitle = decodeHtmlEntities(h1Match[1].trim());
    }

    // Also try to get company from the page content if not found in URL
    if (!companyName) {
      const companyLinkMatch = html.match(
        /<a[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/a>/i
      );
      if (companyLinkMatch) {
        companyName = decodeHtmlEntities(companyLinkMatch[1].trim());
      }
    }

    // Fallback: try og:title which might have format "Job Title — Company"
    if (!jobTitle && ogTitle) {
      const douPattern = /^(.+?)\s*[—–-]\s*(.+?)$/;
      const match = ogTitle.match(douPattern);
      if (match) {
        jobTitle = match[1].trim();
        if (!companyName) {
          companyName = match[2].trim();
        }
      }
    }
  }

  // Work.ua specific patterns (Ukrainian job board)
  if (hostname.includes("work.ua")) {
    // Try to extract from h1 tag first - this usually has the clean job title
    const h1Match =
      html.match(/<h1[^>]*id="h1-name"[^>]*>([^<]+)<\/h1>/i) ||
      html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      let title = decodeHtmlEntities(h1Match[1].trim());
      // Remove "Вакансія:" prefix if present
      title = title.replace(/^Вакансія:\s*/i, "");
      jobTitle = title;
    }

    // Try to extract company from the company link
    const companyLinkMatch = html.match(
      /<a[^>]*href="\/jobs\/by-company\/[^"]*"[^>]*>([^<]+)<\/a>/i
    );
    if (companyLinkMatch) {
      companyName = decodeHtmlEntities(companyLinkMatch[1].trim());
    }

    // If no company found, try to extract from text "компанія X"
    if (!companyName) {
      // Look for "компанія X" pattern in the HTML, extract just the company name
      const companyTextMatch = html.match(
        /компанія\s+([A-Za-zА-Яа-яІіЇїЄєҐґ0-9_-]+)/i
      );
      if (companyTextMatch) {
        companyName = companyTextMatch[1].trim();
      }
    }

    // Fallback: parse og:title if job title still not found
    if (!jobTitle && ogTitle) {
      let title = ogTitle.replace(/^Вакансія:\s*/i, "");
      // Remove everything after dash or comma with salary/location info
      title = title.replace(
        /\s*[—–-]\s*(?:вакансія|робота|vacancy|job|Work\.ua).*$/i,
        ""
      );
      title = title.replace(/\s*,\s*(?:\d|робота|компанія).*$/i, "");
      if (title && !title.match(/^\d/)) {
        jobTitle = title.trim();
      }
    }
  }

  // LinkedIn specific patterns
  if (hostname.includes("linkedin.com")) {
    // LinkedIn job titles often in format "Company hiring Job Title in Location | LinkedIn"
    // Example: "Intellias hiring Senior AQA Engineer (JS, Cypress) in Ukraine | LinkedIn"
    const linkedinHiringPattern =
      /^(.+?)\s+hiring\s+(.+?)\s+in\s+.+?\s*\|\s*LinkedIn$/i;
    let match = (ogTitle || pageTitle).match(linkedinHiringPattern);
    if (match) {
      companyName = match[1].trim();
      jobTitle = match[2].trim();
    }

    // Fallback: LinkedIn job titles in format "Job Title at Company"
    if (!jobTitle || !companyName) {
      const linkedinAtPattern =
        /^(.+?)\s+(?:at|@|-)\s+(.+?)(?:\s*\||\s*-|\s*·|$)/i;
      match = (ogTitle || pageTitle).match(linkedinAtPattern);
      if (match) {
        jobTitle = match[1].trim();
        companyName = match[2].trim();
      }
    }
  }

  // Indeed specific patterns
  if (hostname.includes("indeed.com")) {
    const indeedPattern = /^(.+?)\s*-\s*(.+?)\s*-\s*Indeed/i;
    const match = pageTitle.match(indeedPattern);
    if (match) {
      jobTitle = match[1].trim();
      companyName = match[2].trim();
    }
  }

  // Glassdoor specific patterns
  if (hostname.includes("glassdoor.com")) {
    const glassdoorPattern =
      /^(.+?)\s+(?:Job|job)\s+(?:in|at)\s+.+?\s*\|\s*(.+?)\s*\|/i;
    const match = pageTitle.match(glassdoorPattern);
    if (match) {
      jobTitle = match[1].trim();
      companyName = match[2].trim();
    }
  }

  // Greenhouse specific patterns (job-boards.greenhouse.io)
  if (hostname.includes("greenhouse.io")) {
    // Title format: "Job Application for [Job Title] at [Company]"
    const greenhousePattern = /^Job Application for\s+(.+?)\s+at\s+(.+?)\s*$/i;
    const match = pageTitle.match(greenhousePattern);
    if (match) {
      jobTitle = match[1].trim();
      companyName = match[2].trim();
    }

    // Also try og:title which usually has just the job title
    if (!jobTitle && ogTitle) {
      jobTitle = ogTitle.trim();
    }

    // Try to extract company from URL path: /company-name/jobs/...
    if (!companyName && url) {
      const urlCompanyMatch = url.match(/greenhouse\.io\/([^\/]+)\/jobs/i);
      if (urlCompanyMatch) {
        // Convert URL slug to proper name (e.g., "alpaca" -> "Alpaca")
        companyName = urlCompanyMatch[1]
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
  }

  // Lever specific patterns (jobs.lever.co)
  if (hostname.includes("lever.co")) {
    // Lever title format: "Company Name - Job Title"
    // The company name comes FIRST, then the job title
    const leverPattern = /^(.+?)\s+-\s+(.+?)$/;
    const match = (ogTitle || pageTitle).match(leverPattern);
    if (match) {
      // For Lever, first part is company, second is job title
      companyName = match[1].trim();
      jobTitle = match[2].trim();
    }

    // Also try to extract company from URL path: /company-name/job-id
    if (!companyName && url) {
      const urlCompanyMatch = url.match(/lever\.co\/([^\/]+)\//i);
      if (urlCompanyMatch) {
        // Convert URL slug to proper name (e.g., "nekohealth" -> "Nekohealth")
        const urlCompany = urlCompanyMatch[1]
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        // Only use URL company if we don't have one from title
        if (!companyName) {
          companyName = urlCompany;
        }
      }
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
  const jsonLdMatch = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi
  );
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, "");
        const data = JSON.parse(jsonContent);

        if (
          data["@type"] === "JobPosting" ||
          (Array.isArray(data["@graph"]) &&
            data["@graph"].some(
              (item: { "@type": string }) => item["@type"] === "JobPosting"
            ))
        ) {
          const jobData =
            data["@type"] === "JobPosting"
              ? data
              : data["@graph"].find(
                  (item: { "@type": string }) => item["@type"] === "JobPosting"
                );

          if (jobData) {
            if (jobData.title && !jobTitle) {
              jobTitle = jobData.title;
            }
            if (jobData.hiringOrganization && !companyName) {
              companyName =
                typeof jobData.hiringOrganization === "string"
                  ? jobData.hiringOrganization
                  : jobData.hiringOrganization.name || "";
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
      .replace(/\s*\|.*$/, "")
      .replace(/\s*-\s*(?:Jobs?|Careers?|Apply|Hiring).*$/i, "")
      .trim();
  }

  // Clean up extracted values
  jobTitle = cleanText(jobTitle);
  companyName = cleanText(companyName);

  return {
    jobTitle: jobTitle || "Unknown Position",
    companyName: companyName || "Unknown Company",
    success: !!(jobTitle || companyName),
  };
}

function extractMetaContent(html: string, property: string): string {
  // Try property attribute
  let match = html.match(
    new RegExp(
      `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`,
      "i"
    )
  );
  if (match) return decodeHtmlEntities(match[1]);

  // Try name attribute
  match = html.match(
    new RegExp(
      `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`,
      "i"
    )
  );
  if (match) return decodeHtmlEntities(match[1]);

  // Try reverse order (content before property/name)
  match = html.match(
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`,
      "i"
    )
  );
  if (match) return decodeHtmlEntities(match[1]);

  return "";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}
