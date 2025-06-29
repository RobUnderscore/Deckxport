import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchBulkDataInfo,
  fetchCardCollection,
  fetchCardCollectionBatched,
  cardNamesToIdentifiers,
  getDefaultBulkData,
  searchCards,
  fetchCard,
  ScryfallApiError,
} from '../scryfall';
import type { BulkData, Card } from '@/types/scryfall';

// Mock fetch
globalThis.fetch = vi.fn();

describe('Scryfall Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBulkDataInfo', () => {
    it('should fetch bulk data information', async () => {
      const mockBulkData: BulkData[] = [
        {
          object: 'bulk_data',
          id: 'test-id',
          type: 'default_cards',
          updated_at: '2024-01-01',
          uri: 'https://api.scryfall.com/bulk-data/test',
          name: 'Default Cards',
          description: 'Test description',
          size: 1000000,
          download_uri: 'https://example.com/bulk.json',
          content_type: 'application/json',
          content_encoding: 'gzip',
        },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBulkData }),
      } as Response);

      const result = await fetchBulkDataInfo();

      expect(result).toEqual(mockBulkData);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('bulk-data'), undefined);
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      } as Response);

      await expect(fetchBulkDataInfo()).rejects.toThrow(ScryfallApiError);
    });
  });

  describe('fetchCardCollection', () => {
    it('should fetch cards by identifiers', async () => {
      const mockResponse = {
        object: 'list',
        data: [
          { id: 'card1', name: 'Lightning Bolt' } as Card,
          { id: 'card2', name: 'Counterspell' } as Card,
        ],
        not_found: [],
        has_more: false,
        next_page: undefined,
        total_cards: 2,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const identifiers = [{ name: 'Lightning Bolt' }, { name: 'Counterspell' }];

      const result = await fetchCardCollection(identifiers);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('cards/collection'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ identifiers }),
        })
      );
    });

    it('should return empty result for empty identifiers', async () => {
      const result = await fetchCardCollection([]);

      expect(result).toEqual({
        object: 'list',
        data: [],
        not_found: [],
        has_more: false,
        next_page: undefined,
        total_cards: 0,
        warnings: [],
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error for too many identifiers', async () => {
      const identifiers = Array(76).fill({ name: 'Test' });

      await expect(fetchCardCollection(identifiers)).rejects.toThrow(
        'Collection request exceeds maximum size of 75 cards'
      );
    });
  });

  describe('fetchCardCollectionBatched', () => {
    it('should batch large requests', async () => {
      const identifiers = Array(150)
        .fill(null)
        .map((_, i) => ({ name: `Card ${i}` }));

      const mockResponse1 = {
        object: 'list',
        data: Array(75)
          .fill(null)
          .map((_, i) => ({ id: `id${i}`, name: `Card ${i}` }) as Card),
        not_found: [],
        has_more: false,
        next_page: undefined,
        total_cards: 75,
      };

      const mockResponse2 = {
        object: 'list',
        data: Array(75)
          .fill(null)
          .map((_, i) => ({ id: `id${i + 75}`, name: `Card ${i + 75}` }) as Card),
        not_found: [],
        has_more: false,
        next_page: undefined,
        total_cards: 75,
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2,
        } as Response);

      const result = await fetchCardCollectionBatched(identifiers);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(150);
      expect(result).toHaveProperty('total_cards', 150);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('cardNamesToIdentifiers', () => {
    it('should convert card names to identifiers', () => {
      const names = ['Lightning Bolt', 'Counterspell', 'Black Lotus'];
      const identifiers = cardNamesToIdentifiers(names);

      expect(identifiers).toEqual([
        { name: 'Lightning Bolt' },
        { name: 'Counterspell' },
        { name: 'Black Lotus' },
      ]);
    });
  });

  describe('getDefaultBulkData', () => {
    it('should prefer default_cards type', async () => {
      const mockBulkData: BulkData[] = [
        {
          object: 'bulk_data',
          type: 'oracle_cards',
          id: 'oracle-id',
          updated_at: '2024-01-01',
          uri: '',
          name: 'Oracle Cards',
          description: '',
          size: 0,
          download_uri: '',
          content_type: '',
          content_encoding: '',
        } as BulkData,
        {
          object: 'bulk_data',
          type: 'default_cards',
          id: 'default-id',
          updated_at: '2024-01-01',
          uri: '',
          name: 'Default Cards',
          description: '',
          size: 0,
          download_uri: '',
          content_type: '',
          content_encoding: '',
        } as BulkData,
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBulkData }),
      } as Response);

      const result = await getDefaultBulkData();

      expect(result?.type).toBe('default_cards');
    });

    it('should fallback to oracle_cards', async () => {
      const mockBulkData: BulkData[] = [
        {
          object: 'bulk_data',
          type: 'oracle_cards',
          id: 'oracle-id',
          updated_at: '2024-01-01',
          uri: '',
          name: 'Oracle Cards',
          description: '',
          size: 0,
          download_uri: '',
          content_type: '',
          content_encoding: '',
        } as BulkData,
        {
          object: 'bulk_data',
          type: 'all_cards',
          id: 'all-id',
          updated_at: '2024-01-01',
          uri: '',
          name: 'All Cards',
          description: '',
          size: 0,
          download_uri: '',
          content_type: '',
          content_encoding: '',
        } as BulkData,
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBulkData }),
      } as Response);

      const result = await getDefaultBulkData();

      expect(result?.type).toBe('oracle_cards');
    });
  });

  describe('searchCards', () => {
    it('should search cards with query', async () => {
      const mockResponse = {
        object: 'list',
        data: [{ id: 'card1', name: 'Lightning Bolt' } as Card],
        has_more: false,
        next_page: undefined,
        total_cards: 1,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await searchCards('lightning bolt', 1);

      expect(result).toHaveProperty('data');
      expect(result.data).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('cards/search'), undefined);
    });
  });

  describe('fetchCard', () => {
    it('should fetch single card by ID', async () => {
      const mockCard = {
        object: 'card' as const,
        id: 'test-id',
        name: 'Test Card',
        oracle_id: 'oracle-id',
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
          pauper: 'not_legal',
          vintage: 'legal',
          penny: 'not_legal',
          commander: 'legal',
          oathbreaker: 'legal',
          standardbrawl: 'not_legal',
          brawl: 'not_legal',
          alchemy: 'not_legal',
          paupercommander: 'not_legal',
          duel: 'legal',
          oldschool: 'not_legal',
          premodern: 'not_legal',
          predh: 'not_legal',
        },
        games: [],
        reserved: false,
        foil: true,
        nonfoil: true,
        finishes: ['foil', 'nonfoil'],
        oversized: false,
        promo: false,
        reprint: false,
        variation: false,
        set_id: 'set-id',
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
        card_back_id: 'back-id',
        artist: 'Artist',
        artist_ids: ['artist-id'],
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
        type_line: 'Instant',
        oracle_text: 'Test effect',
        mana_cost: '{R}',
      } as Card;

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCard,
      } as Response);

      const result = await fetchCard('test-id');

      expect(result).toEqual(mockCard);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('cards/test-id'), undefined);
    });
  });

  describe('Rate limiting', () => {
    it('should make requests with rate limiting', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      // Make two requests
      await fetchBulkDataInfo();
      await fetchBulkDataInfo();

      // Both requests should have been made
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
