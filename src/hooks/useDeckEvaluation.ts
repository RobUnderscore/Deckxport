import { useMemo } from 'react';
import { DeckEvaluationService } from '@/services/evaluation/DeckEvaluationService';
import type { DeckCardData } from '@/components/DeckTable';
import type { DeckEvaluation } from '@/services/evaluation/types';

const evaluationService = new DeckEvaluationService();

export function useDeckEvaluation(cards: DeckCardData[]): DeckEvaluation | null {
  return useMemo(() => {
    if (!cards || cards.length === 0) {
      return null;
    }
    
    return evaluationService.evaluateDeck(cards);
  }, [cards]);
}