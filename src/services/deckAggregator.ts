// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { MoxfieldCard, MoxfieldDeck } from '@/types/moxfield';
import type { Card as ScryfallCard } from '@/types/scryfall';
import type { CardAggregate, DeckImportProgress, DeckImportResult } from '@/types/cardAggregate';
import { fetchMoxfieldDeck } from './moxfield';
import { fetchCardCollectionBatched, cardNamesToIdentifiers } from './scryfall';
import { fetchOracleTagsForCardsWithTagger } from './oracleTags';
import { cacheCardByScryfallId, getCachedCardsByNameForScryfall, cacheCardByName } from '@/utils/indexeddb';

// Note: Rate limiting is now handled by the backend R2 cache proxy

/**
 * Convert Moxfield card to initial aggregate
 */
function createInitialAggregate(
  moxfieldCard: MoxfieldCard,
  board: CardAggregate['board']
): CardAggregate {
  const cardData = moxfieldCard.card;
  
  // Debug logging to understand the structure
  if (cardData?.name === 'Lightning Bolt' || cardData?.name === 'Sol Ring') {
    console.log(`🔍 Moxfield data for ${cardData.name}:`, {
      card_id: cardData?.id,
      set: moxfieldCard.set || cardData?.set,
      cn: moxfieldCard.cn || cardData?.cn,
      scryfall_uri: cardData?.scryfall_uri,
      full_card: cardData
    });
  }
  
  // Check all possible locations for set/collector info
  const set = moxfieldCard.set || cardData?.set || '';
  const collectorNumber = moxfieldCard.cn || moxfieldCard.collectorNumber || cardData?.cn || cardData?.collectorNumber || '';
  
  // Check if the ID looks like a Scryfall ID (UUID format)
  const isValidScryfallId = (id: string | undefined): boolean => {
    if (!id) return false;
    // UUID regex pattern
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };
  
  return {
    // Identity
    id: cardData?.id || `${board}-${cardData?.name || 'unknown'}-${Date.now()}`,
    name: cardData?.name || 'Unknown Card',
    
    // Source references
    moxfieldId: cardData?.id || `moxfield-${Date.now()}`,
    scryfallId: isValidScryfallId(cardData?.id) ? cardData?.id : undefined, // Only set if it's a valid UUID
    oracleId: undefined, // Will be populated from Scryfall
    
    // Set information (use values we already extracted)
    set,
    setName: moxfieldCard.setName || cardData?.setName || '',
    collectorNumber,
    
    // Deck information
    quantity: moxfieldCard.quantity,
    board,
    
    // Moxfield-specific
    isFoil: moxfieldCard.isFoil || moxfieldCard.finish === 'foil',
    isAlter: moxfieldCard.isAlter,
    condition: moxfieldCard.condition,
    language: moxfieldCard.language,
    
    // Basic card details (may be incomplete)
    manaCost: cardData?.mana_cost,
    cmc: cardData?.cmc || 0,
    typeLine: cardData?.type_line || '',
    oracleText: cardData?.oracle_text,
    power: cardData?.power,
    toughness: cardData?.toughness,
    loyalty: cardData?.loyalty,
    colors: [], // Will be populated from Scryfall
    colorIdentity: cardData?.color_identity || [],
    
    // Visual data
    imageUris: cardData ? {
      small: undefined, // Will be populated from Scryfall
      normal: cardData.image_normal,
      large: cardData.image_large,
    } : undefined,
    
    // Market data
    prices: cardData?.prices ? {
      usd: cardData.prices.usd?.toString(),
      usd_foil: cardData.prices.usd_foil?.toString(),
      eur: cardData.prices.eur?.toString(),
    } : undefined,
    
    // Game data
    legalities: undefined, // Will be populated from Scryfall
    rarity: (cardData?.rarity as CardAggregate['rarity']) || 'common',
    
    // Metadata
    artist: undefined, // Will be populated from Scryfall
    flavorText: undefined, // Will be populated from Scryfall
    releasedAt: undefined, // Will be populated from Scryfall
    
    // Oracle tags (empty initially)
    oracleTags: [],
    taggerFetched: false,
    
    // Raw data
    _moxfieldData: moxfieldCard,
  };
}

/**
 * Enrich aggregates with Scryfall data
 */
