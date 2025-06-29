/**
 * Moxfield URL parsing and validation utilities
 */

/**
 * Regex pattern to match Moxfield deck URLs
 * Captures the deck public ID from various URL formats
 */
const MOXFIELD_DECK_URL_PATTERN = /moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/;

/**
 * Extracts the deck ID from a Moxfield URL
 * @param url - The Moxfield deck URL
 * @returns The deck ID or null if invalid
 */
export function extractDeckIdFromUrl(url: string): string | null {
  try {
    const match = url.match(MOXFIELD_DECK_URL_PATTERN);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Validates if a URL is a valid Moxfield deck URL
 * @param url - The URL to validate
 * @returns True if valid Moxfield deck URL
 */
export function isValidMoxfieldUrl(url: string): boolean {
  return MOXFIELD_DECK_URL_PATTERN.test(url);
}

/**
 * Constructs a Moxfield API URL for a deck
 * @param deckId - The deck public ID
 * @returns The API URL
 */
export function buildMoxfieldApiUrl(deckId: string): string {
  return `https://api.moxfield.com/v2/decks/all/${deckId}`;
}

/**
 * Constructs a Moxfield public URL for a deck
 * @param deckId - The deck public ID
 * @returns The public URL
 */
export function buildMoxfieldPublicUrl(deckId: string): string {
  return `https://moxfield.com/decks/${deckId}`;
}

/**
 * Sanitizes and validates a deck ID
 * @param deckId - The deck ID to sanitize
 * @returns The sanitized deck ID or null if invalid
 */
export function sanitizeDeckId(deckId: string): string | null {
  const trimmed = deckId.trim();
  // Moxfield deck IDs are alphanumeric with underscores and hyphens
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}
