import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEAM_ID = 408130;
const CACHE_PATH = path.resolve(__dirname, '../src/app/data/ctftimeProfile.ts');

function printHelp() {
  console.log(`
============================================================
           CTFtime Local Cache Update Utility
============================================================

The CTFtime website (https://ctftime.org) uses Cloudflare protection
and rate limiting, which blocks direct client-side requests from
browsers due to CORS, and may block node requests without custom proxies.

This project uses a static local-cache design to keep the Home page
load speeds fast, reliable, and completely offline-capable.

Primary File:
  src/app/data/ctftimeProfile.ts

To manually update your rankings or event placements:
1. Open src/app/data/ctftimeProfile.ts
2. Edit the root metadata values (globalRank, countryRank, ratingPoints).
3. Add entry objects inside the "events" array:
   Example:
   events: [
     {
       eventName: "Lake CTF 2025",
       place: 42,
       points: 250.5,
       team: "rhnata/writeups",
       ctftimeUrl: "https://ctftime.org/event/2500"
     }
   ]

Name matching works by comparing lowercase, space-stripped event names
(e.g., "Lake CTF 2025" and "lakectf2025" will match automatically).

------------------------------------------------------------
Attempting a safe, non-aggressive API query...
`);
}

async function fetchProfile() {
  const url = `https://ctftime.org/api/v1/teams/${TEAM_ID}/`;
  
  // Custom headers to respect CTFtime API policies and bypass simple User-Agent filters
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (CTFtime Team Stats Sync CLI)',
    'Accept': 'application/json'
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP Status ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error(err.message || 'Network/CORS/Cloudflare block');
  }
}

async function fetchEventsList() {
  const url = `https://ctftime.org/team/${TEAM_ID}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html'
  };
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`[!] Failed to scrape HTML for events: status ${res.status}`);
      return [];
    }
    const html = await res.text();
    const regex = /<tr><td class="place_ico"[^>]*>.*?<\/td><td class="place">(\d+)<\/td><td><a href="\/event\/(\d+)">([^<]+)<\/a><\/td><td>([\d.]+)<\/td><td>([\d.]+).*?<\/td><\/tr>/g;
    
    let match;
    const events = [];
    while ((match = regex.exec(html)) !== null) {
      const eventName = match[3].trim()
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"');
      events.push({
        eventName: eventName,
        place: parseInt(match[1]),
        points: parseFloat(match[4]),
        ratingPoints: parseFloat(match[5]),
        ctftimeUrl: `https://ctftime.org/event/${match[2]}`
      });
    }
    return events;
  } catch (err) {
    console.warn(`[!] Failed to scrape events from team page: ${err.message}`);
    return [];
  }
}

async function main() {
  printHelp();

  try {
    const data = await fetchProfile();
    console.log(`[+] Success! Fetched latest data for team: ${data.name || TEAM_ID}`);
    
    // Read the current file so we preserve the "events" array or other manual values
    let currentContent = '';
    let currentEvents = [];
    if (fs.existsSync(CACHE_PATH)) {
      currentContent = fs.readFileSync(CACHE_PATH, 'utf-8');
      // Simple regex parser to extract events if they exist
      const match = currentContent.match(/events:\s*(\[[\s\S]*?\])/);
      if (match) {
        try {
          // evaluate or parse the array safely
          currentEvents = eval(match[1]);
        } catch (e) {
          console.warn('[!] Failed to parse existing events from profile, keeping empty list.');
        }
      }
    }

    console.log(`[+] Attempting to scrape event list from CTFtime team page...`);
    const scrapedEvents = await fetchEventsList();
    const finalEvents = scrapedEvents.length > 0 ? scrapedEvents : currentEvents;
    console.log(`[+] Found ${scrapedEvents.length} events scraped from HTML (using ${finalEvents.length} total).`);

    // Determine the latest year in ratings
    let latestYear = 2026;
    if (data.rating) {
      const years = Object.keys(data.rating).map(Number).sort((a, b) => b - a);
      if (years.length > 0) {
        latestYear = years[0];
      }
    }
    const ratingYearData = data.rating && data.rating[latestYear] ? data.rating[latestYear] : {};
    const globalRank = ratingYearData.rating_place !== undefined ? ratingYearData.rating_place : 0;
    const ratingPoints = ratingYearData.rating_points !== undefined ? ratingYearData.rating_points : 0;

    const updatedProfile = {
      teamId: TEAM_ID,
      teamUrl: `https://ctftime.org/team/${TEAM_ID}`,
      teamName: data.name || "Roblox-Labs",
      country: data.country || "ID",
      globalRank: globalRank,
      countryRank: null,
      ratingPoints: ratingPoints,
      lastUpdated: new Date().toISOString().split('T')[0],
      events: finalEvents
    };

    // Construct TS code content
    const code = `import type { CtftimeTeamProfile } from "./ctftimeTypes";

export const ctftimeProfile: CtftimeTeamProfile = {
  teamId: ${updatedProfile.teamId},
  teamUrl: "${updatedProfile.teamUrl}",
  teamName: "${updatedProfile.teamName}",
  country: "${updatedProfile.country}",
  globalRank: ${updatedProfile.globalRank},
  countryRank: ${updatedProfile.countryRank},
  ratingPoints: ${updatedProfile.ratingPoints},
  lastUpdated: "${updatedProfile.lastUpdated}",
  events: ${JSON.stringify(updatedProfile.events, null, 2)}
};
`;

    fs.writeFileSync(CACHE_PATH, code, 'utf-8');
    console.log(`[+] Successfully updated CTFtime team cache at: src/app/data/ctftimeProfile.ts`);
    console.log(`[+] Global Rank (${globalRank}) and Rating Points (${ratingPoints}) refreshed!`);
  } catch (err) {
    console.log(`[-] Could not fetch CTFtime API: ${err.message}`);
    console.log(`[-] CTFtime endpoints are frequently protected by Cloudflare anti-bot systems.`);
    console.log(`[i] Please update src/app/data/ctftimeProfile.ts manually using the guide above.`);
  }
}

main();
