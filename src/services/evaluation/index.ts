import type { CardAggregate } from '@/types/cardAggregate';

export interface CategoryEvaluation {
  rating: number; // 0-10
  count: number;
  cards: Array<{
    name: string;
    quantity: number;
  }>;
}

/**
 * Evaluate ramp cards in the deck
 */
export function evaluateRamp(cards: CardAggregate[]): CategoryEvaluation {
  const rampCards: CardAggregate[] = [];
  
  cards.forEach(card => {
    // Check oracle tags first (most accurate)
    if (card.oracleTags.some(tag => 
      ['ramp', 'mana-ramp', 'mana-rock', 'mana-dork', 'land-ramp', 'ritual', 
       'cost-reduction', 'adds-multiple-mana'].includes(tag)
    )) {
      rampCards.push(card);
      return;
    }
    
    // Fallback to text analysis if no tags
    const text = (card.oracleText || '').toLowerCase();
    const typeLine = card.typeLine.toLowerCase();
    
    // Check for mana-producing artifacts
    if (typeLine.includes('artifact') && (
      text.includes('add') && text.includes('mana') ||
      text.includes('{t}:') && text.includes('mana')
    )) {
      rampCards.push(card);
      return;
    }
    
    // Check for mana dorks
    if (typeLine.includes('creature') && (
      text.includes('add') && text.includes('mana') ||
      text.includes('{t}:') && text.includes('mana')
    )) {
      rampCards.push(card);
      return;
    }
    
    // Check for land ramp spells
    if ((typeLine.includes('instant') || typeLine.includes('sorcery')) && (
      text.includes('search your library') && text.includes('land') ||
      text.includes('put') && text.includes('land') && text.includes('battlefield')
    )) {
      rampCards.push(card);
      return;
    }
  });
  
  const count = rampCards.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round((count / 10) * 10)); // 10+ ramp = 10/10
  
  return {
    rating,
    count,
    cards: rampCards.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Evaluate card advantage sources
 */
export function evaluateCardAdvantage(cards: CardAggregate[]): CategoryEvaluation {
  const drawCards: CardAggregate[] = [];
  
  cards.forEach(card => {
    // Check oracle tags
    if (card.oracleTags.some(tag => 
      ['card-draw', 'draw', 'cantrip', 'wheel', 'card-advantage', 
       'extra-cards', 'impulse-draw'].includes(tag)
    )) {
      drawCards.push(card);
      return;
    }
    
    // Fallback to text analysis
    const text = (card.oracleText || '').toLowerCase();
    
    if (
      text.includes('draw') && (text.includes('card') || text.includes('cards')) ||
      text.includes('exile') && text.includes('may play') ||
      text.includes('look at') && text.includes('top') ||
      text.includes('reveal') && text.includes('put') && text.includes('hand')
    ) {
      drawCards.push(card);
    }
  });
  
  const count = drawCards.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round((count / 10) * 10)); // 10+ draw = 10/10
  
  return {
    rating,
    count,
    cards: drawCards.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Evaluate interaction (removal, counters, protection)
 */
export function evaluateInteraction(cards: CardAggregate[]): CategoryEvaluation {
  const interactionCards: CardAggregate[] = [];
  
  cards.forEach(card => {
    // Check oracle tags
    if (card.oracleTags.some(tag => 
      ['removal', 'creature-removal', 'board-wipe', 'counter', 'counterspell',
       'protection', 'hexproof', 'indestructible', 'bounce'].includes(tag)
    )) {
      interactionCards.push(card);
      return;
    }
    
    // Fallback to text analysis
    const text = (card.oracleText || '').toLowerCase();
    const typeLine = card.typeLine.toLowerCase();
    
    if (
      text.includes('destroy') || text.includes('exile') ||
      text.includes('counter target') ||
      text.includes('return') && text.includes("owner's hand") ||
      text.includes('damage') && (text.includes('creature') || text.includes('any target')) ||
      text.includes('protection') || text.includes('hexproof') || text.includes('indestructible') ||
      (typeLine.includes('instant') && text.includes('prevent'))
    ) {
      interactionCards.push(card);
    }
  });
  
  const count = interactionCards.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round((count / 15) * 10)); // 15+ interaction = 10/10
  
  return {
    rating,
    count,
    cards: interactionCards.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Evaluate win conditions
 */
export function evaluateWinConditions(cards: CardAggregate[]): CategoryEvaluation {
  const wincons: CardAggregate[] = [];
  
  cards.forEach(card => {
    // Check oracle tags
    if (card.oracleTags.some(tag => 
      ['win-condition', 'combo-piece', 'finisher', 'game-ender', 
       'infinite-combo', 'alternate-win'].includes(tag)
    )) {
      wincons.push(card);
      return;
    }
    
    // Fallback to text analysis
    const text = (card.oracleText || '').toLowerCase();
    const typeLine = card.typeLine.toLowerCase();
    
    // High CMC creatures can be finishers
    if (typeLine.includes('creature') && card.cmc >= 6) {
      const power = parseInt(card.power || '0');
      if (power >= 6 || text.includes('double strike') || text.includes('infect')) {
        wincons.push(card);
        return;
      }
    }
    
    // Look for win condition text
    if (
      text.includes('you win the game') ||
      text.includes('loses the game') ||
      text.includes('combat damage') && text.includes('player') && card.cmc >= 5 ||
      text.includes('infinite') ||
      (text.includes('whenever') && text.includes('deals damage') && text.includes('each opponent'))
    ) {
      wincons.push(card);
    }
  });
  
  const count = wincons.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round((count / 5) * 10)); // 5+ wincons = 10/10
  
  return {
    rating,
    count,
    cards: wincons.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Evaluate targeted removal
 */
export function evaluateTargetedRemoval(cards: CardAggregate[]): CategoryEvaluation {
  const removal: CardAggregate[] = [];
  
  cards.forEach(card => {
    // Check oracle tags
    if (card.oracleTags.some(tag => 
      ['removal', 'creature-removal', 'spot-removal', 'targeted-removal'].includes(tag)
    )) {
      removal.push(card);
      return;
    }
    
    // Fallback to text analysis
    const text = (card.oracleText || '').toLowerCase();
    const typeLine = card.typeLine.toLowerCase();
    
    // Skip board wipes
    if (text.includes('all') || text.includes('each')) {
      return;
    }
    
    if (
      (typeLine.includes('instant') || typeLine.includes('sorcery')) &&
      (text.includes('destroy target') || 
       text.includes('exile target') ||
       text.includes('damage') && text.includes('target') ||
       text.includes('return target') && text.includes("owner's hand"))
    ) {
      removal.push(card);
    }
  });
  
  const count = removal.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round((count / 8) * 10)); // 8+ removal = 10/10
  
  return {
    rating,
    count,
    cards: removal.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}

/**
 * Evaluate board wipes
 */
export function evaluateBoardWipes(cards: CardAggregate[]): CategoryEvaluation {
  const wipes: CardAggregate[] = [];
  
  cards.forEach(card => {
    // Check oracle tags
    if (card.oracleTags.some(tag => 
      ['board-wipe', 'mass-removal', 'sweeper', 'wrath-effect'].includes(tag)
    )) {
      wipes.push(card);
      return;
    }
    
    // Fallback to text analysis
    const text = (card.oracleText || '').toLowerCase();
    
    if (
      (text.includes('destroy all') || text.includes('exile all')) ||
      (text.includes('each') && (text.includes('creature') || text.includes('permanent')) && 
       (text.includes('destroy') || text.includes('exile') || text.includes('sacrifice'))) ||
      text.includes('damage to each') ||
      text.includes('wrath') || text.includes('damnation')
    ) {
      wipes.push(card);
    }
  });
  
  const count = wipes.reduce((sum, card) => sum + card.quantity, 0);
  const rating = Math.min(10, Math.round((count / 3) * 10)); // 3+ wipes = 10/10
  
  return {
    rating,
    count,
    cards: wipes.map(c => ({ name: c.name, quantity: c.quantity })),
  };
}