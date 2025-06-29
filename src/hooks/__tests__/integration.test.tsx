import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useMoxfieldDeck, useMoxfieldDeckWithCards } from '../useMoxfieldDeck';
import { AllTheProviders } from '@/tests/utils';

describe('Moxfield Integration Tests', () => {
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
  // Remove  to run integration tests
  describe('Real API calls', () => {
    it('should fetch a real Moxfield deck', async () => {
      const deckUrl = 'https://moxfield.com/decks/lkwkRXXSmkSd1W7VkOIjwQ';
      console.log(`📦 Testing deck URL: ${deckUrl}`);
      
      const { result } = renderHook(
        // Using a public test deck URL
        () => useMoxfieldDeck(deckUrl),
        {
          wrapper: ({ children }) => (
            <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
          ),
        }
      );

      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 10000, // 10 second timeout for real API call
      });

      // Verify we got deck data
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.name).toBeTruthy();
      expect(result.current.data?.mainboard).toBeDefined();
      
      // Log deck info
      console.log(`✅ Successfully fetched deck: "${result.current.data?.name}"`);
      console.log(`   Format: ${result.current.data?.format}`);
      console.log(`   Created by: ${result.current.data?.createdByUser.userName}`);
      console.log(`   Cards in mainboard: ${Object.keys(result.current.data?.mainboard || {}).length}`);
    });

    it('should fetch deck and extract cards', async () => {
      const deckId = 'lkwkRXXSmkSd1W7VkOIjwQ';
      console.log(`🎴 Testing card extraction for deck ID: ${deckId}`);
      
      const { result } = renderHook(
        () => useMoxfieldDeckWithCards(deckId),
        {
          wrapper: ({ children }) => (
            <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
          ),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 10000,
      });

      // Verify we got cards
      expect(result.current.cards.length).toBeGreaterThan(0);
      expect(result.current.totalCards).toBeGreaterThan(0);
      
      // Check card structure
      const firstCard = result.current.cards[0];
      expect(firstCard).toHaveProperty('card');
      expect(firstCard).toHaveProperty('boardType');
      expect(firstCard).toHaveProperty('cardName');
      
      // Log card details
      console.log(`✅ Successfully extracted ${result.current.cards.length} unique cards`);
      console.log(`   Total card count (including quantities): ${result.current.totalCards}`);
      
      // Sample some random cards
      const randomCards = result.current.cards
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      console.log(`   Sample cards:`);
      randomCards.forEach(({ cardName, card, boardType }) => {
        console.log(`     - ${cardName} (x${card.quantity}) in ${boardType}`);
      });
      
      // Show board distribution
      const boardTypes = result.current.cards.reduce((acc, { boardType }) => {
        acc[boardType] = (acc[boardType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`   Board distribution:`);
      Object.entries(boardTypes).forEach(([board, count]) => {
        console.log(`     - ${board}: ${count} unique cards`);
      });
    });

    it('should handle non-existent deck gracefully', async () => {
      const fakeDeckId = 'this-deck-definitely-does-not-exist-12345';
      console.log(`❌ Testing error handling with fake deck ID: ${fakeDeckId}`);
      
      const { result } = renderHook(
        () => useMoxfieldDeck(fakeDeckId),
        {
          wrapper: ({ children }) => (
            <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
          ),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true), {
        timeout: 10000,
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain('Failed to fetch deck');
      
      console.log(`✅ Error handled correctly:`);
      console.log(`   Error message: ${result.current.error?.message}`);
      if (result.current.error && 'statusCode' in result.current.error) {
        console.log(`   Status code: ${(result.current.error as any).statusCode}`);
      }
    });
  });
});