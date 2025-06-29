/**
 * Scryfall Tagger GraphQL Service
 * 
 * IMPORTANT LIMITATIONS:
 * - This API cannot be used directly from browsers due to CORS restrictions
 * - The corsproxy.io service blocks these requests (403 errors)
 * - This code works in Node.js environments (CLI scripts, backend servers)
 * 
 * For browser usage:
 * - In development: Vite proxy is configured to handle requests at /api/tagger/*
 * - In production: You need a backend proxy server that forwards requests
 * 
 * The authentication tokens below work for read-only access when used
 * from Node.js or through a proper proxy.
 */

// Base Tagger API URL
const TAGGER_BASE = 'https://tagger.scryfall.com/graphql';

// Determine the endpoint based on environment
const TAGGER_GRAPHQL_ENDPOINT = (() => {
  // Node.js environment (scripts, SSR, etc.)
  if (typeof window === 'undefined') {
    return TAGGER_BASE;
  }
  
  // Browser environment
  if (import.meta.env.DEV) {
    // Development: Use Vite proxy
    return '/api/tagger/graphql';
  } else {
    // Production: Use Vercel serverless function
    return '/api/tagger-proxy';
  }
})();

// Default public credentials that seem to work for read-only access
const DEFAULT_CSRF_TOKEN = 'cepmUnygTvN63NBHK4KTAPzhPXY0cYdKF0zwnEr6fiTZfqiQGrQNAuvvOz5bQhfi1awVuMT3KRR2sRUeUxJhCw';
const DEFAULT_SESSION_COOKIE = '_ga=GA1.2.358669891.1665763652; _ga_3P82LCZY01=GS1.1.1678978267.11.0.1678978270.0.0.0; _scryfall_tagger_session=J92dHYSC0KCeQfyDPKUZSB0fTvAEGcFaX3HkdkQtu3baDx3PJvO0ME7zEvVOZRihxSDLy8wSkvORcYiXqkbZMPdS3Lr7ZlJCgqnBk5hclE5205bMOSVSMvDZcpzOjXyw2QSieAE92m9wIUF3WYP7Dx9B6TVQB%2BlPLDh0GmLHrOu3vR7bFnqNwfxzNP4KJDhhZM5NYAEkYhYODhoOCDpo4uXvoKJdazVIHvZepWY%2FUKsF%2FDaEMXLZSWeIAM20E0jXzpH0m%2FUeYm9ZjbGTldIFUFIAsWMdwCzmIP4uOFKfIjI%3D--8P6bhrh4Ogk8VTYT--yP%2FrcXS9RJiSPYbvNMwfXA%3D%3D';

// GraphQL query to search for cards by name
const SEARCH_CARDS_QUERY = `
  query SearchCards($input: CardSearchInput!) {
    cards(input: $input) {
      page
      perPage
      total
      results {
        ...CardAttrs
      }
    }
  }
  
  fragment CardAttrs on Card {
    artImageUrl
    backside
    cardImageUrl
    collectorNumber
    id
    illustrationId
    name
    oracleId
    printingId
    set
  }
`;

// GraphQL query to fetch card tags
const FETCH_CARD_QUERY = `
  query FetchCard(
    $set: String!
    $number: String!
    $back: Boolean = false
    $moderatorView: Boolean = false
  ) {
    card: cardBySet(set: $set, number: $number, back: $back) {
      ...CardAttrs
      backside
      layout
      scryfallUrl
      sideNames
      twoSided
      rotatedLayout
      taggings(moderatorView: $moderatorView) {
        ...TaggingAttrs
        tag {
          ...TagAttrs
          ancestorTags {
            ...TagAttrs
          }
        }
      }
      relationships(moderatorView: $moderatorView) {
        ...RelationshipAttrs
      }
    }
  }
  
  fragment CardAttrs on Card {
    artImageUrl
    backside
    cardImageUrl
    collectorNumber
    id
    illustrationId
    name
    oracleId
    printingId
    set
  }

  fragment RelationshipAttrs on Relationship {
    classifier
    classifierInverse
    annotation
    subjectId
    subjectName
    createdAt
    creatorId
    foreignKey
    id
    name
    pendingRevisions
    relatedId
    relatedName
    status
    type
  }

  fragment TagAttrs on Tag {
    category
    createdAt
    creatorId
    id
    name
    namespace
    pendingRevisions
    slug
    status
    type
  }

  fragment TaggingAttrs on Tagging {
    annotation
    subjectId
    createdAt
    creatorId
    foreignKey
    id
    pendingRevisions
    type
    status
    weight
  }
`;

export interface TaggerTag {
  name: string;
  slug: string;
  category: boolean | string;  // Can be false or a category name
  namespace?: string;
  type?: 'ORACLE_CARD_TAG' | 'ILLUSTRATION_TAG' | string;
  status?: string;
  ancestorTags?: TaggerTag[];
}

export interface Tagging {
  tag: TaggerTag;
  status?: string;
  type?: string;
  weight?: string;
}

export interface TaggerCard {
  name: string;
  oracleId: string;
  taggings: Tagging[];
}

export interface TaggerResponse {
  data?: {
    card: TaggerCard;
  };
  errors?: Array<{
    message: string;
  }>;
  success?: boolean;
  message?: string;
}

export interface SearchResult {
  artImageUrl: string;
  backside: boolean;
  cardImageUrl: string;
  collectorNumber: string;
  id: string;
  illustrationId: string;
  name: string;
  oracleId: string;
  printingId: string;
  set: string;
}

