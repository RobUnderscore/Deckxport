/**
 * Moxfield API Type Definitions
 * Based on reverse-engineered API endpoints and community findings
 * Note: Moxfield does not have official public API documentation
 * @see https://api.moxfield.com
 */

/**
 * Card condition types
 */
export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'D' | 'PL';

/**
 * Card language codes
 */
export type CardLanguage = 'en' | 'ja' | 'de' | 'fr' | 'it' | 'es' | 'pt' | 'ru' | 'ko' | 'zhs' | 'zht';

/**
 * Deck visibility settings
 */
export type DeckVisibility = 'public' | 'private' | 'unlisted';

/**
 * Deck format types
 */
export type DeckFormat = 
  | 'standard'
  | 'modern'
  | 'legacy'
  | 'vintage'
  | 'commander'
  | 'pauper'
  | 'pioneer'
  | 'historic'
  | 'alchemy'
  | 'explorer'
  | 'brawl'
  | 'penny'
  | 'oathbreaker'
  | 'paupercommander'
  | 'casual'
  | 'limited';

/**
 * Card in a Moxfield deck
 */
export interface MoxfieldCard {
  // Card identification
  quantity: number;
  boardType: 'mainboard' | 'sideboard' | 'companion' | 'commander' | 'partner' | 'signature' | 'sticker';
  
  // Physical card attributes
  finish: 'nonfoil' | 'foil' | 'etched';
  isFoil?: boolean; // Legacy field, use finish instead
  isAlter?: boolean;
  isProxy?: boolean;
  condition?: CardCondition;
  language?: CardLanguage;
  
  // Set and printing info
  set?: string; // Set code
  setName?: string;
  collectorNumber?: string;
  
  // User customization
  tags?: string[];
  notes?: string;
  
  // Price tracking
  purchasePrice?: number;
  purchaseCurrency?: string;
  purchaseDate?: string;
  
  // Card details (populated from Scryfall)
  card?: MoxfieldCardData;
}

/**
 * Basic card data structure in Moxfield
 */
export interface MoxfieldCardData {
  id: string; // Scryfall ID
  name: string;
  set: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  color_identity: string[];
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  image_normal?: string;
  image_large?: string;
  prices?: {
    usd?: number;
    usd_foil?: number;
    eur?: number;
    eur_foil?: number;
    tix?: number;
  };
}

/**
 * Deck statistics
 */
export interface DeckStats {
  // Card counts
  totalCards: number;
  mainboardCount: number;
  sideboardCount: number;
  companionCount?: number;
  commanderCount?: number;
  
  // Mana curve
  manaCurve: {
    [key: string]: number; // "0": 5, "1": 10, etc.
  };
  
  // Color breakdown
  colorBreakdown: {
    white: number;
    blue: number;
    black: number;
    red: number;
    green: number;
    colorless: number;
    multicolor: number;
  };
  
  // Type breakdown
  typeBreakdown: {
    creature: number;
    instant: number;
    sorcery: number;
    enchantment: number;
    artifact: number;
    planeswalker: number;
    land: number;
    other: number;
  };
  
  // Price information
  prices?: {
    total: number;
    mainboard: number;
    sideboard: number;
    currency: string;
  };
}

/**
 * Deck hub information
 */
export interface DeckHub {
  name: string;
  slug: string;
  description?: string;
}

/**
 * Deck object from Moxfield API
 */
export interface MoxfieldDeck {
  // Identification
  id: string;
  publicId: string;
  publicUrl: string;
  
  // Basic info
  name: string;
  description?: string;
  format: DeckFormat;
  visibility: DeckVisibility;
  
  // Authorship
  createdByUser: {
    userName: string;
    displayName?: string;
    badges?: string[];
  };
  
  // Timestamps
  createdAtUtc: string;
  lastUpdatedAtUtc: string;
  publishedAtUtc?: string;
  
  // Version tracking
  version: number;
  previousVersions?: number[];
  
  // Hub associations
  hubs?: DeckHub[];
  
  // Affiliates
  affiliates?: {
    tcgPlayerId?: string;
    archidektId?: string;
    moxfieldId?: string;
  };
  
  // Likes and views
  likeCount: number;
  viewCount: number;
  commentCount: number;
  
  // Cards data
  mainboard: { [cardName: string]: MoxfieldCard };
  sideboard?: { [cardName: string]: MoxfieldCard };
  companion?: { [cardName: string]: MoxfieldCard };
  commanders?: { [cardName: string]: MoxfieldCard };
  
  // Computed stats
  stats?: DeckStats;
  
  // Deck tokens
  tokens?: string[];
  
  // Featured card for thumbnail
  featuredCard?: string;
  
  // Tags
  tags?: string[];
}

/**
 * Paginated response from Moxfield API
 */
export interface MoxfieldPaginatedResponse<T> {
  pageNumber: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  data: T[];
}

/**
 * User's decks list response
 */
export type MoxfieldUserDecksResponse = MoxfieldPaginatedResponse<MoxfieldDeckSummary>;

/**
 * Deck summary in list views
 */
export interface MoxfieldDeckSummary {
  id: string;
  publicId: string;
  publicUrl: string;
  name: string;
  format: DeckFormat;
  visibility: DeckVisibility;
  createdByUser: {
    userName: string;
  };
  createdAtUtc: string;
  lastUpdatedAtUtc: string;
  mainboardCount: number;
  sideboardCount: number;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  hasPrimer: boolean;
  colors?: string[]; // Color identity
  featuredCard?: string;
  hubNames?: string[];
}

/**
 * Import/Export CSV format
 */
export interface MoxfieldCSVRow {
  Count: string;
  Name: string;
  Edition?: string;
  Condition?: CardCondition;
  Language?: CardLanguage;
  Foil?: 'Yes' | 'No' | '';
  Tag?: string;
}

/**
 * API endpoints configuration
 */
export interface MoxfieldAPIEndpoints {
  base: 'https://api.moxfield.com';
  version: 'v2';
  decks: {
    userDecks: '/users/{username}/decks';
    deckDetails: '/decks/all/{publicId}';
    search: '/decks/search';
  };
}

/**
 * Search parameters for deck search
 */
export interface MoxfieldSearchParams {
  q?: string;
  format?: DeckFormat;
  colors?: string; // Color identity filter
  includePartners?: boolean;
  commander?: string;
  hub?: string;
  author?: string;
  minCards?: number;
  maxCards?: number;
  minLikes?: number;
  sort?: 'likes' | 'views' | 'comments' | 'updated' | 'created';
  direction?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Error response from Moxfield API
 */
export interface MoxfieldError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}