import { useMemo } from 'react';
import type { CardAggregate } from '@/types/cardAggregate';
import {
  evaluateRamp,
  evaluateCardAdvantage,
  evaluateInteraction,
  evaluateWinConditions,
  evaluateTargetedRemoval,
  evaluateBoardWipes,
  type CategoryEvaluation,
} from '@/services/evaluation';

interface DeckEvaluation {
  ramp: CategoryEvaluation;
  cardAdvantage: CategoryEvaluation;
  interaction: CategoryEvaluation;
  winConditions: CategoryEvaluation;
  targetedRemoval: CategoryEvaluation;
  boardWipes: CategoryEvaluation;
  
  // Overall metrics
  totalCards: number;
  averageCMC: number;
  manaSources: number;
  overallRating: number;
  suggestions: string[];
}

export function useDeckEvaluationAggregate(cards: CardAggregate[]): DeckEvaluation {
  return useMemo(() => {
    // Filter cards by board
    const mainboardCards = cards.filter(card => card.board === "mainboard");
    const commanderCards = cards.filter(card => card.board === "commander");
    
    // Calculate basic metrics (include commanders in the deck total)
    const totalMainboard = mainboardCards.reduce((sum, card) => sum + card.quantity, 0);
    const totalCommanders = commanderCards.reduce((sum, card) => sum + card.quantity, 0);
    const totalCards = totalMainboard + totalCommanders;
    
    // Calculate average CMC for mainboard + commanders
    const mainAndCommanderCards = [...mainboardCards, ...commanderCards];
    const totalCMC = mainAndCommanderCards.reduce((sum, card) => sum + (card.cmc * card.quantity), 0);
    const averageCMC = totalCards > 0 ? totalCMC / totalCards : 0;
    
    // Count lands
    const landCount = mainboardCards
      .filter(card => card.typeLine.toLowerCase().includes('land'))
      .reduce((sum, card) => sum + card.quantity, 0);
    
    // Evaluate categories
    const ramp = evaluateRamp(mainboardCards);
    const cardAdvantage = evaluateCardAdvantage(mainboardCards);
    const interaction = evaluateInteraction(mainboardCards);
    const winConditions = evaluateWinConditions(mainboardCards);
    const targetedRemoval = evaluateTargetedRemoval(mainboardCards);
    const boardWipes = evaluateBoardWipes(mainboardCards);
    
    // Calculate mana sources (lands + ramp)
    const manaSources = landCount + ramp.count;
    
    // Calculate overall rating
    const categoryRatings = [
      ramp.rating,
      cardAdvantage.rating,
      interaction.rating,
      winConditions.rating,
    ];
    const overallRating = categoryRatings.reduce((a, b) => a + b, 0) / categoryRatings.length;
    
    // Generate suggestions
    const suggestions: string[] = [];
    
    if (manaSources < 45) {
      suggestions.push(`Consider adding more mana sources. You have ${manaSources} (including ${landCount} lands and ${ramp.count} ramp spells), aim for 45-50.`);
    }
    
    if (ramp.rating < 6) {
      suggestions.push("Your ramp package could be stronger. Consider adding more efficient mana acceleration.");
    }
    
    if (cardAdvantage.rating < 6) {
      suggestions.push("You might need more card draw and card advantage engines.");
    }
    
    if (interaction.rating < 6) {
      suggestions.push("Consider adding more interaction to deal with opponents' threats.");
    }
    
    if (winConditions.rating < 5) {
      suggestions.push("Your deck might struggle to close out games. Consider adding more win conditions.");
    }
    
    if (averageCMC > 3.5) {
      suggestions.push(`Your average CMC is ${averageCMC.toFixed(2)}, which is quite high. Consider adding more low-cost spells.`);
    }
    
    if (boardWipes.count < 2) {
      suggestions.push("Consider adding more board wipes to handle go-wide strategies.");
    }
    
    // Check oracle tag coverage
    const cardsWithTags = mainboardCards.filter(c => c.oracleTags.length > 0).length;
    const tagCoverage = mainboardCards.length > 0 ? (cardsWithTags / mainboardCards.length) * 100 : 0;
    if (tagCoverage < 50) {
      suggestions.push(`Oracle tag coverage is low (${tagCoverage.toFixed(0)}%). Some cards may not be properly categorized.`);
    }
    
    return {
      ramp,
      cardAdvantage,
      interaction,
      winConditions,
      targetedRemoval,
      boardWipes,
      totalCards,
      averageCMC,
      manaSources,
      overallRating,
      suggestions,
    };
  }, [cards]);
}