export interface SearchResponse {
  data?: {
    cards: {
      page: number;
      perPage: number;
      total: number;
      results: SearchResult[];
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

export interface TaggerAuthOptions {
  csrfToken?: string;
  cookie?: string;
}

/**
 * Fetch tags for a card using the Tagger GraphQL API
 * @param set - The set code (e.g., "dom" for Dominaria)
 * @param number - The collector number
 * @param back - Whether to fetch the back face of a double-sided card
 * @param authOptions - Optional authentication options (uses defaults if not provided)
 * @returns The card data with tags, or null if not found
 */
export async function fetchCardTags(
  set: string,
  number: string,
  back: boolean = false,
  authOptions?: TaggerAuthOptions
): Promise<TaggerCard | null> {
  // Use provided credentials or fall back to defaults
  const cookie = authOptions?.cookie || DEFAULT_SESSION_COOKIE;
  const csrfToken = authOptions?.csrfToken || DEFAULT_CSRF_TOKEN;

  // In production browser environment, we'll use the Vercel proxy
  // No need to check for CORS issues since we have a proxy set up

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
    };

    // Only add auth headers if not using the dev proxy
    if (!(typeof window !== 'undefined' && import.meta.env.DEV)) {
      Object.assign(headers, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
        'Origin': 'https://tagger.scryfall.com',
        'Referer': `https://tagger.scryfall.com/card/${set}/${number}`,
        'Cookie': cookie,
        'X-CSRF-Token': csrfToken,
      });
    }

    console.log(`Fetching card tags for ${set}/${number} from Tagger API`);

    const response = await fetch(TAGGER_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: FETCH_CARD_QUERY,
        variables: {
          set,
          number,
          back,
          moderatorView: false,
        },
        operationName: 'FetchCard',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Tagger API error: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const data: TaggerResponse = await response.json();

    if (data.success === false) {
      console.error('API error:', data.message);
      return null;
    }

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return null;
    }

    return data.data?.card || null;
  } catch (error) {
    console.error('Failed to fetch from Tagger API:', error);
    return null;
  }
}

/**
 * Check if a tag and all its ancestors have GOOD_STANDING status
 * @param tag - The tag to check
 * @returns true if the tag and all ancestors have GOOD_STANDING status
 */
function hasGoodStandingStatus(tag: TaggerTag): boolean {
  // Check the tag itself
  if (tag.status && tag.status !== 'GOOD_STANDING') {
    return false;
  }
  
  // Check all ancestor tags recursively
  if (tag.ancestorTags) {
    return tag.ancestorTags.every(ancestor => hasGoodStandingStatus(ancestor));
  }
  
  return true;
}

/**
 * Extract oracle (functional) tags from a card's taggings
 * Only includes tags where both the tagging and the tag (including all ancestors) have GOOD_STANDING status
 * @param card - The card data from the Tagger API
 * @returns Array of oracle tag names
 */
export function extractOracleTags(card: TaggerCard): string[] {
  return card.taggings
    .filter(tagging => {
      // Check if the tagging itself has GOOD_STANDING status
      if (tagging.status && tagging.status !== 'GOOD_STANDING') {
        return false;
      }
      
      // Check if this is an oracle tag
      const isOracleTag = tagging.tag.type === 'ORACLE_CARD_TAG' || 
                         tagging.tag.namespace === 'card';
      
      if (!isOracleTag) {
        return false;
      }
      
      // Check if the tag and all its ancestors have GOOD_STANDING status
      return hasGoodStandingStatus(tagging.tag);
    })
    .map(tagging => tagging.tag.name);
}

/**
 * Convert a Scryfall card to set/number format needed for Tagger API
 * @param card - A Scryfall card object
 * @returns Object with set code and collector number, or null if not available
 */
export function getCardIdentifiers(card: { set: string; collector_number: string }) {
  return {
    set: card.set,
    number: card.collector_number,
  };
}

/**
 * Search for cards by name using the Tagger GraphQL API
 * @param query - The search query (card name)
 * @param page - Page number (default: 1)
 * @param mode - Search mode (default: "CARD")
 * @param authOptions - Optional authentication options (uses defaults if not provided)
 * @returns Search results or null if failed
 */
export async function searchCardsByName(
  query: string,
  page: number = 1,
  mode: 'CARD' | 'ILLUSTRATION' = 'CARD',
  authOptions?: TaggerAuthOptions
): Promise<SearchResult[] | null> {
  // Use provided credentials or fall back to defaults
  const cookie = authOptions?.cookie || DEFAULT_SESSION_COOKIE;
  const csrfToken = authOptions?.csrfToken || DEFAULT_CSRF_TOKEN;

  // In production browser environment, we'll use the Vercel proxy
  // No need to check for CORS issues since we have a proxy set up

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
    };

    // Only add auth headers if not using the dev proxy
    if (!(typeof window !== 'undefined' && import.meta.env.DEV)) {
      Object.assign(headers, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
        'Origin': 'https://tagger.scryfall.com',
        'Referer': `https://tagger.scryfall.com/search?q=${encodeURIComponent(query)}&mode=${mode}`,
        'Cookie': cookie,
        'X-CSRF-Token': csrfToken,
      });
    }

    console.log(`Searching for cards with query: "${query}"`);

    const response = await fetch(TAGGER_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: SEARCH_CARDS_QUERY,
        variables: {
          input: {
            query,
            mode,
            page,
          },
        },
        operationName: 'SearchCards',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Tagger API error: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const data: SearchResponse = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return null;
    }

    return data.data?.cards.results || null;
  } catch (error) {
    console.error('Failed to search cards:', error);
    return null;
  }
}