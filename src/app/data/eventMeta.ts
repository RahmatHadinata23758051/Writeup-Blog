import type { CtftimeTeamProfile, CtftimeEventResult } from "./ctftimeTypes";

const EVENT_NAME_ALIASES: Record<string, string> = {
  "tjcsc": "tj2026", // "Tjcsc" -> "TJCTF 2026"
  "thcon2026": "thcon2k26", // "THCON 2026" -> "THCon 2K26 CTF"
  "texcaw": "texsaw2026", // "Texcaw" -> "TexSAW 2026"
  "squ1rrel": "squ1rrel2026", // "Squ 1rrel" -> "squ1rrel CTF 2026"
  "lag": "lagncrash60", // "Lag" -> "Lag N Crash 6.0"
  "kubsu": "kubstu", // "Kubsuctf" -> "KubSTU CTF"
  "kubs": "kubstu", // "Kubs" -> "KubSTU CTF"
  "k1nd4sus": "knd4sus2026", // "K 1nd 4sus" -> "K!nd4SUS CTF 2026"
  "cit": "cit2026", // "Citctf" -> "CTF@CIT 2026"
  "incognito": "incognito70", // "Incognito" -> "Incognito 7.0"
  "byu": "byu2026", // "BYUCTF" -> "BYUCTF 2026"
  "bhackari": "bhackari2026", // "Bhackari" -> "bhackari CTF 2026"
  "jersey": "jerseyvi", // "JerseyCTF" -> "JerseyCTF VI"
  "lake2025": "lakequals2526", // "Lake CTF 2025" -> "LakeCTF Quals 25-26"
  "ram": "ramadan2026", // "RAM" -> "RamadanCTF 2026"
  "boro": "boro2026", // "BORO CTF" -> "boroCTF 2026"
  "siebersec": "sieberrsec70", // "Siebersec CTF" -> "Sieberrsec CTF 7.0"
};

/**
 * Normalizes an event name to look for matches by stripping spaces,
 * punctuation, and common CTF suffixes/prefixes.
 */
export function normalizeEventName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/ctf/g, "") // Remove common "ctf"
    .replace(/[^a-z0-9]/g, ""); // Remove punctuation, spaces, and special symbols
}

/**
 * Finds a matching CTFtime event result from a team profile by normalized event name,
 * taking aliases into account.
 */
export function findCtftimeEvent(
  eventName: string,
  profile: CtftimeTeamProfile
): CtftimeEventResult | undefined {
  if (!eventName || !profile || !profile.events) return undefined;
  
  const targetNorm = normalizeEventName(eventName);
  const resolvedTarget = EVENT_NAME_ALIASES[targetNorm] || targetNorm;
  
  return profile.events.find((e) => {
    const scrapedNorm = normalizeEventName(e.eventName);
    const resolvedScraped = EVENT_NAME_ALIASES[scrapedNorm] || scrapedNorm;
    return resolvedScraped === resolvedTarget;
  });
}
