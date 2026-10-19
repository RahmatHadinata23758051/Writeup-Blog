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
  "0xvoidseason2": "0xv01d2026v2", // "0xVoid Season 2" -> "0xV01D CTF 2026 V2"
  "asis": "asisquals2026", // "ASIS CTF" -> "ASIS CTF Quals 2026"
  "bronco": "bronco2026", // "BroncoCTF" -> "BroncoCTF 2026"
  "compfest18": "compfest2026", // "Compfest 18" -> "COMPFEST CTF 2026"
  "cryovault": "cryovault2026quals", // "CryoVault" -> "Cryovault 2026 Quals"
  "h7tex": "h72026quals", // "H7tex" -> "H7CTF 2026 Quals"
  "juniorcrypt": "juniorcrypt2026", // "JuniorCrypt" -> "Junior.Crypt.2026 CTF"
  "kaliteam2026": "kaliteam26", // "KaliTeamCTF 2026" -> "Kali Team - CTF 26"
  "kubs2026": "kubstu2026autumn", // "KubsCTF 2026" -> "KubSTU CTF 2026: Autumn"
  "lykn2026": "lykn", // "LyknCTF 2026" -> "LYKNCTF"
  "nns": "nns2026", // "NNS CTF" -> "NNS CTF 2026"
  "nohackno": "nohackno2026", // "NoHackNoCTF" -> "No Hack No CTF 2026"
  "projectsekai2026": "sekai2026", // "ProjectSekai 2026" -> "SekaiCTF 2026"
  "putcyber": "putcyberdays2026", // "Putcyber" -> "PUTCyberDays CTF 2026"
  "r3": "r32026", // "R3CTF" -> "R3CTF 2026"
  "thjccsummer": "thjcc2026summer", // "THJCC Summer" -> "THJCC CTF 2026 summer"
  "texsaw": "texsaw2026", // "TexSAW CTF" -> "TexSAW 2026"
  "thryve": "thryve2026", // "ThryveCTF" -> "Thryve CTF 2026"
  "tracebash": "tracebash2026", // "Tracebash" -> "TraceBash CTF 2026"
  "v1t": "v12026", // "V 1tCtf" -> "V1T CTF 2026"
  "vuw2025": "vuw2026", // "VuwCTF 2025" -> "VuwCTF 2026"
  "securinets": "securinets2026quals", // "Securinets" -> "Securinets CTF Quals 2026"
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
