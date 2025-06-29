import type { MoxfieldCard } from './moxfield';
import type { Card as ScryfallCard } from './scryfall';

/**
 * Unified card aggregate that combines data from all sources
 * This is the single source of truth for card data in the application
 */
export interface CardAggregate {
  // === Identity ===
  id: string; // Unique identifier (Scryfall ID when available)
  name: string;
  
  // === Source References ===
  moxfieldId?: string;
  scryfallId?: string;
  oracleId?: string;
  
  // === Set Information (Required for Tagger) ===
  set: string;
  setName: string;
  collectorNumber: string;
  
  // === Deck Information ===
  quantity: number;
  board: 'mainboard' | 'sideboard' | 'commander' | 'companion';
  
  // === Moxfield-specific Data ===
  isFoil?: boolean;
  isAlter?: boolean;
  condition?: string;
  language?: string;
  
  // === Card Details (from Scryfall) ===
  manaCost?: string;
  cmc: number;
  typeLine: string;
  oracleText?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  colors: string[];
  colorIdentity: string[];
  
  // === Visual Data ===
  imageUris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
    art_crop?: string;
    border_crop?: string;
  };
  
  // === Market Data ===
  prices?: {
    usd?: string;
    usd_foil?: string;
    eur?: string;
    eur_foil?: string;
  };
  
  // === Game Data ===
  legalities?: Record<string, string>;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';
  
  // === Metadata ===
  artist?: string;
  flavorText?: string;
  releasedAt?: string;
  
  // === Oracle Tags (from Tagger) ===
  oracleTags: string[];
  taggerFetched: boolean;
  taggerError?: string;
  
  // === Evaluation Data ===
  isCommander?: boolean;
  isCompanion?: boolean;
  
  // === Raw Data References ===
  _moxfieldData?: MoxfieldCard;
  _scryfallData?: ScryfallCard;
}

/**
 * Progress tracking for deck import process
 */
export interface DeckImportProgress {
  stage: 'idle' | 'moxfield' | 'scryfall' | 'tagger' | 'complete' | 'error';
  currentCard?: string;
  cardsProcessed: number;
  totalCards: number;
  errors: Array<{
    cardName: string;
    stage: string;
    error: string;
  }>;
}

/**
 * Result of the deck import process
 */
export interface DeckImportResult {
  cards: CardAggregate[];
  deckName: string;
  deckAuthor: string;
  format?: string;
  errors: DeckImportProgress['errors'];
}