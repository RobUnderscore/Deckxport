import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import {
  useCard,
  useCardsByNames,
  useCardSearch,
  useBulkDataInfo,
  usePrefetchDeckCards,
} from '../useScryfall';
import { AllTheProviders } from '@/tests/utils';

describe('Scryfall Integration Tests', () => {
  let queryClient: QueryClient;

  beforeAll(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          retryDelay: 100,
        },
      },
    });
  });

  afterAll(() => {
    queryClient.clear();
  });

  beforeEach(({ task }) => {
    console.log(`\n🧪 Running: ${task.name}`);
  });

  // Skip these tests by default as they make real API calls
  // Remove .skip to run integration tests
  describe('Real Scryfall API calls', () => {
    it('should fetch a single card by ID', async () => {
      // First, search for Lightning Bolt to get a valid ID
      const searchResponse = await fetch(
        'https://api.scryfall.com/cards/search?q=name%3A%22Lightning+Bolt%22'
      );
      const searchData = await searchResponse.json();
      const cardId = searchData.data[0].id;
      console.log(`🎴 Testing single card fetch: ${cardId}`);

      const { result } = renderHook(() => useCard(cardId), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 10000,
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.name).toContain('Lightning Bolt');
      expect(result.current.data?.type_line).toContain('Instant');

      console.log(`✅ Successfully fetched card: "${result.current.data?.name}"`);
      console.log(`   Set: ${result.current.data?.set_name} (${result.current.data?.set})`);
      console.log(`   Type: ${result.current.data?.type_line}`);
      console.log(`   Oracle text: ${result.current.data?.oracle_text}`);
    }, 15000);

    it('should fetch multiple cards by names', async () => {
      const cardNames = ['Lightning Bolt', 'Counterspell', 'Dark Ritual'];
      console.log(`🎴 Testing collection fetch for: ${cardNames.join(', ')}`);

      const { result } = renderHook(() => useCardsByNames(cardNames), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 10000,
      });

      expect(result.current.data?.data).toBeDefined();
      expect(result.current.data?.data.length).toBe(3);
      expect(result.current.data?.not_found).toHaveLength(0);

      console.log(`✅ Successfully fetched ${result.current.data?.data.length} cards`);
      result.current.data?.data.forEach((card) => {
        console.log(`   - ${card.name} (${card.mana_cost}) - ${card.type_line}`);
      }, 15000);
    }, 15000);

    it('should search for cards', async () => {
      const searchQuery = 'lightning t:instant cmc:1';
      console.log(`🔍 Testing card search: "${searchQuery}"`);

      const { result } = renderHook(() => useCardSearch(searchQuery), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 10000,
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.length).toBeGreaterThan(0);

      console.log(`✅ Found ${result.current.data?.length} cards matching search`);
      const sampleCards = result.current.data?.slice(0, 5);
      sampleCards?.forEach((card) => {
        console.log(`   - ${card.name} from ${card.set_name}`);
      }, 15000);
    }, 15000);

    it('should fetch bulk data info', async () => {
      console.log('📦 Testing bulk data info fetch');

      const { result } = renderHook(() => useBulkDataInfo(), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 10000,
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.length).toBeGreaterThan(0);

      console.log(`✅ Found ${result.current.data?.length} bulk data types available:`);
      result.current.data?.forEach((bulk) => {
        const sizeMB = bulk.size ? (bulk.size / 1024 / 1024).toFixed(2) : 'N/A';
        console.log(`   - ${bulk.type}: ${sizeMB} MB (updated ${bulk.updated_at})`);
      });
    }, 15000);

    it('should handle cards with special characters', async () => {
      const specialCards = ['Æther Vial', 'Golgari Grave-Troll', 'Jötun Grunt'];
      console.log(`🎴 Testing special character cards: ${specialCards.join(', ')}`);

      const { result } = renderHook(() => useCardsByNames(specialCards), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 10000,
      });

      expect(result.current.data?.data).toBeDefined();
      expect(result.current.data?.data.length).toBeGreaterThanOrEqual(2); // At least 2 should be found

      console.log(`✅ Successfully fetched ${result.current.data?.data.length} cards`);
      if (result.current.data?.not_found.length) {
        console.log(
          `   ⚠️  Not found: ${result.current.data.not_found.map((id) => JSON.stringify(id)).join(', ')}`
        );
      }
    }, 15000);

    it('should prefetch cards for a deck', async () => {
      const deckCards = [
        'Lightning Bolt',
        'Brainstorm',
        'Path to Exile',
        'Birds of Paradise',
        'Thoughtseize',
      ];
      console.log(`🎯 Testing deck prefetch for ${deckCards.length} cards`);

      const { result } = renderHook(() => usePrefetchDeckCards(deckCards), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      // Trigger the mutation
      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 15000,
      });

      expect(result.current.data).toBeDefined();
      console.log(`✅ Prefetch complete:`);
      console.log(`   - Cached: ${result.current.data?.cached} cards`);
      console.log(`   - Fetched: ${result.current.data?.fetched} cards`);
      if (result.current.data?.notFound?.length) {
        console.log(`   - Not found: ${result.current.data.notFound.length} cards`);
      }
    }, 15000);

    it('should handle rate limiting gracefully', async () => {
      console.log('⏱️  Testing rate limiting with multiple requests');

      // First get some valid card IDs
      const searchResponse = await fetch('https://api.scryfall.com/cards/search?q=t%3Ainstant');
      const searchData = await searchResponse.json();
      const cardId1 = searchData.data[0].id;
      const cardId2 = searchData.data[1].id;

      const startTime = Date.now();

      // Make multiple requests in parallel
      const { result: result1 } = renderHook(() => useCard(cardId1), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      const { result: result2 } = renderHook(() => useCard(cardId2), {
        wrapper: ({ children }) => (
          <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
        ),
      });

      await waitFor(
        () => expect(result1.current.isSuccess && result2.current.isSuccess).toBe(true),
        { timeout: 15000 }
      );

      const elapsedTime = Date.now() - startTime;

      console.log(`✅ Both requests completed in ${elapsedTime}ms`);
      console.log(`   - Card 1: ${result1.current.data?.name}`);
      console.log(`   - Card 2: ${result2.current.data?.name}`);

      // Should have taken at least 100ms due to rate limiting
      expect(elapsedTime).toBeGreaterThanOrEqual(100);
    }, 20000);
  });
});
