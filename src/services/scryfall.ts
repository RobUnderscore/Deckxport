import type { Card, BulkData, ListResponse, CardIdentifier as ScryfallCardIdentifier } from '@/types/scryfall';

// Scryfall has proper CORS headers, no proxy needed
const SCRYFALL_API_BASE = 'https://api.scryfall.com';
const REQUEST_DELAY_MS = 100; // Scryfall recommends 50-100ms between requests
const MAX_COLLECTION_SIZE = 75; // Maximum cards per collection request

// Track last request time for rate limiting
let lastRequestTime = 0;

// Custom error class for Scryfall API errors
export class ScryfallApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ScryfallApiError';
  }
}

// Rate limiting helper
async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fetch(url, options);
}

// Fetch bulk data information
export async function fetchBulkDataInfo(): Promise<BulkData[]> {
  try {
    const response = await rateLimitedFetch(`${SCRYFALL_API_BASE}/bulk-data`);
    
    if (!response.ok) {
      throw new ScryfallApiError(
        `Failed to fetch bulk data info`,
        response.status,
        await response.text()
      );
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    if (error instanceof ScryfallApiError) throw error;
    throw new ScryfallApiError(`Network error fetching bulk data info: ${error}`);
  }
}

// Fetch specific bulk data file
export async function fetchBulkDataFile(downloadUri: string): Promise<Card[]> {
  try {
    // Don't rate limit bulk downloads as they're from a different domain
    const response = await fetch(downloadUri);
    
    if (!response.ok) {
      throw new ScryfallApiError(
        `Failed to fetch bulk data file`,
        response.status
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ScryfallApiError) throw error;
    throw new ScryfallApiError(`Network error fetching bulk data file: ${error}`);
  }
}

// Re-export card identifier type for convenience
export type CardIdentifier = ScryfallCardIdentifier;

// Collection request interface
export interface CollectionRequest {
  identifiers: CardIdentifier[];
  pretty?: boolean;
}

// Collection response interface
export interface CollectionResponse extends ListResponse<Card> {
  not_found: CardIdentifier[];
}

// Fetch multiple specific cards
export async function fetchCardCollection(identifiers: CardIdentifier[]): Promise<CollectionResponse> {
  if (identifiers.length === 0) {
    return {
      object: 'list',
      data: [],
      not_found: [],
      has_more: false,
      next_page: undefined,
      total_cards: 0,
      warnings: []
    };
  }
  
  if (identifiers.length > MAX_COLLECTION_SIZE) {
    throw new ScryfallApiError(
      `Collection request exceeds maximum size of ${MAX_COLLECTION_SIZE} cards`
    );
  }
  
  try {
    const response = await rateLimitedFetch(`${SCRYFALL_API_BASE}/cards/collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifiers }),
    });
    
    if (!response.ok) {
      throw new ScryfallApiError(
        `Failed to fetch card collection`,
        response.status,
        await response.text()
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ScryfallApiError) throw error;
    throw new ScryfallApiError(`Network error fetching card collection: ${error}`);
  }
}

// Fetch cards in batches if more than MAX_COLLECTION_SIZE
export async function fetchCardCollectionBatched(
  identifiers: CardIdentifier[]
): Promise<CollectionResponse> {
  if (identifiers.length <= MAX_COLLECTION_SIZE) {
    return fetchCardCollection(identifiers);
  }
  
  const batches: CardIdentifier[][] = [];
  for (let i = 0; i < identifiers.length; i += MAX_COLLECTION_SIZE) {
    batches.push(identifiers.slice(i, i + MAX_COLLECTION_SIZE));
  }
  
  const results = await Promise.all(batches.map(batch => fetchCardCollection(batch)));
  
  // Merge results
  const mergedData: Card[] = [];
  const mergedNotFound: CardIdentifier[] = [];
  const warnings: string[] = [];
  
  for (const result of results) {
    mergedData.push(...result.data);
    mergedNotFound.push(...result.not_found);
    if (result.warnings) warnings.push(...result.warnings);
  }
  
  return {
    object: 'list',
    data: mergedData,
    not_found: mergedNotFound,
    has_more: false,
    next_page: undefined,
    total_cards: mergedData.length,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// Helper to convert card names to identifiers
export function cardNamesToIdentifiers(cardNames: string[]): CardIdentifier[] {
  return cardNames.map(name => ({ name }));
}

// Helper to get the most relevant bulk data type
export async function getDefaultBulkData(): Promise<BulkData | null> {
  const bulkDataList = await fetchBulkDataInfo();
  
  // Prefer "default_cards" as it includes the most common version of each card
  const defaultCards = bulkDataList.find(bd => bd.type === 'default_cards');
  if (defaultCards) return defaultCards;
  
  // Fallback to oracle cards
  const oracleCards = bulkDataList.find(bd => bd.type === 'oracle_cards');
  if (oracleCards) return oracleCards;
  
  return null;
}

// Search cards endpoint (for completeness)
export async function searchCards(query: string, page = 1): Promise<ListResponse<Card>> {
  try {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
    });
    
    const response = await rateLimitedFetch(`${SCRYFALL_API_BASE}/cards/search?${params}`);
    
    if (!response.ok) {
      throw new ScryfallApiError(
        `Failed to search cards`,
        response.status,
        await response.text()
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ScryfallApiError) throw error;
    throw new ScryfallApiError(`Network error searching cards: ${error}`);
  }
}

// Fetch a single card by ID
export async function fetchCard(id: string): Promise<Card> {
  try {
    const response = await rateLimitedFetch(`${SCRYFALL_API_BASE}/cards/${id}`);
    
    if (!response.ok) {
      throw new ScryfallApiError(
        `Failed to fetch card`,
        response.status,
        await response.text()
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ScryfallApiError) throw error;
    throw new ScryfallApiError(`Network error fetching card: ${error}`);
  }
}