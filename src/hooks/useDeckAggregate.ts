import { useState, useCallback, useRef } from 'react';
import type { DeckImportProgress, DeckImportResult } from '@/types/cardAggregate';
import { aggregateDeckData } from '@/services/deckAggregator';

interface UseDeckAggregateResult {
  // Data
  result: DeckImportResult | null;
  progress: DeckImportProgress | null;
  
  // State
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  importDeck: (deckId: string) => Promise<void>;
  reset: () => void;
}

export function useDeckAggregate(): UseDeckAggregateResult {
  const [result, setResult] = useState<DeckImportResult | null>(null);
  const [progress, setProgress] = useState<DeckImportProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use ref to track if import is in progress to prevent duplicates
  const importInProgress = useRef(false);
  
  const importDeck = useCallback(async (deckId: string) => {
    if (importInProgress.current) {
      console.warn('Import already in progress');
      return;
    }
    
    importInProgress.current = true;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);
    
    try {
      const importResult = await aggregateDeckData(deckId, (prog) => {
        setProgress(prog);
      });
      
      setResult(importResult);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to import deck'));
    } finally {
      setIsLoading(false);
      importInProgress.current = false;
    }
  }, []);
  
  const reset = useCallback(() => {
    setResult(null);
    setProgress(null);
    setError(null);
    setIsLoading(false);
    importInProgress.current = false;
  }, []);
  
  return {
    result,
    progress,
    isLoading,
    error,
    importDeck,
    reset,
  };
}

/**
 * Extract deck ID from Moxfield URL
 */
export function extractDeckId(url: string): string | null {
  const match = url.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
}