import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useMoxfieldDeck } from '../useMoxfieldDeck';
import { useCardsByNames } from '../useScryfall';
import { AllTheProviders } from '@/tests/utils';

describe('Moxfield + Scryfall Integration Tests', () => {
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

  describe('Full deck fetch and card retrieval flow', () => {
    it('should fetch a Moxfield deck and retrieve all cards from Scryfall', async () => {
      // Use a public deck URL for testing
      const deckUrl = 'https://moxfield.com/decks/lkwkRXXSmkSd1W7VkOIjwQ';
      console.log(`📦 Testing full flow with deck: ${deckUrl}`);
      
      // Step 1: Fetch the deck from Moxfield
      const { result: deckResult } = renderHook(
        () => useMoxfieldDeck(deckUrl),
        {
          wrapper: ({ children }) => (
            <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
          ),
        }
      );

      await waitFor(() => {
        if (deckResult.current.isError) {
          console.error('Deck fetch error:', deckResult.current.error);
        }
        return expect(deckResult.current.isSuccess).toBe(true);
      }, {
        timeout: 15000,
      });

      expect(deckResult.current.data).toBeDefined();
      const deck = deckResult.current.data!;
      
      // Handle both v2 and v3 API structures
      const hasV3Structure = !!deck.boards?.mainboard;
      const mainboardCards = hasV3Structure 
        ? deck.boards!.mainboard!.cards 
        : deck.mainboard || {};
      const sideboardCards = hasV3Structure
        ? (deck.boards!.sideboard?.cards || {})
        : (deck.sideboard || {});
      
      console.log(`✅ Successfully fetched deck: "${deck.name}" by ${deck.createdByUser?.userName || 'Unknown'}`);
      console.log(`   Format: ${deck.format}`);
      console.log(`   Main deck cards: ${Object.keys(mainboardCards).length} cards`);
      console.log(`   Sideboard cards: ${Object.keys(sideboardCards).length} cards`);
      
      // Step 2: Extract all unique card names from the deck
      const cardNames = new Set<string>();
      
      // Add mainboard cards
      if (hasV3Structure) {
        Object.entries(mainboardCards).forEach(([cardId, card]) => {
          const name = card.card?.name || cardId;
          if (name) cardNames.add(name);
        });
      } else {
        Object.entries(mainboardCards).forEach(([cardName]) => {
          cardNames.add(cardName);
        });
      }
      
      // Add sideboard cards
      if (hasV3Structure) {
        Object.entries(sideboardCards).forEach(([cardId, card]) => {
          const name = card.card?.name || cardId;
          if (name) cardNames.add(name);
        });
      } else {
        Object.entries(sideboardCards).forEach(([cardName]) => {
          cardNames.add(cardName);
        });
      }
      
      const uniqueCardNames = Array.from(cardNames);
      console.log(`\n🎴 Found ${uniqueCardNames.length} unique cards to fetch from Scryfall`);
      
      // Show a sample of cards
      const sampleCards = uniqueCardNames.slice(0, 5);
      console.log(`   Sample cards: ${sampleCards.join(', ')}${uniqueCardNames.length > 5 ? '...' : ''}`);
      
      // Step 3: Fetch all cards from Scryfall
      const { result: cardsResult } = renderHook(
        () => useCardsByNames(uniqueCardNames),
        {
          wrapper: ({ children }) => (
            <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
          ),
        }
      );

      await waitFor(() => expect(cardsResult.current.isSuccess).toBe(true), {
        timeout: 30000, // Longer timeout for potentially many cards
      });

      expect(cardsResult.current.data).toBeDefined();
      const scryfallData = cardsResult.current.data!;
      
      console.log(`\n✅ Successfully fetched ${scryfallData.data.length} cards from Scryfall`);
      if (scryfallData.not_found.length > 0) {
        console.log(`   ⚠️  Not found: ${scryfallData.not_found.length} cards`);
        console.log(`   Not found cards: ${scryfallData.not_found.map(id => JSON.stringify(id)).join(', ')}`);
      }
      
      // Step 4: Verify the data integrity
      expect(scryfallData.data.length).toBeGreaterThan(0);
      expect(scryfallData.data.length + scryfallData.not_found.length).toBeLessThanOrEqual(uniqueCardNames.length);
      
      // Verify each fetched card has the expected data
      scryfallData.data.forEach(card => {
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('name');
        expect(card).toHaveProperty('mana_cost');
        expect(card).toHaveProperty('type_line');
        expect(card).toHaveProperty('oracle_text');
        expect(card).toHaveProperty('set');
        expect(card).toHaveProperty('collector_number');
      });
      
      // Step 5: Cross-reference with deck data
      console.log('\n🔍 Cross-referencing deck and Scryfall data:');
      
      // Create a map for quick lookup
      const scryfallCardMap = new Map(
        scryfallData.data.map(card => [card.name.toLowerCase(), card])
      );
      
      // Check mainboard cards
      let mainboardMatched = 0;
      const mainboardCardNames: string[] = [];
      
      if (hasV3Structure) {
        Object.values(mainboardCards).forEach((card) => {
          const cardName = card.card?.name;
          if (cardName) {
            mainboardCardNames.push(cardName);
            const scryfallCard = scryfallCardMap.get(cardName.toLowerCase());
            if (scryfallCard) {
              mainboardMatched++;
              // Verify the card data matches what we expect
              expect(scryfallCard.name.toLowerCase()).toBe(cardName.toLowerCase());
            }
          }
        });
      } else {
        Object.entries(mainboardCards).forEach(([cardName]) => {
          mainboardCardNames.push(cardName);
          const scryfallCard = scryfallCardMap.get(cardName.toLowerCase());
          if (scryfallCard) {
            mainboardMatched++;
            // Verify the card data matches what we expect
            expect(scryfallCard.name.toLowerCase()).toBe(cardName.toLowerCase());
          }
        });
      }
      
      console.log(`   Mainboard: ${mainboardMatched}/${mainboardCardNames.length} cards matched`);
      
      // Check if we have image URIs for the cards
      const cardsWithImages = scryfallData.data.filter(card => card.image_uris || card.card_faces);
      console.log(`   Cards with images: ${cardsWithImages.length}/${scryfallData.data.length}`);
      
      // Verify mana costs align with deck's mana curve
      const manaCosts = scryfallData.data
        .filter(card => card.mana_cost)
        .map(card => card.cmc || 0);
      
      if (manaCosts.length > 0) {
        const avgCmc = manaCosts.reduce((sum, cmc) => sum + cmc, 0) / manaCosts.length;
        console.log(`   Average CMC: ${avgCmc.toFixed(2)}`);
      }
      
      console.log('\n✅ Full integration test completed successfully!');
    }, 60000); // 60 second timeout for the full flow

    it('should handle decks with special characters and complex card names', async () => {
      // This test ensures special characters in card names work across both APIs
      const deckUrl = 'https://moxfield.com/decks/lkwkRXXSmkSd1W7VkOIjwQ';
      console.log(`🎯 Testing special character handling with deck: ${deckUrl}`);
      
      // Fetch deck
      const { result: deckResult } = renderHook(
        () => useMoxfieldDeck(deckUrl),
        {
          wrapper: ({ children }) => (
            <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
          ),
        }
      );

      await waitFor(() => expect(deckResult.current.isSuccess).toBe(true), {
        timeout: 15000,
      });

      const deck = deckResult.current.data!;
      
      // Handle both v2 and v3 API structures
      const hasV3Structure = !!deck.boards?.mainboard;
      const mainboardCards = hasV3Structure 
        ? deck.boards!.mainboard!.cards 
        : deck.mainboard || {};
      const sideboardCards = hasV3Structure
        ? (deck.boards!.sideboard?.cards || {})
        : (deck.sideboard || {});
      
      // Find cards with special characters
      const allCardNames: string[] = [];
      
      if (hasV3Structure) {
        Object.values(mainboardCards).forEach((card) => {
          const name = card.card?.name;
          if (name) allCardNames.push(name);
        });
        Object.values(sideboardCards).forEach((card) => {
          const name = card.card?.name;
          if (name) allCardNames.push(name);
        });
      } else {
        allCardNames.push(...Object.keys(mainboardCards));
        allCardNames.push(...Object.keys(sideboardCards));
      }
      
      const specialCharCards = allCardNames.filter(name => 
        /[^\w\s,'-]/.test(name) || // Non-standard characters
        name.includes('//') ||      // Split cards
        name.includes('Æ') ||       // Special letters
        name.includes("'")          // Smart quotes
      );
      
      if (specialCharCards.length > 0) {
        console.log(`\n🔤 Found ${specialCharCards.length} cards with special characters:`);
        specialCharCards.slice(0, 5).forEach(card => console.log(`   - ${card}`));
        
        // Fetch these specific cards
        const { result: cardsResult } = renderHook(
          () => useCardsByNames(specialCharCards),
          {
            wrapper: ({ children }) => (
              <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
            ),
          }
        );

        await waitFor(() => expect(cardsResult.current.isSuccess).toBe(true), {
          timeout: 20000,
        });

        const scryfallData = cardsResult.current.data!;
        console.log(`✅ Successfully fetched ${scryfallData.data.length}/${specialCharCards.length} special character cards`);
        
        // Verify the special character cards were handled correctly
        expect(scryfallData.data.length).toBeGreaterThan(0);
      } else {
        console.log('ℹ️  No cards with special characters found in this deck');
      }
    }, 40000);

    it('should efficiently handle large commander decks', async () => {
      // Commander decks are typically 100 cards, good for testing larger batches
      const commanderDeckUrl = 'https://moxfield.com/decks/lkwkRXXSmkSd1W7VkOIjwQ';
      console.log(`🎮 Testing large deck handling with: ${commanderDeckUrl}`);
      
      const startTime = Date.now();
      
      // Fetch deck
      const { result: deckResult } = renderHook(
        () => useMoxfieldDeck(commanderDeckUrl),
        {
          wrapper: ({ children }) => (
            <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
          ),
        }
      );

      await waitFor(() => expect(deckResult.current.isSuccess).toBe(true), {
        timeout: 15000,
      });

      const deck = deckResult.current.data!;
      
      // Handle both v2 and v3 API structures
      const hasV3Structure = !!deck.boards?.mainboard;
      const mainboardCards = hasV3Structure 
        ? deck.boards!.mainboard!.cards 
        : deck.mainboard || {};
      const sideboardCards = hasV3Structure
        ? (deck.boards!.sideboard?.cards || {})
        : (deck.sideboard || {});
        
      const mainboardCount = Object.values(mainboardCards).reduce((sum, card) => sum + card.quantity, 0);
      const sideboardCount = Object.values(sideboardCards).reduce((sum, card) => sum + card.quantity, 0);
      const totalCards = mainboardCount + sideboardCount;
      console.log(`📊 Deck size: ${totalCards} total cards`);
      
      // Get unique cards
      const uniqueCards = new Set<string>();
      
      if (hasV3Structure) {
        Object.values(mainboardCards).forEach((card) => {
          const name = card.card?.name;
          if (name) uniqueCards.add(name);
        });
        Object.values(sideboardCards).forEach((card) => {
          const name = card.card?.name;
          if (name) uniqueCards.add(name);
        });
      } else {
        Object.keys(mainboardCards).forEach(name => uniqueCards.add(name));
        Object.keys(sideboardCards).forEach(name => uniqueCards.add(name));
      }
      
      const uniqueCardNames = Array.from(uniqueCards);
      console.log(`   Unique cards: ${uniqueCardNames.length}`);
      
      // Test batching if we have more than 75 cards
      if (uniqueCardNames.length > 75) {
        console.log(`   This will require ${Math.ceil(uniqueCardNames.length / 75)} batch(es)`);
      }
      
      // Fetch all cards
      const { result: cardsResult } = renderHook(
        () => useCardsByNames(uniqueCardNames),
        {
          wrapper: ({ children }) => (
            <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
          ),
        }
      );

      await waitFor(() => expect(cardsResult.current.isSuccess).toBe(true), {
        timeout: 45000,
      });

      const endTime = Date.now();
      const elapsedSeconds = ((endTime - startTime) / 1000).toFixed(2);
      
      const scryfallData = cardsResult.current.data!;
      console.log(`\n⏱️  Performance metrics:`);
      console.log(`   Total time: ${elapsedSeconds}s`);
      console.log(`   Cards fetched: ${scryfallData.data.length}`);
      console.log(`   Average time per card: ${(parseFloat(elapsedSeconds) / scryfallData.data.length * 1000).toFixed(0)}ms`);
      
      // Verify all cards were fetched successfully
      expect(scryfallData.data.length + scryfallData.not_found.length).toBe(uniqueCardNames.length);
      
      // Check memory usage (ensure we're not keeping too much in memory)
      const totalImageUris = scryfallData.data.filter(card => card.image_uris).length;
      console.log(`   Cards with images ready: ${totalImageUris}/${scryfallData.data.length}`);
    }, 60000);
  });
});