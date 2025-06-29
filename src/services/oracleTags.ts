/**
 * Oracle Tags Service
 * 
 * Scryfall provides oracle tags through their Tagger project that categorize cards by function.
 * Common tags include:
 * - Ramp: 'ramp', 'mana-ramp', 'mana-rock', 'mana-dork', 'land-ramp'
 * - Card Draw: 'card-draw', 'draw', 'cantrip', 'wheel'
 * - Removal: 'removal', 'creature-removal', 'board-wipe'
 * - Win Conditions: 'win-condition', 'combo-piece', 'finisher'
 * 
 * Note: Oracle tags are not included in standard Scryfall API responses.
 * They can only be accessed via search queries like: oracletag:ramp
 * 
 * Rate Limiting: Scryfall requests a delay of 50-100ms between requests.
 * We use 150ms to be safe and stop on the first 404 error.
 */

import { fetchCardTags, extractOracleTags, getCardIdentifiers, TaggerAuthOptions } from './scryfallTagger';
import type { Card } from '@/types/scryfall';

// Enrich cards with oracle tags from cache
export function enrichCardsWithOracleTags<T extends { name: string; oracle_tags?: string[] }>(
  cards: T[]
): T[] {
  return cards.map(card => {
    // Check dynamic cache
    const dynamicTags = dynamicOracleTagCache.get(card.name);
    if (dynamicTags && dynamicTags.length > 0 && !card.oracle_tags) {
      return { ...card, oracle_tags: dynamicTags };
    }
    
    return card;
  });
}

// Check if oracle tags indicate a card is ramp
export function isRampByOracleTags(tags: string[]): boolean {
  const rampTags = ['ramp', 'mana-ramp', 'mana-rock', 'mana-dork', 
                    'mana-dork-egg', 'land-ramp', 'ritual', 
                    'cost-reduction', 'adds-multiple-mana'];
  return tags.some(tag => rampTags.includes(tag));
}

// Cache for dynamically fetched oracle tags
const dynamicOracleTagCache = new Map<string, string[]>();

/**
 * Fetch oracle tags for multiple cards efficiently
 * Due to Scryfall limitations with complex queries, we take a different approach:
 * 1. For common cards, use our pre-built database
 * 2. For evaluation, focus on specific high-value tags
 * 3. Avoid complex queries that can fail
 * 
 * @param cardNames - Array of card names to fetch oracle tags for
 * @param tags - Specific oracle tags to check for
 * @param onProgress - Optional progress callback (current, total)
 * @param useCache - Whether to use cached results (default: true)
 * @returns Map of card name to array of oracle tags
 */
export interface OracleTagResult {
  tags: Map<string, string[]>;
  errors: string[];
  hasErrors: boolean;
}

// Rate limiting constants
const RATE_LIMIT_DELAY = 150; // 150ms between requests (Scryfall recommends 50-100ms)
const MAX_CONSECUTIVE_ERRORS = 3; // Stop after 3 consecutive errors

/**
 * Fetch oracle tags for cards using the Tagger GraphQL API
 * This requires the cards to have set and collector_number information
 */
export async function fetchOracleTagsForCardsWithTagger(
  cards: Array<Card>,
  onProgress?: (current: number, total: number) => void,
  useCache: boolean = true,
  authOptions?: TaggerAuthOptions
): Promise<OracleTagResult> {
  const results = new Map<string, string[]>();
  const errors: string[] = [];
  let consecutiveErrors = 0;
  let shouldStop = false;
  
  if (onProgress) {
    onProgress(0, cards.length);
  }
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    
    // Check cache first
    const cached = useCache ? dynamicOracleTagCache.get(card.name) : undefined;
    if (cached !== undefined) {
      results.set(card.name, cached);
    } else if (!shouldStop) {
      try {
        // Get set and collector number
        const identifiers = getCardIdentifiers(card);
        
        // Fetch from Tagger API
        const taggerCard = await fetchCardTags(identifiers.set, identifiers.number, false, authOptions);
        
        if (taggerCard) {
          const oracleTags = extractOracleTags(taggerCard);
          results.set(card.name, oracleTags);
          
          if (useCache) {
            dynamicOracleTagCache.set(card.name, oracleTags);
          }
          
          consecutiveErrors = 0;
        } else {
          // Card not found or API error
          results.set(card.name, []);
          if (useCache) {
            dynamicOracleTagCache.set(card.name, []);
          }
        }
        
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        consecutiveErrors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        if (!errors.includes(errorMsg)) {
          errors.push(errorMsg);
        }
        
        console.warn(`Tagger API error for ${card.name}:`, errorMsg);
        
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          shouldStop = true;
          errors.push('Stopped fetching due to repeated errors.');
          break;
        }
      }
    } else {
      // Stopped due to errors
      results.set(card.name, []);
      if (useCache) {
        dynamicOracleTagCache.set(card.name, []);
      }
    }
    
    if (onProgress) {
      onProgress(i + 1, cards.length);
    }
  }
  
  return {
    tags: results,
    errors: [...new Set(errors)],
    hasErrors: errors.length > 0
  };
}

/**
 * Legacy function that uses card names only
 * This is less reliable and should be replaced with fetchOracleTagsForCardsWithTagger
 */
export async function fetchOracleTagsForCards(
  cardNames: string[],
  _tags: string[] = ['ramp', 'mana-ramp', 'mana-rock', 'mana-dork', 'land-ramp',
                    'card-draw', 'removal', 'board-wipe', 'counter', 'tutor'],
  onProgress?: (current: number, total: number) => void,
  useCache: boolean = true
): Promise<OracleTagResult> {
  const results = new Map<string, string[]>();
  const errors: string[] = [];
  const shouldStop = false;
  
  if (onProgress) {
    onProgress(0, cardNames.length);
  }
  
  // Process each card with proper rate limiting
  for (let i = 0; i < cardNames.length; i++) {
    const name = cardNames[i];
    
    // Check dynamic cache first if using cache
    const cached = useCache ? dynamicOracleTagCache.get(name) : undefined;
    if (cached !== undefined) {
      // Even if empty array, it means we already checked
      results.set(name, cached);
    } else if (!shouldStop) {
      // Legacy path - return empty tags
      // We can't use the search API approach as it causes too many 404s
      results.set(name, []);
      if (useCache) {
        dynamicOracleTagCache.set(name, []);
      }
    } else {
      // If we stopped due to errors, just return empty for remaining cards
      results.set(name, []);
      if (useCache) {
        dynamicOracleTagCache.set(name, []);
      }
    }
    
    if (onProgress) {
      onProgress(i + 1, cardNames.length);
    }
  }
  
  // Since we're not making API calls in the legacy path, inform the user
  if (cardNames.length > 0 && errors.length === 0) {
    errors.push('Oracle tag fetching requires full card data. Please use fetchOracleTagsForCardsWithTagger instead.');
  }
  
  return {
    tags: results,
    errors: [...new Set(errors)], // Unique errors only
    hasErrors: true // Always true for legacy function
  };
}


