import { useState, useMemo } from 'react';
import { useMoxfieldDeck } from '@/hooks/useMoxfieldDeck';
import { useCardsByNames } from '@/hooks/useScryfall';
import { DeckDataTable, DeckCardData } from '@/components/DeckTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { MoxfieldDeck } from '@/types/moxfield';

// Helper function to get mainboard cards from either v2 or v3 API structure
function getMainboardCards(deck: MoxfieldDeck | undefined) {
  if (!deck) return {};

  // Check v3 structure first
  if (deck.boards?.mainboard?.cards) {
    return deck.boards.mainboard.cards;
  }

  // Fallback to v2 structure
  return deck.mainboard || {};
}

export default function DeckTableWithImport() {
  const [deckUrl, setDeckUrl] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);

  // Fetch deck data from Moxfield
  const {
    data: deck,
    isLoading: isDeckLoading,
    error: deckError,
  } = useMoxfieldDeck(shouldFetch ? deckUrl : undefined);

  // Extract unique card names from deck - handle both v2 and v3 API structures
  const cardNames = deck
    ? Array.from(
        new Set([
          // v3 API structure - extract names from card data
          ...(deck.boards?.mainboard?.cards
            ? Object.values(deck.boards.mainboard.cards)
                .map((card) => card.card?.name || '')
                .filter(Boolean)
            : []),
          ...(deck.boards?.sideboard?.cards
            ? Object.values(deck.boards.sideboard.cards)
                .map((card) => card.card?.name || '')
                .filter(Boolean)
            : []),
          ...(deck.boards?.commanders?.cards
            ? Object.values(deck.boards.commanders.cards)
                .map((card) => card.card?.name || '')
                .filter(Boolean)
            : []),
          // v2 API structure (fallback) - keys are card names
          ...(deck.mainboard ? Object.keys(deck.mainboard) : []),
          ...(deck.sideboard ? Object.keys(deck.sideboard) : []),
          ...(deck.commanders ? Object.keys(deck.commanders) : []),
        ])
      )
    : [];

  // Fetch card data from Scryfall
  const {
    data: scryfallData,
    isLoading: isCardsLoading,
    error: cardsError,
  } = useCardsByNames(cardNames, {
    enabled: cardNames.length > 0,
  });

  const isLoading = isDeckLoading || isCardsLoading;
  const error = deckError || cardsError;

  // Process cards with quantity and board information
  const processedCards = useMemo(() => {
    if (!deck || !scryfallData?.data) return [];

    const cardMap = new Map<string, DeckCardData>();

    // Process mainboard cards
    const mainboardCards = deck.boards?.mainboard?.cards || deck.mainboard || {};
    Object.entries(mainboardCards).forEach(([key, moxfieldCard]) => {
      const cardName = moxfieldCard.card?.name || key;
      const scryfallCard = scryfallData.data.find(c => c.name === cardName);
      
      if (scryfallCard) {
        cardMap.set(`${cardName}-mainboard`, {
          ...scryfallCard,
          quantity: moxfieldCard.quantity,
          board: "mainboard"
        });
      }
    });

    // Process sideboard cards
    const sideboardCards = deck.boards?.sideboard?.cards || deck.sideboard || {};
    Object.entries(sideboardCards).forEach(([key, moxfieldCard]) => {
      const cardName = moxfieldCard.card?.name || key;
      const scryfallCard = scryfallData.data.find(c => c.name === cardName);
      
      if (scryfallCard) {
        cardMap.set(`${cardName}-sideboard`, {
          ...scryfallCard,
          quantity: moxfieldCard.quantity,
          board: "sideboard"
        });
      }
    });

    // Process commander cards if present
    const commanderCards = deck.boards?.commanders?.cards || deck.commanders || {};
    if (Object.keys(commanderCards).length > 0) {
      Object.entries(commanderCards).forEach(([key, moxfieldCard]) => {
        const cardName = moxfieldCard.card?.name || key;
        const scryfallCard = scryfallData.data.find(c => c.name === cardName);
        
        if (scryfallCard) {
          cardMap.set(`${cardName}-commander`, {
            ...scryfallCard,
            quantity: moxfieldCard.quantity,
            board: "commander"
          });
        }
      });
    }

    return Array.from(cardMap.values());
  }, [deck, scryfallData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deckUrl.trim()) {
      setShouldFetch(true);
    }
  };

  const handleReset = () => {
    setDeckUrl('');
    setShouldFetch(false);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-white">Deckxport</h1>
            <p className="text-xl text-gray-400">
              Import your Moxfield deck and view it in a customizable table format
            </p>
          </div>

          {/* Import Form - Always Visible */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="Paste Moxfield deck URL (e.g., https://www.moxfield.com/decks/...)"
                  value={deckUrl}
                  onChange={(e) => setDeckUrl(e.target.value)}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={!deckUrl.trim() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Import Deck'
                  )}
                </Button>
                {shouldFetch && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleReset}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </form>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error: {error.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Deck Info Bar */}
            {deck && !error && (
              <div className="mt-4 bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span className="font-semibold text-white">{deck.name}</span>
                    <span>by {deck.createdByUser?.userName}</span>
                    <span className="text-gray-400">•</span>
                    <span>{deck.format}</span>
                    <span className="text-gray-400">•</span>
                    <span>
                      {Object.keys(getMainboardCards(deck)).length} unique cards
                    </span>
                  </div>
                  {scryfallData && scryfallData.not_found.length > 0 && (
                    <span className="text-sm text-yellow-400">
                      ⚠ {scryfallData.not_found.length} cards not found
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Table Display */}
          {processedCards.length > 0 && (
            <div className="rounded-lg p-6 bg-gray-900/30">
              <DeckDataTable data={processedCards} />
            </div>
          )}

          {/* Empty State */}
          {!deck && !error && !isLoading && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                Enter a Moxfield deck URL above to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}