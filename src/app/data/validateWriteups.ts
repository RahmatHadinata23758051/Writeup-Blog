import type { Writeup } from './writeupTypes';

/**
 * Validate writeup data for common authoring mistakes.
 * Returns an array of warning strings. Does not throw.
 * Intended for development-only console output.
 */
export function validateWriteups(writeups: Writeup[]): string[] {
  const warnings: string[] = [];

  // ---- Duplicate and missing ID checks ----
  const idCounts = new Map<string, number>();
  for (const wu of writeups) {
    if (!wu.id) {
      warnings.push(`[WRITEUP] Missing id for writeup titled "${wu.title || '(untitled)'}"`);
      continue;
    }
    idCounts.set(wu.id, (idCounts.get(wu.id) || 0) + 1);

    if (wu.id !== wu.id.toLowerCase()) {
      warnings.push(`[WRITEUP] id "${wu.id}" contains uppercase characters. Use lowercase only.`);
    }

    if (/\s/.test(wu.id)) {
      warnings.push(`[WRITEUP] id "${wu.id}" contains spaces. Use hyphens instead.`);
    }
  }

  for (const [id, count] of idCounts) {
    if (count > 1) {
      warnings.push(`[WRITEUP] Duplicate id "${id}" found ${count} times.`);
    }
  }

  // ---- Per-writeup field checks ----
  for (const wu of writeups) {
    const label = wu.id || wu.title || '(unknown)';

    if (!wu.title) {
      warnings.push(`[WRITEUP] "${label}": missing title.`);
    }
    if (!wu.ctfName) {
      warnings.push(`[WRITEUP] "${label}": missing ctfName.`);
    }
    if (!wu.category) {
      warnings.push(`[WRITEUP] "${label}": missing category.`);
    }
    if (!wu.description && !wu.problemDescription) {
      warnings.push(`[WRITEUP] "${label}": missing description and problemDescription.`);
    }
    if (!wu.flag) {
      warnings.push(`[WRITEUP] "${label}": missing flag.`);
    }
    if (!wu.solution || (Array.isArray(wu.solution) && wu.solution.length === 0)) {
      warnings.push(`[WRITEUP] "${label}": missing solution.`);
    }
  }

  // ---- ctfName consistency ----
  const ctfNameNormMap = new Map<string, Set<string>>();
  for (const wu of writeups) {
    if (!wu.ctfName) continue;
    const normalized = wu.ctfName.toLowerCase().replace(/[\s_-]+/g, '');
    if (!ctfNameNormMap.has(normalized)) {
      ctfNameNormMap.set(normalized, new Set());
    }
    ctfNameNormMap.get(normalized)!.add(wu.ctfName);
  }
  for (const [, variants] of ctfNameNormMap) {
    if (variants.size > 1) {
      const names = Array.from(variants).join(', ');
      warnings.push(
        `[WRITEUP] Likely inconsistent ctfName variants: ${names}. Pick one and use it consistently.`
      );
    }
  }

  // ---- Category casing consistency ----
  const categoryNormMap = new Map<string, Set<string>>();
  for (const wu of writeups) {
    if (!wu.category) continue;
    const normalized = wu.category.toLowerCase();
    if (!categoryNormMap.has(normalized)) {
      categoryNormMap.set(normalized, new Set());
    }
    categoryNormMap.get(normalized)!.add(wu.category);
  }
  for (const [, variants] of categoryNormMap) {
    if (variants.size > 1) {
      const names = Array.from(variants).join(', ');
      warnings.push(
        `[WRITEUP] Inconsistent category casing: ${names}. Standardize to one variant.`
      );
    }
  }

  return warnings;
}
