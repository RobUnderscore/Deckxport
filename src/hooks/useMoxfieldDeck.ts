/**
 * Custom React hooks for Moxfield deck operations using TanStack Query
 */

import { useQuery, useQueries, type UseQueryOptions } from '@tanstack/react-query';
import { fetchMoxfieldDeck, fetchUserDecks, MoxfieldApiError } from '@/services/moxfield';
import { extractDeckIdFromUrl, isValidMoxfieldUrl } from '@/utils/moxfield';
import type { MoxfieldDeck, MoxfieldUserDecksResponse, MoxfieldCard } from '@/types/moxfield';

/**
 * Query key factory for Moxfield queries
 */
export const moxfieldKeys = {
  all: ['moxfield'] as const,
  decks: () => [...moxfieldKeys.all, 'decks'] as const,
  deck: (deckId: string) => [...moxfieldKeys.decks(), deckId] as const,
  userDecks: (username: string) => [...moxfieldKeys.all, 'users', username, 'decks'] as const,
  userDecksPaginated: (username: string, page: number, pageSize: number) =>
    [...moxfieldKeys.userDecks(username), { page, pageSize }] as const,
};

/**
 * Hook to fetch a single Moxfield deck by ID or URL
 * @param deckIdOrUrl - Deck ID or full Moxfield URL
 * @param options - Additional query options
 */
export function useMoxfieldDeck(
  deckIdOrUrl: string | undefined,
  options?: Omit<UseQueryOptions<MoxfieldDeck, MoxfieldApiError>, 'queryKey' | 'queryFn'>
) {
  // Extract deck ID if URL provided
  const deckId = deckIdOrUrl
    ? isValidMoxfieldUrl(deckIdOrUrl)
      ? extractDeckIdFromUrl(deckIdOrUrl)
      : deckIdOrUrl
    : undefined;

  return useQuery({
    queryKey: deckId ? moxfieldKeys.deck(deckId) : ['moxfield-deck-invalid'],
    queryFn: () => {
      if (!deckId) {
        throw new MoxfieldApiError('Invalid deck ID or URL');
      }
      return fetchMoxfieldDeck(deckId);
    },
    enabled: !!deckId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    ...options,
  });
}

/**
 * Hook to fetch multiple Moxfield decks in parallel
 * @param deckIdsOrUrls - Array of deck IDs or URLs
 * @param options - Additional query options
 */
export function useMoxfieldDecks(
  deckIdsOrUrls: string[],
  options?: Omit<UseQueryOptions<MoxfieldDeck, MoxfieldApiError>, 'queryKey' | 'queryFn'>
) {
  const queries = deckIdsOrUrls.map((deckIdOrUrl) => {
    const deckId = isValidMoxfieldUrl(deckIdOrUrl)
      ? extractDeckIdFromUrl(deckIdOrUrl)
      : deckIdOrUrl;

    return {
      queryKey: deckId ? moxfieldKeys.deck(deckId) : ['moxfield-deck-invalid'],
      queryFn: () => {
        if (!deckId) {
          throw new MoxfieldApiError('Invalid deck ID or URL');
        }
        return fetchMoxfieldDeck(deckId);
      },
      enabled: !!deckId && (options?.enabled ?? true),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      ...options,
    };
  });

  return useQueries({ queries });
}

/**
 * Hook to fetch a user's public decks
 * @param username - Moxfield username
 * @param page - Page number (1-indexed)
 * @param pageSize - Results per page
 * @param options - Additional query options
 */
export function useUserDecks(
  username: string | undefined,
  page: number = 1,
  pageSize: number = 20,
  options?: Omit<
    UseQueryOptions<MoxfieldUserDecksResponse, MoxfieldApiError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: username
      ? moxfieldKeys.userDecksPaginated(username, page, pageSize)
      : ['moxfield-user-invalid'],
    queryFn: () => {
      if (!username) {
        throw new MoxfieldApiError('Username is required');
      }
      return fetchUserDecks(username, pageSize, page);
    },
    enabled: !!username && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Utility hook to extract and flatten all cards from a deck
 * @param deck - The Moxfield deck data
 * @returns Flattened array of cards with board type
 */
export function useDeckCards(deck: MoxfieldDeck | undefined) {
  if (!deck) return [];

  const cards: Array<{ card: MoxfieldCard; boardType: string; cardName: string }> = [];

  // Handle v3 API structure
  if (deck.boards) {
    // Process mainboard
    if (deck.boards.mainboard?.cards) {
      Object.entries(deck.boards.mainboard.cards).forEach(([cardId, card]) => {
        // In v3, the key is card ID and name is in card.card.name
        const cardName = card.card?.name || cardId;
        cards.push({ card, boardType: 'mainboard', cardName });
      });
    }

    // Process sideboard
    if (deck.boards.sideboard?.cards) {
      Object.entries(deck.boards.sideboard.cards).forEach(([cardId, card]) => {
        const cardName = card.card?.name || cardId;
        cards.push({ card, boardType: 'sideboard', cardName });
      });
    }

    // Process commanders
    if (deck.boards.commanders?.cards) {
      Object.entries(deck.boards.commanders.cards).forEach(([cardId, card]) => {
        const cardName = card.card?.name || cardId;
        cards.push({ card, boardType: 'commander', cardName });
      });
    }

    // Process companion
    if (deck.boards.companion?.cards) {
      Object.entries(deck.boards.companion.cards).forEach(([cardId, card]) => {
        const cardName = card.card?.name || cardId;
        cards.push({ card, boardType: 'companion', cardName });
      });
    }
  }
  // Handle v2 API structure (fallback)
  else {
    // Process mainboard
    if (deck.mainboard) {
      Object.entries(deck.mainboard).forEach(([cardName, card]) => {
        cards.push({ card, boardType: 'mainboard', cardName });
      });
    }

    // Process sideboard
    if (deck.sideboard) {
      Object.entries(deck.sideboard).forEach(([cardName, card]) => {
        cards.push({ card, boardType: 'sideboard', cardName });
      });
    }

    // Process commanders
    if (deck.commanders) {
      Object.entries(deck.commanders).forEach(([cardName, card]) => {
        cards.push({ card, boardType: 'commander', cardName });
      });
    }

    // Process companion
    if (deck.companion) {
      Object.entries(deck.companion).forEach(([cardName, card]) => {
        cards.push({ card, boardType: 'companion', cardName });
      });
    }
  }

  return cards;
}

/**
 * Hook that combines deck fetching with card extraction
 * @param deckIdOrUrl - Deck ID or URL
 * @param options - Additional query options
 */
export function useMoxfieldDeckWithCards(
  deckIdOrUrl: string | undefined,
  options?: Omit<UseQueryOptions<MoxfieldDeck, MoxfieldApiError>, 'queryKey' | 'queryFn'>
) {
  const deckQuery = useMoxfieldDeck(deckIdOrUrl, options);
  const cards = useDeckCards(deckQuery.data);

  return {
    ...deckQuery,
    cards,
    totalCards: cards.reduce((sum, { card }) => sum + card.quantity, 0),
  };
}