function enrichWithScryfallData(
  aggregate: CardAggregate,
  scryfallCard: ScryfallCard
): CardAggregate {
  return {
    ...aggregate,
    
    // Update identifiers
    scryfallId: scryfallCard.id,
    oracleId: scryfallCard.oracle_id,
    
    // IMPORTANT: Update set information for Tagger
    set: scryfallCard.set,
    setName: scryfallCard.set_name,
    collectorNumber: scryfallCard.collector_number,
    
    // Update card details
    manaCost: scryfallCard.mana_cost,
    cmc: scryfallCard.cmc,
    typeLine: scryfallCard.type_line,
    oracleText: scryfallCard.oracle_text,
    power: scryfallCard.power,
    toughness: scryfallCard.toughness,
    loyalty: scryfallCard.loyalty,
    colors: scryfallCard.colors || [],
    colorIdentity: scryfallCard.color_identity || [],
    
    // Update visual data
    imageUris: scryfallCard.image_uris || aggregate.imageUris,
    
    // Update market data
    prices: scryfallCard.prices ? {
      usd: scryfallCard.prices.usd || undefined,
      usd_foil: scryfallCard.prices.usd_foil || undefined,
      eur: scryfallCard.prices.eur || undefined,
      eur_foil: scryfallCard.prices.eur_foil || undefined,
    } : aggregate.prices,
    
    // Update game data
    legalities: (scryfallCard.legalities as unknown as Record<string, string>) || aggregate.legalities,
    rarity: scryfallCard.rarity as CardAggregate['rarity'],
    
    // Update metadata
    artist: scryfallCard.artist,
    flavorText: scryfallCard.flavor_text,
    releasedAt: scryfallCard.released_at,
    
    // Store raw data
    _scryfallData: scryfallCard,
  };
}

/**
 * Main deck aggregation function
 */
