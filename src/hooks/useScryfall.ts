import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { Card, BulkData, CollectionResponse } from '@/types/scryfall';
import type { CardIdentifier } from '@/services/scryfall';
import {
  fetchBulkDataInfo,
  fetchBulkDataFile,
  fetchCardCollectionBatched,
  cardNamesToIdentifiers,
  searchCards,
  fetchCard,
} from '@/services/scryfall';
import {
  cacheCard,
  cacheCards,
  getCachedCard,
  getCachedCardsByName,
  clearExpiredCache,
  getCacheStats,
  saveBulkMetadata,
  getBulkMetadata,
} from '@/utils/indexeddb';

// Query key factory
export const scryfallKeys = {
  all: ['scryfall'] as const,
  cards: () => [...scryfallKeys.all, 'cards'] as const,
  card: (id: string) => [...scryfallKeys.cards(), id] as const,
  collection: (identifiers: CardIdentifier[]) =>
    [...scryfallKeys.cards(), 'collection', identifiers] as const,
  bulkData: () => [...scryfallKeys.all, 'bulk-data'] as const,
  bulkDataFile: (type: string) => [...scryfallKeys.bulkData(), type] as const,
  search: (query: string, page?: number) =>
    [...scryfallKeys.cards(), 'search', query, page ?? 1] as const,
  cacheStats: () => [...scryfallKeys.all, 'cache-stats'] as const,
};

// Options type for queries
type QueryOptions<T = unknown> = Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>;

// Hook to fetch bulk data info
export function useBulkDataInfo(options?: QueryOptions<BulkData[]>) {
  return useQuery({
    queryKey: scryfallKeys.bulkData(),
    queryFn: fetchBulkDataInfo,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    ...options,
  });
}

// Hook to fetch and cache bulk data file
export function useBulkDataFile(
  type: 'default_cards' | 'oracle_cards' | 'unique_artwork' | 'all_cards',
  options?: QueryOptions<Card[]>
) {
  return useQuery({
    queryKey: scryfallKeys.bulkDataFile(type),
    queryFn: async () => {
      // Check if we have recent bulk data metadata
      const metadata = await getBulkMetadata(type);
      if (metadata && Date.now() - metadata.downloadedAt < 24 * 60 * 60 * 1000) {
        // Bulk data is less than 24 hours old, skip download
        return [];
      }

      // Get bulk data info
      const bulkDataInfo = await fetchBulkDataInfo();
      const bulkData = bulkDataInfo.find((bd) => bd.type === type);

      if (!bulkData) {
        throw new Error(`Bulk data type ${type} not found`);
      }

      // Download the bulk data
      const cards = await fetchBulkDataFile(bulkData.download_uri);

      // Cache all cards in IndexedDB
      await cacheCards(cards);

      // Save metadata
      await saveBulkMetadata({
        type,
        downloadedAt: Date.now(),
        size: bulkData.size,
        updateUri: bulkData.download_uri,
      });

      return cards;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    ...options,
  });
}

// Hook to fetch a single card with caching
export function useCard(cardId: string | undefined, options?: QueryOptions<Card>) {
  return useQuery({
    queryKey: scryfallKeys.card(cardId!),
    queryFn: async () => {
      // Check IndexedDB cache first
      const cached = await getCachedCard(cardId!);
      if (cached) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _cachedAt, ...card } = cached;
        return card as Card;
      }

      // Fetch from API
      const card = await fetchCard(cardId!);

      // Cache the result
      await cacheCard(card);

      return card;
    },
    enabled: !!cardId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    ...options,
  });
}

// Hook to fetch multiple cards with caching
export function useCardCollection(
  identifiers: CardIdentifier[],
  options?: QueryOptions<CollectionResponse> & { includeImages?: boolean }
) {
  return useQuery({
    queryKey: scryfallKeys.collection(identifiers),
    queryFn: async () => {
      // Try to get cards from cache first
      const cachedCards: Card[] = [];
      const uncachedIdentifiers: CardIdentifier[] = [];

      // Check cache for each identifier
      for (const identifier of identifiers) {
        let cached: Card | null = null;

        if ('id' in identifier) {
          const cachedCard = await getCachedCard(identifier.id);
          if (cachedCard) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _cachedAt, ...card } = cachedCard;
            cached = card as Card;
          }
        } else if ('name' in identifier && !('set' in identifier)) {
          const cachedByName = await getCachedCardsByName([identifier.name]);
          const cachedCard = cachedByName.get(identifier.name);
          if (cachedCard) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _cachedAt, ...card } = cachedCard;
            cached = card as Card;
          }
        }

        if (cached) {
          cachedCards.push(cached);
        } else {
          uncachedIdentifiers.push(identifier);
        }
      }

      // If all cards are cached, return them
      if (uncachedIdentifiers.length === 0) {
        return {
          object: 'list',
          data: cachedCards,
          not_found: [],
          has_more: false,
          next_page: undefined,
          total_cards: cachedCards.length,
        } as CollectionResponse;
      }

      // Fetch uncached cards
      const response = await fetchCardCollectionBatched(uncachedIdentifiers);

      // Cache the fetched cards
      if (response.data.length > 0) {
        await cacheCards(response.data);
      }

      // Merge cached and fetched cards
      return {
        ...response,
        data: [...cachedCards, ...response.data],
        total_cards: cachedCards.length + response.data.length,
      };
    },
    enabled: identifiers.length > 0,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    ...options,
  });
}

