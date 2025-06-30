import type { CardAggregate } from '@/types/cardAggregate';
import type { CategoryEvaluation } from './index';

/**
 * Advanced deck evaluation using oracle tags from Scryfall Tagger
 */

/**
 * Evaluate synergy potential in the deck
 * Looks for cards that work well together
 */
export function evaluateSynergy(cards: CardAggregate[]): CategoryEvaluation {
  const synergyCards: CardAggregate[] = [];
  const synergyTypes = new Map<string, number>();
  
  cards.forEach(card => {
    const synergies = card.oracleTags.filter(tag => 
      tag.includes('synergy-') || 
      tag.includes('typal-') ||
      tag.includes('trigger') ||
      tag.includes('matters')
    );
    
    if (synergies.length > 0) {
      synergyCards.push(card);
      synergies.forEach(syn => {
        synergyTypes.set(syn, (synergyTypes.get(syn) || 0) + card.quantity);
      });
    }
  });
  
  // Higher rating for decks with multiple cards sharing synergies
  const sharedSynergies = Array.from(synergyTypes.values()).filter(count => count > 1).length;
  
  const count = synergyCards.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round(
    (count / 15) * 5 + // Base rating from count
    (sharedSynergies / 5) * 5 // Bonus for shared synergies
  ));
  
  return {
    rating,
    count,
    cards: synergyCards.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Evaluate card quality distribution
 * Tracks vanilla, french vanilla, and complex cards
 */
export function evaluateCardQuality(cards: CardAggregate[]): CategoryEvaluation {
  const qualityCards: CardAggregate[] = [];
  const qualityBreakdown = {
    vanilla: 0,
    frenchVanilla: 0,
    complex: 0,
  };
  
  cards.forEach(card => {
    if (card.oracleTags.includes('vanilla')) {
      qualityBreakdown.vanilla += card.quantity;
    } else if (card.oracleTags.includes('french vanilla') || 
               card.oracleTags.includes('virtual french vanilla')) {
      qualityBreakdown.frenchVanilla += card.quantity;
    } else if (card.oracleTags.length > 3) {
      // Complex cards have many tags
      qualityBreakdown.complex += card.quantity;
      qualityCards.push(card);
    }
  });
  
  // Higher rating for more complex, synergistic cards
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
  const complexityRatio = qualityBreakdown.complex / totalCards;
  const rating = Math.min(10, Math.round(complexityRatio * 15));
  
  return {
    rating,
    count: qualityBreakdown.complex,
    cards: qualityCards.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Evaluate tempo and mana efficiency
 */
export function evaluateTempo(cards: CardAggregate[]): CategoryEvaluation {
  const tempoCards: CardAggregate[] = [];
  
  cards.forEach(card => {
    if (card.oracleTags.some(tag => 
      tag === 'cheaper than mv' ||
      tag === 'free spell' ||
      tag === 'quick equip' ||
      tag === 'activate from hand' ||
      tag === 'haste' ||
      tag === 'flash' ||
      tag.includes('affinity') ||
      tag.includes('cost-reduction')
    )) {
      tempoCards.push(card);
    }
  });
  
  const count = tempoCards.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round((count / 8) * 10));
  
  return {
    rating,
    count,
    cards: tempoCards.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Evaluate card selection and deck manipulation
 */
export function evaluateCardSelection(cards: CardAggregate[]): CategoryEvaluation {
  const selectionCards: CardAggregate[] = [];
  
  cards.forEach(card => {
    if (card.oracleTags.some(tag => 
      tag.includes('tutor') ||
      tag === 'scry' ||
      tag === 'surveil' ||
      tag === 'impulse' ||
      tag === 'library manipulation' ||
      tag === 'dig' ||
      tag === 'look at top'
    )) {
      selectionCards.push(card);
    }
  });
  
  const count = selectionCards.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round((count / 6) * 10));
  
  return {
    rating,
    count,
    cards: selectionCards.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Evaluate recursion and graveyard interaction
 */
export function evaluateRecursion(cards: CardAggregate[]): CategoryEvaluation {
  const recursionCards: CardAggregate[] = [];
  
  cards.forEach(card => {
    if (card.oracleTags.some(tag => 
      tag.includes('recursion') ||
      tag.includes('graveyard') ||
      tag === 'reanimate' ||
      tag === 'flashback' ||
      tag === 'escape' ||
      tag === 'unearth' ||
      tag === 'death trigger' ||
      tag === 'ltb trigger'
    )) {
      recursionCards.push(card);
    }
  });
  
  const count = recursionCards.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round((count / 5) * 10));
  
  return {
    rating,
    count,
    cards: recursionCards.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Evaluate sacrifice outlets and aristocrat strategies
 */
export function evaluateSacrificeOutlets(cards: CardAggregate[]): CategoryEvaluation {
  const sacOutlets: CardAggregate[] = [];
  
  cards.forEach(card => {
    if (card.oracleTags.some(tag => 
      tag.includes('sacrifice outlet') ||
      tag === 'aristocrats' ||
      tag === 'death trigger' ||
      tag === 'dies trigger'
    )) {
      sacOutlets.push(card);
    }
  });
  
  const count = sacOutlets.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round((count / 4) * 10));
  
  return {
    rating,
    count,
    cards: sacOutlets.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Overall deck evaluation combining all metrics
 */
export interface DeckEvaluation {
  overallRating: number;
  categories: {
    ramp: CategoryEvaluation;
    cardAdvantage: CategoryEvaluation;
    interaction: CategoryEvaluation;
    winConditions: CategoryEvaluation;
    targetedRemoval: CategoryEvaluation;
    boardWipes: CategoryEvaluation;
    synergy: CategoryEvaluation;
    cardQuality: CategoryEvaluation;
    tempo: CategoryEvaluation;
    cardSelection: CategoryEvaluation;
    recursion: CategoryEvaluation;
    sacrificeOutlets: CategoryEvaluation;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

/**
 * Generate comprehensive deck evaluation
 */
export async function generateDeckEvaluation(cards: CardAggregate[]): Promise<DeckEvaluation> {
  // Import existing evaluations
  const { evaluateRamp, evaluateCardAdvantage, evaluateInteraction, 
          evaluateWinConditions, evaluateTargetedRemoval, evaluateBoardWipes } = 
    await import('./index');
  
  const categories = {
    ramp: evaluateRamp(cards),
    cardAdvantage: evaluateCardAdvantage(cards),
    interaction: evaluateInteraction(cards),
    winConditions: evaluateWinConditions(cards),
    targetedRemoval: evaluateTargetedRemoval(cards),
    boardWipes: evaluateBoardWipes(cards),
    synergy: evaluateSynergy(cards),
    cardQuality: evaluateCardQuality(cards),
    tempo: evaluateTempo(cards),
    cardSelection: evaluateCardSelection(cards),
    recursion: evaluateRecursion(cards),
    sacrificeOutlets: evaluateSacrificeOutlets(cards),
  };
  
  // Calculate overall rating
  const weights = {
    ramp: 1.5,
    cardAdvantage: 1.5,
    interaction: 1.2,
    winConditions: 1.0,
    targetedRemoval: 1.0,
    boardWipes: 0.8,
    synergy: 1.2,
    cardQuality: 0.6,
    tempo: 0.8,
    cardSelection: 1.0,
    recursion: 0.6,
    sacrificeOutlets: 0.4,
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  Object.entries(categories).forEach(([key, evaluation]) => {
    const weight = weights[key as keyof typeof weights] || 1;
    weightedSum += evaluation.rating * weight;
    totalWeight += weight;
  });
  
  const overallRating = Math.round(weightedSum / totalWeight);
  
  // Identify strengths (8+ rating)
  const strengths: string[] = [];
  Object.entries(categories).forEach(([key, evaluation]) => {
    if (evaluation.rating >= 8) {
      strengths.push(key.replace(/([A-Z])/g, ' $1').trim());
    }
  });
  
  // Identify weaknesses (3 or less rating)
  const weaknesses: string[] = [];
  Object.entries(categories).forEach(([key, evaluation]) => {
    if (evaluation.rating <= 3) {
      weaknesses.push(key.replace(/([A-Z])/g, ' $1').trim());
    }
  });
  
  // Generate suggestions
  const suggestions: string[] = [];
  
  if (categories.ramp.rating < 5) {
    suggestions.push('Consider adding more ramp cards (mana rocks, dorks, or land ramp)');
  }
  if (categories.cardAdvantage.rating < 5) {
    suggestions.push('Add more card draw or card advantage engines');
  }
  if (categories.interaction.rating < 4) {
    suggestions.push('Include more instant-speed interaction (removal, counters, protection)');
  }
  if (categories.winConditions.rating < 3) {
    suggestions.push('Add clear win conditions or game-ending threats');
  }
  if (categories.synergy.rating > 7 && categories.cardSelection.rating < 5) {
    suggestions.push('With high synergy, consider adding tutors or card selection to find key pieces');
  }
  if (categories.boardWipes.count === 0 && categories.targetedRemoval.rating < 5) {
    suggestions.push('Consider adding board wipes or more removal');
  }
  
  return {
    overallRating,
    categories,
    strengths,
    weaknesses,
    suggestions,
  };
}