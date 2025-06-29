import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import {
  useMoxfieldDeck,
  useMoxfieldDecks,
  useUserDecks,
  useDeckCards,
  moxfieldKeys,
} from '../useMoxfieldDeck';
import { AllTheProviders } from '@/tests/utils';
import type { MoxfieldDeck } from '@/types/moxfield';

// Mock the service module
vi.mock('@/services/moxfield', () => ({
  fetchMoxfieldDeck: vi.fn(),
  fetchUserDecks: vi.fn(),
  MoxfieldApiError: class MoxfieldApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'MoxfieldApiError';
    }
  },
}));

import { fetchMoxfieldDeck, fetchUserDecks } from '@/services/moxfield';

describe('Moxfield Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  describe('moxfieldKeys', () => {
    it('should generate correct query keys', () => {
      expect(moxfieldKeys.all).toEqual(['moxfield']);
      expect(moxfieldKeys.decks()).toEqual(['moxfield', 'decks']);
      expect(moxfieldKeys.deck('test123')).toEqual(['moxfield', 'decks', 'test123']);
      expect(moxfieldKeys.userDecks('testuser')).toEqual([
        'moxfield',
        'users',
        'testuser',
        'decks',
      ]);
      expect(moxfieldKeys.userDecksPaginated('testuser', 2, 20)).toEqual([
        'moxfield',
        'users',
        'testuser',
        'decks',
        { page: 2, pageSize: 20 },
      ]);
    });
  });

  describe('useMoxfieldDeck', () => {
    const mockDeck: MoxfieldDeck = {
      id: 'test-id',
      publicId: 'test123',
      publicUrl: 'https://moxfield.com/decks/test123',
      name: 'Test Deck',
      format: 'commander',
      visibility: 'public',
      createdByUser: {
        userName: 'testuser',
      },
      createdAtUtc: '2024-01-01T00:00:00Z',
      lastUpdatedAtUtc: '2024-01-01T00:00:00Z',
      version: 1,
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      mainboard: {
        'Lightning Bolt': {
          quantity: 4,
          boardType: 'mainboard',
          finish: 'nonfoil',
        },
      },
    };

    it('should fetch deck by ID', async () => {
      vi.mocked(fetchMoxfieldDeck).mockResolvedValueOnce(mockDeck);

      const { result } = renderHook(() => useMoxfieldDeck('test123'), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockDeck);
      expect(fetchMoxfieldDeck).toHaveBeenCalledWith('test123');
    });

    it('should extract deck ID from URL', async () => {
      vi.mocked(fetchMoxfieldDeck).mockResolvedValueOnce(mockDeck);

      const { result } = renderHook(() => useMoxfieldDeck('https://moxfield.com/decks/test123'), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchMoxfieldDeck).toHaveBeenCalledWith('test123');
    });

    it('should handle error from API', async () => {
      const error = new Error('Deck not found');
      vi.mocked(fetchMoxfieldDeck).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useMoxfieldDeck('non-existent-deck'), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(fetchMoxfieldDeck).toHaveBeenCalledWith('non-existent-deck');
    });

    it('should respect enabled option', () => {
      const { result } = renderHook(() => useMoxfieldDeck('test123', { enabled: false }), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
      expect(fetchMoxfieldDeck).not.toHaveBeenCalled();
    });
  });

  describe('useMoxfieldDecks', () => {
    it('should fetch multiple decks in parallel', async () => {
      const mockDeck1 = { id: '1', name: 'Deck 1' } as MoxfieldDeck;
      const mockDeck2 = { id: '2', name: 'Deck 2' } as MoxfieldDeck;

      vi.mocked(fetchMoxfieldDeck)
        .mockResolvedValueOnce(mockDeck1)
        .mockResolvedValueOnce(mockDeck2);

      const { result } = renderHook(() => useMoxfieldDecks(['deck1', 'deck2']), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => {
        expect(result.current.every((q) => q.isSuccess)).toBe(true);
      });

      expect(result.current[0].data).toEqual(mockDeck1);
      expect(result.current[1].data).toEqual(mockDeck2);
    });
  });

  describe('useUserDecks', () => {
    it('should fetch user decks', async () => {
      const mockResponse = {
        pageNumber: 1,
        pageSize: 20,
        totalResults: 1,
        totalPages: 1,
        data: [
          {
            id: 'deck1',
            publicId: 'deck1',
            publicUrl: 'https://moxfield.com/decks/deck1',
            name: 'User Deck',
            format: 'commander' as const,
            visibility: 'public' as const,
            createdByUser: { userName: 'testuser' },
            createdAtUtc: '2024-01-01',
            lastUpdatedAtUtc: '2024-01-01',
            mainboardCount: 99,
            sideboardCount: 0,
            likeCount: 0,
            viewCount: 0,
            commentCount: 0,
            hasPrimer: false,
          },
        ],
      };

      vi.mocked(fetchUserDecks).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useUserDecks('testuser'), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(fetchUserDecks).toHaveBeenCalledWith('testuser', 20, 1);
    });
  });

  describe('useDeckCards', () => {
    it('should extract all cards from v2 deck structure', () => {
      const mockDeck: MoxfieldDeck = {
        id: 'test',
        publicId: 'test',
        publicUrl: 'test',
        name: 'Test',
        format: 'commander',
        visibility: 'public',
        createdByUser: { userName: 'test' },
        createdAtUtc: '2024-01-01',
        lastUpdatedAtUtc: '2024-01-01',
        version: 1,
        likeCount: 0,
        viewCount: 0,
        commentCount: 0,
        mainboard: {
          'Card 1': { quantity: 4, boardType: 'mainboard', finish: 'nonfoil' },
          'Card 2': { quantity: 2, boardType: 'mainboard', finish: 'foil' },
        },
        sideboard: {
          'Card 3': { quantity: 1, boardType: 'sideboard', finish: 'nonfoil' },
        },
        commanders: {
          Commander: { quantity: 1, boardType: 'commander', finish: 'foil' },
        },
      };

      const cards = useDeckCards(mockDeck);

      expect(cards).toHaveLength(4);
      expect(cards[0]).toEqual({
        card: mockDeck.mainboard!['Card 1'],
        boardType: 'mainboard',
        cardName: 'Card 1',
      });
      expect(cards.find((c) => c.boardType === 'commander')).toBeTruthy();
      expect(cards.find((c) => c.boardType === 'sideboard')).toBeTruthy();
    });

    it('should extract all cards from v3 deck structure', () => {
      const mockDeck: MoxfieldDeck = {
        id: 'test',
        publicId: 'test',
        publicUrl: 'test',
        name: 'Test',
        format: 'commander',
        visibility: 'public',
        createdByUser: { userName: 'test' },
        createdAtUtc: '2024-01-01',
        lastUpdatedAtUtc: '2024-01-01',
        version: 1,
        likeCount: 0,
        viewCount: 0,
        commentCount: 0,
        boards: {
          mainboard: {
            count: 6,
            cards: {
              'Card 1': { quantity: 4, boardType: 'mainboard', finish: 'nonfoil' },
              'Card 2': { quantity: 2, boardType: 'mainboard', finish: 'foil' },
            },
          },
          sideboard: {
            count: 1,
            cards: {
              'Card 3': { quantity: 1, boardType: 'sideboard', finish: 'nonfoil' },
            },
          },
          commanders: {
            count: 1,
            cards: {
              Commander: { quantity: 1, boardType: 'commander', finish: 'foil' },
            },
          },
        },
      };

      const cards = useDeckCards(mockDeck);

      expect(cards).toHaveLength(4);
      expect(cards[0]).toEqual({
        card: mockDeck.boards!.mainboard!.cards['Card 1'],
        boardType: 'mainboard',
        cardName: 'Card 1',
      });
      expect(cards.find((c) => c.boardType === 'commander')).toBeTruthy();
      expect(cards.find((c) => c.boardType === 'sideboard')).toBeTruthy();
    });

    it('should return empty array for undefined deck', () => {
      const cards = useDeckCards(undefined);
      expect(cards).toEqual([]);
    });
  });
});