// Hook to fetch cards by names
export function useCardsByNames(cardNames: string[], options?: QueryOptions<CollectionResponse>) {
  const identifiers = cardNamesToIdentifiers(cardNames);
  return useCardCollection(identifiers, options);
}

// Hook to search cards
export function useCardSearch(query: string, page = 1, options?: QueryOptions<Card[]>) {
  return useQuery({
    queryKey: scryfallKeys.search(query, page),
    queryFn: async () => {
      const result = await searchCards(query, page);

      // Cache the results
      if (result.data.length > 0) {
        await cacheCards(result.data);
      }

      return result.data;
    },
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook to get cache statistics
export function useCacheStats(options?: QueryOptions<ReturnType<typeof getCacheStats>>) {
  return useQuery({
    queryKey: scryfallKeys.cacheStats(),
    queryFn: getCacheStats,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

// Mutation to clear expired cache
export function useClearExpiredCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearExpiredCache,
    onSuccess: (deletedCount) => {
      // Invalidate cache stats
      queryClient.invalidateQueries({ queryKey: scryfallKeys.cacheStats() });
      return deletedCount;
    },
  });
}

// Hook to prefetch cards for a deck
export function usePrefetchDeckCards(cardNames: string[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Check what's already cached
      const cachedByName = await getCachedCardsByName(cardNames);
      const uncachedNames = cardNames.filter((name) => !cachedByName.has(name));

      if (uncachedNames.length === 0) {
        return { cached: cardNames.length, fetched: 0 };
      }

      // Fetch uncached cards
      const uncachedIdentifiers = cardNamesToIdentifiers(uncachedNames);
      const response = await fetchCardCollectionBatched(uncachedIdentifiers);

      // Cache the results
      if (response.data.length > 0) {
        await cacheCards(response.data);

        // Also populate the query cache
        response.data.forEach((card) => {
          queryClient.setQueryData(scryfallKeys.card(card.id), card);
        });
      }

      return {
        cached: cardNames.length - uncachedNames.length,
        fetched: response.data.length,
        notFound: response.not_found,
      };
    },
  });
}

// Helper hook to get card images
export function useCardImages() {
  return {
    getImageUrl: (card: Card, face = 0, size: 'small' | 'normal' | 'large' | 'png' = 'normal') => {
      if (!card) return null;

      // Handle double-faced cards
      if (card.card_faces && card.card_faces[face]?.image_uris) {
        return card.card_faces[face].image_uris[size] || null;
      }

      // Single-faced cards
      if (card.image_uris) {
        return card.image_uris[size] || null;
      }

      return null;
    },
    getAllImages: (card: Card, size: 'small' | 'normal' | 'large' | 'png' = 'normal') => {
      if (!card) return [];

      const images: string[] = [];

      // Double-faced cards
      if (card.card_faces) {
        card.card_faces.forEach((face) => {
          if (face.image_uris?.[size]) {
            images.push(face.image_uris[size]);
          }
        });
      } else if (card.image_uris?.[size]) {
        // Single-faced cards
        images.push(card.image_uris[size]);
      }

      return images;
    },
    preloadImages: (cards: Card[], size: 'small' | 'normal' | 'large' | 'png' = 'small') => {
      const getAllImages = (card: Card, imageSize: 'small' | 'normal' | 'large' | 'png') => {
        if (!card) return [];

        const images: string[] = [];

        // Double-faced cards
        if (card.card_faces) {
          card.card_faces.forEach((face) => {
            if (face.image_uris?.[imageSize]) {
              images.push(face.image_uris[imageSize]);
            }
          });
        } else if (card.image_uris?.[imageSize]) {
          // Single-faced cards
          images.push(card.image_uris[imageSize]);
        }

        return images;
      };

      cards.forEach((card) => {
        const images = getAllImages(card, size);
        images.forEach((url) => {
          const img = new Image();
          img.src = url;
        });
      });
    },
  };
}
