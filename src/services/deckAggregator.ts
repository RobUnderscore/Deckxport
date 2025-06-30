// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { MoxfieldCard, MoxfieldDeck } from '@/types/moxfield';
import type { Card as ScryfallCard } from '@/types/scryfall';
import type { CardAggregate, DeckImportProgress, DeckImportResult } from '@/types/cardAggregate';
import { fetchMoxfieldDeck } from './moxfield';
import { fetchCardCollectionBatched, cardNamesToIdentifiers } from './scryfall';
import { fetchCardTags, extractOracleTags } from './scryfallTagger';

// Note: Rate limiting is now handled by the backend R2 cache proxy

/**
 * Convert Moxfield card to initial aggregate
 */
function createInitialAggregate(
  moxfieldCard: MoxfieldCard,
  board: CardAggregate['board']
): CardAggregate {
  const cardData = moxfieldCard.card;
  
  return {
    // Identity
    id: cardData?.id || `${board}-${cardData?.name || 'unknown'}-${Date.now()}`,
    name: cardData?.name || 'Unknown Card',
    
    // Source references
    moxfieldId: cardData?.id || `moxfield-${Date.now()}`,
    scryfallId: cardData?.id,
    oracleId: undefined, // Will be populated from Scryfall
    
    // Set information (may be incomplete from Moxfield)
    set: moxfieldCard.set || cardData?.set || '',
    setName: moxfieldCard.setName || cardData?.setName || '',
    collectorNumber: moxfieldCard.collectorNumber || cardData?.collectorNumber || '',
    
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
    
    // === Stage 2: Enrich with Scryfall data ===
    updateProgress({ stage: 'scryfall' });
    
    // Get unique card names
    const uniqueNames = Array.from(new Set(aggregates.map(a => a.name)));
    const identifiers = cardNamesToIdentifiers(uniqueNames);
    
    try {
      const scryfallResponse = await fetchCardCollectionBatched(identifiers);
      
      // Create a map for easy lookup
      const scryfallMap = new Map<string, ScryfallCard>();
      scryfallResponse.data.forEach(card => {
        scryfallMap.set(card.name, card);
      });
      
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
    } catch (error) {
      errors.push({
        cardName: 'Batch request',
        stage: 'scryfall',
        error: error instanceof Error ? error.message : 'Failed to fetch Scryfall data',
      });
    }
    
    // === Stage 3: Fetch Tagger tags (one at a time) ===
    updateProgress({ 
      stage: 'tagger',
      cardsProcessed: 0 
    });
    
    for (let i = 0; i < aggregates.length; i++) {
      const aggregate = aggregates[i];
      updateProgress({ 
        currentCard: aggregate.name,
        cardsProcessed: i 
      });
      
      // Skip if we don't have set/collector number
      if (!aggregate.set || !aggregate.collectorNumber) {
        aggregate.taggerFetched = true;
        aggregate.taggerError = 'Missing set or collector number';
        errors.push({
          cardName: aggregate.name,
          stage: 'tagger',
          error: 'Missing set or collector number',
        });
        continue;
      }
      
      try {
        // Fetch tags from Tagger API
        const taggerCard = await fetchCardTags(
          aggregate.set,
          aggregate.collectorNumber
        );
        
        if (taggerCard) {
          aggregate.oracleTags = extractOracleTags(taggerCard);
          aggregate.taggerFetched = true;
        } else {
          aggregate.taggerFetched = true;
          aggregate.taggerError = 'Not found in Tagger database';
        }
      } catch (error) {
        aggregate.taggerFetched = true;
        aggregate.taggerError = error instanceof Error ? error.message : 'Failed to fetch tags';
        errors.push({
          cardName: aggregate.name,
          stage: 'tagger',
          error: aggregate.taggerError,
        });
      }
      
      // Rate limiting is now handled by the backend
      
      updateProgress({ cardsProcessed: i + 1 });
    }
    
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