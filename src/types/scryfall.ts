/**
 * Scryfall API Type Definitions
 * Based on official Scryfall API documentation
 * @see https://scryfall.com/docs/api
 */

// Color type - single character abbreviations for MTG colors
export type Color = 'W' | 'U' | 'B' | 'R' | 'G';

// Legality status for different formats
export type LegalityStatus = 'legal' | 'not_legal' | 'restricted' | 'banned';

// Card layout types
export type CardLayout =
  | 'normal'
  | 'split'
  | 'flip'
  | 'transform'
  | 'modal_dfc'
  | 'meld'
  | 'leveler'
  | 'class'
  | 'saga'
  | 'adventure'
  | 'battle'
  | 'planar'
  | 'scheme'
  | 'vanguard'
  | 'token'
  | 'double_faced_token'
  | 'emblem'
  | 'augment'
  | 'host'
  | 'art_series'
  | 'reversible_card';

// Rarity types
export type Rarity = 'common' | 'uncommon' | 'rare' | 'special' | 'mythic' | 'bonus';

// Frame types
export type Frame = '1993' | '1997' | '2003' | '2015' | 'future';

// Border color types
export type BorderColor = 'black' | 'white' | 'borderless' | 'yellow' | 'silver' | 'gold';

// Security stamp types
export type SecurityStamp = 'oval' | 'triangle' | 'acorn' | 'circle' | 'arena' | 'heart';

// Game types
export type Game = 'paper' | 'arena' | 'mtgo';

// Finish types
export type Finish = 'foil' | 'nonfoil' | 'etched';

// Image status types
export type ImageStatus = 'missing' | 'placeholder' | 'lowres' | 'highres_scan';

// Set types
export type SetType =
  | 'core'
  | 'expansion'
  | 'masters'
  | 'alchemy'
  | 'masterpiece'
  | 'arsenal'
  | 'from_the_vault'
  | 'spellbook'
  | 'premium_deck'
  | 'duel_deck'
  | 'draft_innovation'
  | 'treasure_chest'
  | 'commander'
  | 'planechase'
  | 'archenemy'
  | 'vanguard'
  | 'funny'
  | 'starter'
  | 'box'
  | 'promo'
  | 'token'
  | 'memorabilia'
  | 'minigame';

/**
 * Image URIs for different card image formats
 */
export interface ImageUris {
  small?: string; // 146 × 204
  normal?: string; // 488 × 680
  large?: string; // 672 × 936
  png?: string; // 745 × 1040
  art_crop?: string; // Varies
  border_crop?: string; // 480 × 680
}

/**
 * Card prices in various currencies
 */
export interface Prices {
  usd?: string | null;
  usd_foil?: string | null;
  usd_etched?: string | null;
  eur?: string | null;
  eur_foil?: string | null;
  eur_etched?: string | null;
  tix?: string | null;
}

/**
 * Purchase URIs for various marketplaces
 */
export interface PurchaseUris {
  tcgplayer?: string;
  cardmarket?: string;
  cardhoarder?: string;
}

/**
 * Related URIs for additional resources
 */
export interface RelatedUris {
  gatherer?: string;
  tcgplayer_infinite_articles?: string;
  tcgplayer_infinite_decks?: string;
  edhrec?: string;
}

/**
 * Legalities object describing format legality
 */
export interface Legalities {
  standard: LegalityStatus;
  future: LegalityStatus;
  historic: LegalityStatus;
  timeless: LegalityStatus;
  gladiator: LegalityStatus;
  pioneer: LegalityStatus;
  explorer: LegalityStatus;
  modern: LegalityStatus;
  legacy: LegalityStatus;
  pauper: LegalityStatus;
  vintage: LegalityStatus;
  penny: LegalityStatus;
  commander: LegalityStatus;
  oathbreaker: LegalityStatus;
  standardbrawl: LegalityStatus;
  brawl: LegalityStatus;
  alchemy: LegalityStatus;
  paupercommander: LegalityStatus;
  duel: LegalityStatus;
  oldschool: LegalityStatus;
  premodern: LegalityStatus;
  predh: LegalityStatus;
}

/**
 * Preview information for newly spoiled cards
 */
export interface Preview {
  source?: string;
  source_uri?: string;
  previewed_at?: string;
}

/**
 * Related card object for cards with relationships
 */
export interface RelatedCard {
  id: string;
  object: 'related_card';
  component: 'token' | 'meld_part' | 'meld_result' | 'combo_piece';
  name: string;
  type_line: string;
  uri: string;
}

/**
 * Card face object for multi-faced cards
 */
export interface CardFace {
  object: 'card_face';
  name: string;
  mana_cost: string;
  type_line?: string;
  oracle_text?: string;
  colors?: Color[];
  color_indicator?: Color[];
  power?: string;
  toughness?: string;
  loyalty?: string;
  defense?: string;
  artist?: string;
  artist_id?: string;
  illustration_id?: string;
  image_uris?: ImageUris;
  flavor_text?: string;
  printed_name?: string;
  printed_text?: string;
  printed_type_line?: string;
  watermark?: string;
  oracle_id?: string;
  cmc?: number;
  layout?: CardLayout;
}

/**
 * Main Card object representing a Magic card
 */
export interface Card {
  // Core fields
  object: 'card';
  id: string;
  oracle_id?: string;
  multiverse_ids?: number[];
  mtgo_id?: number;
  mtgo_foil_id?: number;
  tcgplayer_id?: number;
  tcgplayer_etched_id?: number;
  cardmarket_id?: number;
  arena_id?: number;

