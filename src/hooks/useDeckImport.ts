import { useState } from 'react';
import { aggregateDeckData } from '@/services/deckAggregator';
import type { DeckImportResult, DeckImportProgress } from '@/types/cardAggregate';

interface UseDeckImportOptions {
  onComplete?: (result: DeckImportResult) => void;
  onError?: (error: Error) => void;
}

export function useDeckImport(options?: UseDeckImportOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<DeckImportProgress | null>(null);

  const importDeck = async (deckId: string) => {
    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      const result = await aggregateDeckData(deckId, (prog) => {
        setProgress(prog);
      });
      
      options?.onComplete?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import deck';
      setError(errorMessage);
      options?.onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return {
    importDeck,
    loading,
    error,
    progress,
  };
}