export async function aggregateDeckData(
  deckId: string,
  onProgress?: (progress: DeckImportProgress) => void
): Promise<DeckImportResult> {
  const errors: DeckImportProgress['errors'] = [];
  let progress: DeckImportProgress = {
    stage: 'moxfield',
    cardsProcessed: 0,
    totalCards: 0,
    errors: [],
  };

  const updateProgress = (updates: Partial<DeckImportProgress>) => {
    progress = { ...progress, ...updates };
    onProgress?.(progress);
  };

  try {
    // === Stage 1: Fetch Moxfield deck ===
    updateProgress({ stage: 'moxfield' });
    const moxfieldDeck = await fetchMoxfieldDeck(deckId);
    
    // === Stage 1.5: Process deck structure ===
    updateProgress({ stage: 'moxfield-processing' });
    // Small delay to show the stage transition
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Extract all cards into aggregates
    const aggregates: CardAggregate[] = [];
    
    // Process each board
    type BoardKey = 'mainboard' | 'sideboard' | 'commanders' | 'companion';
    const boardMappings: Array<[BoardKey, CardAggregate['board']]> = [
      ['mainboard', 'mainboard'],
      ['sideboard', 'sideboard'],
      ['commanders', 'commander'],
      ['companion', 'companion'],
    ];
    
    for (const [boardKey, boardType] of boardMappings) {
      if (!moxfieldDeck.boards) continue;
      
      const board = moxfieldDeck.boards[boardKey];
      if (board && 'cards' in board && board.cards) {
        for (const card of Object.values(board.cards)) {
          aggregates.push(createInitialAggregate(card as MoxfieldCard, boardType));
        }
      }
    }
    
    updateProgress({ 
      totalCards: aggregates.length,
      cardsProcessed: 0 
    });
    
    // === Stage 2: Batch fetch Scryfall data ===
    updateProgress({ stage: 'scryfall-batch' });
    // Small delay to show the stage transition
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // First, check cache by card names since Moxfield doesn't provide Scryfall IDs
    const uniqueCardNames = Array.from(new Set(aggregates.map(a => a.name)));
    console.log(`🔍 Checking cache for ${uniqueCardNames.length} unique card names`);
    
    const cachedCardsByName = await getCachedCardsByNameForScryfall(uniqueCardNames);
    
    // Build a map of all cards we have (cached + need to fetch)
    const scryfallMap = new Map<string, ScryfallCard>();
    const cardsToFetch: CardAggregate[] = [];
    
    // Check which cards we have in cache
    aggregates.forEach(aggregate => {
      const cached = cachedCardsByName.get(aggregate.name);
      if (cached) {
        console.log(`✅ Cache hit for ${aggregate.name}`);
        scryfallMap.set(aggregate.name, cached);
      } else {
        console.log(`❌ Cache miss for ${aggregate.name}`);
        cardsToFetch.push(aggregate);
      }
    });
    
    console.log(`📦 Using ${scryfallMap.size} cached cards, fetching ${cardsToFetch.length} from API`);
    
    // Fetch uncached cards if needed
    if (cardsToFetch.length > 0) {
      // Get unique card names for fetching
      const uniqueNamesToFetch = Array.from(new Set(cardsToFetch.map(a => a.name)));
      const identifiers = cardNamesToIdentifiers(uniqueNamesToFetch);
      
      try {
        const scryfallResponse = await fetchCardCollectionBatched(identifiers);
        
        // Add fetched cards to map and cache them
        for (const card of scryfallResponse.data) {
          scryfallMap.set(card.name, card);
          
          // Cache by both Scryfall ID and name for future lookups
          await cacheCardByScryfallId(card);
          await cacheCardByName(card);
        }
      } catch (error) {
        errors.push({
          cardName: 'Batch request',
          stage: 'scryfall',
          error: error instanceof Error ? error.message : 'Failed to fetch Scryfall data',
        });
      }
    }
    
    // === Stage 3: Enrich individual cards with Scryfall data ===
    updateProgress({ stage: 'scryfall' });
    // Small delay to show the stage transition
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Enrich aggregates with Scryfall data
    for (let i = 0; i < aggregates.length; i++) {
      const scryfallCard = scryfallMap.get(aggregates[i].name);
      if (scryfallCard) {
        aggregates[i] = enrichWithScryfallData(aggregates[i], scryfallCard);
      } else {
        errors.push({
          cardName: aggregates[i].name,
          stage: 'scryfall',
          error: 'Card not found on Scryfall',
        });
      }
      
      updateProgress({ 
        cardsProcessed: i + 1,
        currentCard: aggregates[i].name 
      });
    }
    
    // === Stage 4: Fetch Tagger tags (with caching) ===
    updateProgress({ 
      stage: 'tagger',
      cardsProcessed: 0 
    });
    
    // Filter cards that have set and collector number
    const cardsForTagger = aggregates.filter(a => a.set && a.collectorNumber);
    const cardsWithoutSetInfoForTagger = aggregates.filter(a => !a.set || !a.collectorNumber);
    
    // Mark cards without set info as errors
    cardsWithoutSetInfoForTagger.forEach(aggregate => {
      aggregate.taggerFetched = true;
      aggregate.taggerError = 'Missing set or collector number';
      errors.push({
        cardName: aggregate.name,
        stage: 'tagger',
        error: 'Missing set or collector number',
      });
    });
    
    if (cardsForTagger.length > 0) {
      try {
        // Fetch oracle tags in batch with caching
        const result = await fetchOracleTagsForCardsWithTagger(
          cardsForTagger.map(a => a._scryfallData!).filter(Boolean),
          (current, total) => {
            updateProgress({ 
              cardsProcessed: current,
              currentCard: cardsForTagger[Math.min(current - 1, cardsForTagger.length - 1)]?.name
            });
          },
          true // useCache
        );
        
        // Apply the results to aggregates
        cardsForTagger.forEach(aggregate => {
          const tags = result.tags.get(aggregate.name);
          if (tags) {
            aggregate.oracleTags = tags;
            aggregate.taggerFetched = true;
          } else {
            aggregate.taggerFetched = true;
            aggregate.taggerError = 'Not found in Tagger database';
          }
        });
        
        // Add any errors from the batch operation
        if (result.hasErrors) {
          result.errors.forEach(error => {
            errors.push({
              cardName: 'Batch oracle tags',
              stage: 'tagger',
              error,
            });
          });
        }
      } catch (error) {
        // If batch fails, mark all as errored
        cardsForTagger.forEach(aggregate => {
          aggregate.taggerFetched = true;
          aggregate.taggerError = error instanceof Error ? error.message : 'Failed to fetch tags';
        });
        errors.push({
          cardName: 'Batch oracle tags',
          stage: 'tagger',
          error: error instanceof Error ? error.message : 'Failed to fetch oracle tags',
        });
      }
    }
    
    updateProgress({ cardsProcessed: aggregates.length });
    
    // === Complete ===
    updateProgress({ 
      stage: 'complete',
      errors 
    });
    
    return {
      cards: aggregates,
      deckName: moxfieldDeck.name,
      deckAuthor: moxfieldDeck.createdByUser?.userName || 'Unknown',
      format: moxfieldDeck.format,
      errors,
    };
    
  } catch (error) {
    updateProgress({ 
      stage: 'error',
      errors: [...errors, {
        cardName: 'Deck import',
        stage: 'initial',
        error: error instanceof Error ? error.message : 'Failed to import deck',
      }]
    });
    
    throw error;
  }
}