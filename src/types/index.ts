/**
 * Re-export all type definitions
 */

// Scryfall API types
export * from './scryfall';

// Moxfield API types
export * from './moxfield';

// Legacy types - to be removed once migration is complete
export interface Card {
  id: string
  name: string
  manaCost: string
  type: string
  text: string
  power?: string
  toughness?: string
  imageUrl?: string
}

export interface Deck {
  id: string
  name: string
  format: 'standard' | 'modern' | 'legacy' | 'vintage' | 'commander' | 'pioneer'
  cards: DeckCard[]
  createdAt: Date
  updatedAt: Date
}

export interface DeckCard {
  card: Card
  quantity: number
  isCommander?: boolean
  isSideboard?: boolean
}