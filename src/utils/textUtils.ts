/**
 * Normalizes text for comparison by:
 * 1. Converting to lowercase
 * 2. Removing extra whitespace (including line breaks, tabs, etc.)
 * 3. Trimming leading and trailing whitespace
 * 
 * @param text The text to normalize
 * @returns Normalized text for comparison
 */
export const normalizeText = (text: string | undefined | null): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()                // Convert to lowercase
    .replace(/\s+/g, ' ')         // Replace multiple whitespace characters with a single space
    .trim();                      // Remove leading and trailing whitespace
};

/**
 * Compares two strings after normalizing them
 * 
 * @param text1 First text to compare
 * @param text2 Second text to compare
 * @returns True if the normalized texts are equal
 */
export const areTextsEquivalent = (text1: string | undefined | null, text2: string | undefined | null): boolean => {
  return normalizeText(text1) === normalizeText(text2);
};
