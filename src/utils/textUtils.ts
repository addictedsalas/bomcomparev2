/**
 * Normalizes text for comparison by:
 * 1. Converting to lowercase
 * 2. Removing extra whitespace (including line breaks, tabs, etc.)
 * 3. Trimming leading and trailing whitespace
 * 
 * @param text The text to normalize
 * @returns Normalized text for comparison
 */
export const normalizeText = (text: string | number | undefined | null): string => {
  if (text === undefined || text === null) return '';
  
  return String(text)
    .toLowerCase()                // Convert to lowercase
    .replace(/\s+/g, ' ')         // Replace multiple whitespace characters with a single space
    .trim();                      // Remove leading and trailing whitespace
};

/**
 * Normalizes part numbers for comparison by:
 * 1. Converting to lowercase
 * 2. Removing extra whitespace
 * 3. Handling DURO's suffix duplication issue
 * 
 * DURO Export Issue: DURO duplicates the last suffix segment on export:
 * - "406-00043-00" in DURO exports as "406-00043-00-00"
 * - "453-00516-02" in DURO exports as "453-00516-02-02"
 * 
 * Normalization Strategy:
 * 1. Remove duplicated suffixes (e.g., -00-00 → -00, -02-02 → -02)
 * 2. Then remove -00 suffix only (DURO's base part indicator)
 * 
 * Examples:
 * - "406-00043-00-00" (DURO export) → "406-00043-00" → "406-00043" (matches SOLIDWORKS "406-00043")
 * - "453-00516-02-02" (DURO export) → "453-00516-02" (matches SOLIDWORKS "453-00516-02")
 * - "800-00761-00" (DURO) → "800-00761" (matches SOLIDWORKS "800-00761")
 * - "800-00761-01" (both systems) → "800-00761-01" (no change, exact match)
 * 
 * @param partNumber The part number to normalize
 * @returns Normalized part number for comparison
 */
export const normalizePartNumber = (partNumber: string | number | undefined | null): string => {
  if (partNumber === undefined || partNumber === null) return '';
  
  let normalized = String(partNumber)
    .toLowerCase()                // Convert to lowercase
    .replace(/\s+/g, ' ')         // Replace multiple whitespace characters with a single space
    .trim();                      // Remove leading and trailing whitespace
  
  // Remove duplicated suffixes (e.g., -00-00 → -00, -02-02 → -02, -15-15 → -15)
  // This handles DURO's export bug where it duplicates the last suffix segment
  // Pattern: captures -XX and checks if followed by the same -XX
  normalized = normalized.replace(/(-\d{2})\1$/, '$1');
  
  // Remove ONLY -00 suffix (DURO's base part indicator)
  normalized = normalized.replace(/-00$/, '');
  
  return normalized;
};

/**
 * Converts a part number to DURO export format by duplicating the last suffix.
 * This is the inverse of normalizePartNumber and handles DURO's export requirement.
 * 
 * DURO Export Requirement: DURO expects duplicated suffixes on import:
 * - "406-00043" should be exported as "406-00043-00-00"
 * - "453-00516-02" should be exported as "453-00516-02-02"
 * 
 * @param partNumber The part number to convert to DURO format
 * @returns Part number in DURO export format with duplicated suffix
 */
export const toDuroFormat = (partNumber: string | number | undefined | null): string => {
  if (partNumber === undefined || partNumber === null) return '';
  
  const trimmed = String(partNumber).trim();
  
  // Check if it already has a duplicated suffix (e.g., -00-00, -02-02)
  if (/(-\d{2})\1$/.test(trimmed)) {
    return trimmed; // Already in DURO format
  }
  
  // Check if it ends with a suffix like -00, -01, -02, etc.
  const suffixMatch = trimmed.match(/-(\d{2})$/);
  if (suffixMatch) {
    // Has a suffix, duplicate it
    return `${trimmed}-${suffixMatch[1]}`;
  }
  
  // No suffix, add -00-00 (base part)
  return `${trimmed}-00-00`;
};

/**
 * Compares two strings after normalizing them
 * 
 * @param text1 First text to compare
 * @param text2 Second text to compare
 * @returns True if the normalized texts are equal
 */
export const areTextsEquivalent = (text1: string | number | undefined | null, text2: string | number | undefined | null): boolean => {
  return normalizeText(text1) === normalizeText(text2);
};
