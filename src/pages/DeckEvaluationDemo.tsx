import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ComprehensiveDeckEvaluation } from '@/components/evaluation/ComprehensiveDeckEvaluation';
import { OracleTagCloud } from '@/components/evaluation/OracleTagCloud';
import { useDeckImport } from '@/hooks/useDeckImport';
import type { CardAggregate } from '@/types/cardAggregate';

export function DeckEvaluationDemo() {
  const { deckId: urlDeckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deckId, setDeckId] = useState(urlDeckId || '');
  const [cards, setCards] = useState<CardAggregate[] | null>(null);
  const [deckName, setDeckName] = useState<string>('');
  
  const { importDeck, loading, error, progress } = useDeckImport({
    onComplete: (result) => {
      setCards(result.cards);
      setDeckName(result.deckName);
    },
  });

  const handleImport = () => {
    if (deckId) {
      importDeck(deckId);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Import
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Deck Evaluation with Oracle Tags</h1>
        <p className="text-muted-foreground">
          Get a comprehensive analysis of your deck using Scryfall Tagger oracle tags
        </p>
      </div>

      {!cards ? (
        <Card>
          <CardHeader>
            <CardTitle>Import a Deck</CardTitle>
            <CardDescription>
              Enter a Moxfield deck ID to analyze its composition and get suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter Moxfield deck ID (e.g., WjLv6WR-wEmaQZHe6BPBpQ)"
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                disabled={loading}
              />
              <Button 
                onClick={handleImport} 
                disabled={loading || !deckId}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Analyze Deck'
                )}
              </Button>
            </div>

            {loading && progress && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progress.stage === 'moxfield' && 'Fetching deck from Moxfield...'}
                    {progress.stage === 'scryfall' && 'Loading card details from Scryfall...'}
                    {progress.stage === 'tagger' && 'Retrieving oracle tags...'}
                    {progress.stage === 'complete' && 'Import complete!'}
                  </span>
                  <span>
                    {progress.cardsProcessed}/{progress.totalCards} cards
                  </span>
                </div>
                {progress.currentCard && (
                  <p className="text-xs text-muted-foreground">
                    Processing: {progress.currentCard}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">What is Oracle Tag Analysis?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Oracle tags are community-curated functional tags from Scryfall Tagger that describe
                what cards actually do, beyond just their rules text.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Ramp:</strong> Cards tagged with mana-rock, mana-dork, land-ramp, etc.</li>
                <li>• <strong>Card Advantage:</strong> Cards with draw, cantrip, wheel tags</li>
                <li>• <strong>Synergies:</strong> Cards that work well together</li>
                <li>• <strong>Win Conditions:</strong> Game-ending threats and combos</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <ComprehensiveDeckEvaluation cards={cards} deckName={deckName} />
          <OracleTagCloud cards={cards} />
        </div>
      )}
    </div>
  );
}