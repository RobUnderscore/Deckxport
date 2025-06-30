import React, { useState } from 'react';
import { useDeckAggregate, extractDeckId } from '@/hooks/useDeckAggregate';
import { DeckAggregateTable } from '@/components/DeckTable/DeckAggregateTable';
import { CommanderDeckEvaluation } from '@/components/CommanderDeckEvaluationAggregate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, Table2, Shield, Tag } from 'lucide-react';
import type { DeckImportProgress } from '@/types/cardAggregate';

export default function DeckAggregateImport() {
  const [deckUrl, setDeckUrl] = useState('');
  const { result, progress, isLoading, error, importDeck, reset } = useDeckAggregate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deckId = extractDeckId(deckUrl);
    if (deckId) {
      await importDeck(deckId);
    } else {
      alert('Please enter a valid Moxfield deck URL');
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    
    // Different progress calculation based on stage
    switch (progress.stage) {
      case 'moxfield':
        return 10; // Initial fetch
      case 'moxfield-processing':
        return 20; // Processing deck structure
      case 'scryfall-batch':
        return 30; // Batch fetching
      case 'scryfall':
        // 30-60% for individual card processing
        if (progress.totalCards === 0) return 30;
        return 30 + (progress.cardsProcessed / progress.totalCards) * 30;
      case 'tagger':
        // 60-100% for oracle tags
        if (progress.totalCards === 0) return 60;
        return 60 + (progress.cardsProcessed / progress.totalCards) * 40;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  const getStageLabel = (stage: DeckImportProgress['stage']) => {
    switch (stage) {
      case 'moxfield':
        return 'Retrieving deck from Moxfield...';
      case 'moxfield-processing':
        return 'Processing deck structure...';
      case 'scryfall-batch':
        return 'Retrieving card information from Scryfall...';
      case 'scryfall':
        return 'Loading individual card details...';
      case 'tagger':
        return 'Fetching oracle tags...';
      case 'complete':
        return 'Import complete!';
      case 'error':
        return 'An error occurred';
      default:
        return 'Preparing...';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Deck Import & Analysis</h1>
        <p className="text-muted-foreground">
          Import a deck from Moxfield to analyze card data, oracle tags, and deck composition
        </p>
      </div>

      {/* Import Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://www.moxfield.com/decks/..."
            value={deckUrl}
            onChange={(e) => setDeckUrl(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !deckUrl}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Deck'
            )}
          </Button>
          {result && (
            <Button type="button" variant="outline" onClick={reset}>
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Progress Display */}
      {isLoading && progress && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{getStageLabel(progress.stage)}</span>
            <span className="text-sm text-muted-foreground">
              {progress.stage === 'moxfield' || progress.stage === 'moxfield-processing' || progress.stage === 'scryfall-batch' ? (
                'Preparing...'
              ) : (
                `${progress.cardsProcessed} / ${progress.totalCards} cards`
              )}
            </span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
          {progress.currentCard && (
            <p className="text-xs text-muted-foreground">
              Processing: {progress.currentCard}
            </p>
          )}
          {progress.stage === 'scryfall-batch' && (
            <p className="text-xs text-muted-foreground">
              Fetching card data in batches for optimal performance...
            </p>
          )}
          {progress.stage === 'tagger' && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Fetching oracle tags with cached results for faster loading...
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Errors Summary */}
      {result && result.errors.length > 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import completed with {result.errors.length} errors</AlertTitle>
          <AlertDescription>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm">View error details</summary>
              <ul className="mt-2 space-y-1 text-xs">
                {result.errors.slice(0, 10).map((error, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{error.cardName}</span> ({error.stage}): {error.error}
                  </li>
                ))}
                {result.errors.length > 10 && (
                  <li className="text-muted-foreground">
                    ... and {result.errors.length - 10} more errors
                  </li>
                )}
              </ul>
            </details>
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{result.deckName}</h2>
              <p className="text-muted-foreground">
                by {result.deckAuthor} • {result.format || 'Unknown format'}
              </p>
            </div>
          </div>

          <Tabs defaultValue="table" className="w-full">
            <TabsList>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                Deck List
              </TabsTrigger>
              {result.format?.toLowerCase().includes('commander') && (
                <TabsTrigger value="evaluation" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Commander Analysis
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="table" className="mt-6">
              <DeckAggregateTable 
                cards={result.cards} 
                deckName={result.deckName}
              />
            </TabsContent>

            {result.format?.toLowerCase().includes('commander') && (
              <TabsContent value="evaluation" className="mt-6">
                <CommanderDeckEvaluation 
                  cards={result.cards}
                  deckName={result.deckName}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}