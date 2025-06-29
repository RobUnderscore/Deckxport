/**
 * Mock Moxfield service for development
 * This demonstrates how the app would work with a proper backend
 */

import type { MoxfieldDeck } from '@/types/moxfield';

// Sample deck data for testing
const SAMPLE_DECK: MoxfieldDeck = {
  id: 'lkwkRXXSmkSd1W7VkOIjwQ',
  publicId: 'lkwkRXXSmkSd1W7VkOIjwQ',
  publicUrl: 'https://www.moxfield.com/decks/lkwkRXXSmkSd1W7VkOIjwQ',
  name: 'Sample Commander Deck',
  description: 'This is a sample deck for testing',
  format: 'commander',
  visibility: 'public',
  createdByUser: {
    userName: 'testuser',
    displayName: 'Test User',
  },
  createdAtUtc: new Date().toISOString(),
  lastUpdatedAtUtc: new Date().toISOString(),
  version: 1,
  likeCount: 0,
  viewCount: 0,
  commentCount: 0,
  mainboard: {
    'Lightning Bolt': {
      quantity: 1,
      boardType: 'mainboard',
      finish: 'nonfoil',
    },
    Counterspell: {
      quantity: 1,
      boardType: 'mainboard',
      finish: 'nonfoil',
    },
    'Dark Ritual': {
      quantity: 1,
      boardType: 'mainboard',
      finish: 'nonfoil',
    },
    'Birds of Paradise': {
      quantity: 1,
      boardType: 'mainboard',
      finish: 'nonfoil',
    },
    Brainstorm: {
      quantity: 1,
      boardType: 'mainboard',
      finish: 'nonfoil',
    },
    'Path to Exile': {
      quantity: 1,
      boardType: 'mainboard',
      finish: 'nonfoil',
    },
    'Sol Ring': {
      quantity: 1,
      boardType: 'mainboard',
      finish: 'nonfoil',
    },
    'Command Tower': {
      quantity: 1,
      boardType: 'mainboard',
      finish: 'nonfoil',
    },
  },
  sideboard: {},
};

export async function fetchMoxfieldDeckMock(deckId: string): Promise<MoxfieldDeck> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return sample data with the requested deck ID
  return {
    ...SAMPLE_DECK,
    id: deckId,
    publicId: deckId,
    publicUrl: `https://www.moxfield.com/decks/${deckId}`,
  };
}
