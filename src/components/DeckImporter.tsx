import { useState } from 'react';
import { useMoxfieldDeck } from '@/hooks/useMoxfieldDeck';
import { useCardsByNames } from '@/hooks/useScryfall';
import { CardGrid } from './CardGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
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

export function DeckImporter() {
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
          // v2 API structure (fallback) - keys are card names
          ...(deck.mainboard ? Object.keys(deck.mainboard) : []),
          ...(deck.sideboard ? Object.keys(deck.sideboard) : []),
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Paste Moxfield deck URL..."
            value={deckUrl}
            onChange={(e) => setDeckUrl(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!deckUrl.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Go'
            )}
          </Button>
          {shouldFetch && (
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Error: {error.message}</AlertDescription>
        </Alert>
      )}

      {deck && !error && (
        <div className="space-y-4">
          <div className="bg-secondary rounded-lg p-4">
            <h2 className="text-2xl font-bold">{deck.name}</h2>
            <p className="text-muted-foreground">
              by {deck.createdByUser?.userName} • {deck.format} •{' '}
              {Object.keys(getMainboardCards(deck)).length} unique cards •{' '}
              {Object.values(getMainboardCards(deck)).reduce((sum, card) => sum + card.quantity, 0)}{' '}
              total cards
            </p>
          </div>

          {(isCardsLoading || (scryfallData && scryfallData.data.length > 0)) && (
            <CardGrid cards={scryfallData?.data || []} isLoading={isCardsLoading} />
          )}

          {scryfallData && scryfallData.not_found.length > 0 && (
            <Alert>
              <AlertDescription>
                {scryfallData.not_found.length} cards could not be found
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
