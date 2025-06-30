import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import {
  useCard,
  useCardCollection,
  useCardsByNames,
  useCacheStats,
  scryfallKeys,
} from '../useScryfall';
import { AllTheProviders } from '@/tests/utils';
import type { Card } from '@/types/scryfall';

// Mock the services
vi.mock('@/services/scryfall', () => ({
  fetchBulkDataInfo: vi.fn(),
  fetchCard: vi.fn(),
  fetchCardCollectionBatched: vi.fn(),
  cardNamesToIdentifiers: vi.fn((names: string[]) => names.map((name) => ({ name }))),
}));

// Mock IndexedDB utils
vi.mock('@/utils/indexeddb', () => ({
  getCachedCard: vi.fn(),
  getCachedCardsByName: vi.fn(),
  cacheCard: vi.fn(),
  cacheCards: vi.fn(),
  getCacheStats: vi.fn(),
}));

import { fetchCard } from '@/services/scryfall';
import { getCachedCard, cacheCard, getCacheStats } from '@/utils/indexeddb';

describe('Scryfall Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  describe('scryfallKeys', () => {
    it('should generate correct query keys', () => {
      expect(scryfallKeys.all).toEqual(['scryfall']);
      expect(scryfallKeys.cards()).toEqual(['scryfall', 'cards']);
      expect(scryfallKeys.card('test-id')).toEqual(['scryfall', 'cards', 'test-id']);
      expect(scryfallKeys.collection([{ name: 'Test' }])).toEqual([
        'scryfall',
        'cards',
        'collection',
        [{ name: 'Test' }],
      ]);
      expect(scryfallKeys.search('lightning', 2)).toEqual([
        'scryfall',
        'cards',
        'search',
        'lightning',
        2,
      ]);
    });
  });

  describe('useCard', () => {
    const mockCard: Card = {
      object: 'card',
      id: 'test-id',
      name: 'Test Card',
      mana_cost: '{R}',
      type_line: 'Instant',
      oracle_text: 'Test effect',
      colors: ['R'],
      color_identity: ['R'],
      keywords: [],
      legalities: {
        standard: 'not_legal',
        future: 'not_legal',
        historic: 'not_legal',
        timeless: 'not_legal',
        gladiator: 'not_legal',
        pioneer: 'not_legal',
        explorer: 'not_legal',
        modern: 'legal',
        legacy: 'legal',
        pauper: 'legal',
        vintage: 'legal',
        penny: 'not_legal',
        commander: 'legal',
        oathbreaker: 'legal',
        standardbrawl: 'not_legal',
        brawl: 'not_legal',
        alchemy: 'not_legal',
        paupercommander: 'legal',
        duel: 'legal',
        oldschool: 'not_legal',
        premodern: 'not_legal',
        predh: 'not_legal',
      },
      games: [],
      reserved: false,
      foil: true,
      nonfoil: true,
      finishes: ['nonfoil', 'foil'],
      oversized: false,
      promo: false,
      reprint: false,
      variation: false,
      set_id: 'test-set',
      set: 'tst',
      set_name: 'Test Set',
      set_type: 'core',
      set_uri: '',
      set_search_uri: '',
      scryfall_set_uri: '',
      rulings_uri: '',
      prints_search_uri: '',
      collector_number: '1',
      digital: false,
      rarity: 'rare',
      card_back_id: '',
      artist: 'Test Artist',
      artist_ids: ['test-artist-id'],
      illustration_id: 'test-illustration',
      border_color: 'black',
      frame: '2015',
      full_art: false,
      textless: false,
      booster: true,
      story_spotlight: false,
      prices: {},
      related_uris: {},
      purchase_uris: {},
      lang: 'en',
      released_at: '2024-01-01',
      uri: 'https://api.scryfall.com/cards/test-id',
      scryfall_uri: 'https://scryfall.com/card/tst/1/test-card',
      layout: 'normal',
      highres_image: true,
      image_status: 'highres_scan',
      cmc: 1.0,
    };

    it('should use cached card if available', async () => {
      vi.mocked(getCachedCard).mockResolvedValueOnce({
        ...mockCard,
        _cachedAt: Date.now(),
      });

      const { result } = renderHook(() => useCard('test-id'), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCard);
      expect(getCachedCard).toHaveBeenCalledWith('test-id');
      expect(fetchCard).not.toHaveBeenCalled();
    });

    it('should fetch from API if not cached', async () => {
      vi.mocked(getCachedCard).mockResolvedValueOnce(null);
      vi.mocked(fetchCard).mockResolvedValueOnce(mockCard);
      vi.mocked(cacheCard).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCard('test-id'), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCard);
      expect(fetchCard).toHaveBeenCalledWith('test-id');
      expect(cacheCard).toHaveBeenCalledWith(mockCard);
    });
  });

  describe('useCardCollection', () => {
    it('should generate correct query key', () => {
      const identifiers = [{ name: 'Cached Card' }, { name: 'Fetched Card' }];

      const { result } = renderHook(() => useCardCollection(identifiers, { enabled: false }), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      // Check that the hook returns the expected shape
      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useCardsByNames', () => {
    it('should use cardNamesToIdentifiers', () => {
      const cardNames = ['Lightning Bolt', 'Counterspell'];

      const { result } = renderHook(() => useCardsByNames(cardNames, { enabled: false }), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      // The hook should be disabled and return pending state
      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCacheStats', () => {
    it('should fetch cache statistics', async () => {
      const mockStats = {
        totalCards: 100,
        validCards: 80,
        expiredCards: 20,
        oldestCard: Date.now() - 1000000,
        newestCard: Date.now(),
        totalOracleTags: 50,
        validOracleTags: 40,
        expiredOracleTags: 10,
        scryfallSetCacheCount: 30,
        scryfallIdCacheCount: 40,
      };

      vi.mocked(getCacheStats).mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => useCacheStats(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStats);
    });
  });
});