  // Names and text
  name: string;
  lang: string;
  released_at: string;
  uri: string;
  scryfall_uri: string;
  layout: CardLayout;
  highres_image: boolean;
  image_status: ImageStatus;
  image_uris?: ImageUris;

  // Gameplay fields
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  defense?: string;
  life_modifier?: string;
  hand_modifier?: string;

  // Colors
  colors?: Color[];
  color_identity: Color[];
  color_indicator?: Color[];
  produced_mana?: Color[];

  // Game mechanics
  keywords: string[];
  legalities: Legalities;
  games: Game[];
  reserved: boolean;
  foil: boolean;
  nonfoil: boolean;
  finishes: Finish[];
  oversized: boolean;
  promo: boolean;
  reprint: boolean;
  variation: boolean;
  variation_of?: string;
  set_id: string;
  set: string;
  set_name: string;
  set_type: SetType;
  set_uri: string;
  set_search_uri: string;
  scryfall_set_uri: string;
  rulings_uri: string;
  prints_search_uri: string;

  // Collector information
  collector_number: string;
  digital: boolean;
  rarity: Rarity;
  flavor_text?: string;
  card_back_id: string;
  artist?: string;
  artist_ids?: string[];
  illustration_id?: string;
  border_color: BorderColor;
  frame: Frame;
  frame_effects?: string[];
  security_stamp?: SecurityStamp;
  full_art: boolean;
  textless: boolean;
  booster: boolean;
  story_spotlight: boolean;
  promo_types?: string[];

  // Prices and purchase
  prices: Prices;
  related_uris: RelatedUris;
  purchase_uris?: PurchaseUris;

  // Additional fields
  edhrec_rank?: number;
  penny_rank?: number;
  game_changer?: boolean;
  watermark?: string;
  printed_name?: string;
  printed_text?: string;
  printed_type_line?: string;
  content_warning?: boolean;
  attraction_lights?: number[];
  preview?: Preview;

  // Multi-face fields
  card_faces?: CardFace[];
  all_parts?: RelatedCard[];
}

/**
 * List response wrapper for paginated results
 */
export interface ListResponse<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  next_page?: string;
  total_cards?: number;
  warnings?: string[];
}

/**
 * Error response from Scryfall API
 */
export interface ScryfallError {
  object: 'error';
  code: string;
  status: number;
  details: string;
  warnings?: string[];
}

/**
 * Catalog response for simple string lists
 */
export interface Catalog {
  object: 'catalog';
  uri: string;
  total_values: number;
  data: string[];
}

/**
 * Card Symbol object
 */
export interface CardSymbol {
  object: 'card_symbol';
  symbol: string;
  loose_variant?: string;
  english: string;
  transposable: boolean;
  represents_mana: boolean;
  mana_value?: number;
  appears_in_mana_costs: boolean;
  funny: boolean;
  colors: Color[];
  hybrid: boolean;
  phyrexian: boolean;
  gatherer_alternates?: string[];
  svg_uri?: string;
}

/**
 * Set object
 */
export interface Set {
  object: 'set';
  id: string;
  code: string;
  mtgo_code?: string;
  arena_code?: string;
  tcgplayer_id?: number;
  name: string;
  set_type: SetType;
  released_at?: string;
  block_code?: string;
  block?: string;
  parent_set_code?: string;
  card_count: number;
  printed_size?: number;
  digital: boolean;
  foil_only: boolean;
  nonfoil_only: boolean;
  scryfall_uri: string;
  uri: string;
  icon_svg_uri: string;
  search_uri: string;
}

/**
 * Ruling object
 */
export interface Ruling {
  object: 'ruling';
  oracle_id: string;
  source: 'wotc' | 'scryfall';
  published_at: string;
  comment: string;
}

/**
 * Card Migration object
 */
export interface CardMigration {
  object: 'migration';
  uri: string;
  id: string;
  performed_at: string;
  migration_strategy: 'merge' | 'delete';
  old_scryfall_id: string;
  new_scryfall_id?: string;
  note?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

/**
 * Bulk Data object
 */
export interface BulkData {
  object: 'bulk_data';
  id: string;
  uri: string;
  type: string;
  name: string;
  description: string;
  download_uri: string;
  updated_at: string;
  size: number; // File size in bytes
  content_type: string;
  content_encoding: string;
}

/**
 * Card identifier for collection endpoint
 */
export type CardIdentifier =
  | { id: string }
  | { mtgo_id: number }
  | { multiverse_id: number }
  | { oracle_id: string }
  | { illustration_id: string }
  | { name: string }
  | { name: string; set: string }
  | { collector_number: string; set: string };

/**
 * Collection request for fetching multiple cards
 */
export interface CollectionRequest {
  identifiers: CardIdentifier[];
}

/**
 * Collection response
 */
export interface CollectionResponse {
  object: 'list';
  not_found: CardIdentifier[];
  data: Card[];
}

/**
 * Search parameters for card search
 */
export interface SearchParams {
  q: string;
  unique?: 'cards' | 'art' | 'prints';
  order?: string;
  dir?: 'auto' | 'asc' | 'desc';
  include_extras?: boolean;
  include_multilingual?: boolean;
  include_variations?: boolean;
  page?: number;
  format?: 'json' | 'csv';
  pretty?: boolean;
}

/**
 * Named card search parameters
 */
export interface NamedCardParams {
  exact?: string;
  fuzzy?: string;
  set?: string;
  format?: 'json' | 'text' | 'image';
  face?: 'front' | 'back';
  version?: 'small' | 'normal' | 'large' | 'png' | 'art_crop' | 'border_crop';
  pretty?: boolean;
}

/**
 * Autocomplete response
 */
export interface AutocompleteResponse {
  object: 'catalog';
  total_values: number;
  data: string[];
}
