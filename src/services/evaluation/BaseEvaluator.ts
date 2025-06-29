import type { DeckCardData } from "@/components/DeckTable";
import type { CategoryEvaluation, CardEvaluation, CategoryEvaluator } from "./types";

export abstract class BaseCategoryEvaluator implements CategoryEvaluator {
  abstract name: string;
  abstract description: string;
  abstract category: keyof import("./types").DeckEvaluation['categories'];
  abstract keywords: string[];
  abstract cardPatterns: RegExp[];
  
  /**
   * Override to define target counts based on deck size
   */
  protected abstract getTargetCount(totalCards: number): number;
  
  /**
   * Override to provide category-specific evaluation logic
   */
  protected abstract evaluateCards(
    cards: DeckCardData[], 
    commanders: DeckCardData[]
  ): CardEvaluation[];
  
  /**
   * Override to provide category-specific suggestions
   */
  protected abstract generateSuggestions(
    cards: CardEvaluation[],
    targetCount: number,
    commanders: DeckCardData[],
    allCards: DeckCardData[]
  ): string[];
  
  evaluate(cards: DeckCardData[], commanders: DeckCardData[]): CategoryEvaluation {
    const mainboardCards = cards.filter(card => card.board === "mainboard");
    const totalCards = mainboardCards.length;
    const targetCount = this.getTargetCount(totalCards);
    
    // Find relevant cards
    const relevantCards = this.evaluateCards(mainboardCards, commanders);
    const actualCount = relevantCards.length;
    
    // Calculate score
    const ratio = actualCount / targetCount;
    let score: number;
    let rating: CategoryEvaluation['rating'];
    
    if (ratio >= 1) {
      score = Math.min(100, 80 + (ratio - 1) * 20);
      rating = ratio >= 1.2 ? 'excellent' : 'good';
    } else if (ratio >= 0.8) {
      score = 60 + (ratio - 0.8) * 100;
      rating = 'average';
    } else if (ratio >= 0.5) {
      score = 30 + (ratio - 0.5) * 100;
      rating = 'below-average';
    } else {
      score = ratio * 60;
      rating = 'poor';
    }
    
    // Generate findings
    const findings = this.generateFindings(relevantCards, targetCount, actualCount);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(relevantCards, targetCount, commanders, cards);
    
    return {
      score: Math.round(score),
      rating,
      findings,
      suggestions,
      cards: relevantCards,
      targetCount,
      actualCount
    };
  }
  
  protected generateFindings(
    cards: CardEvaluation[], 
    targetCount: number, 
    actualCount: number
  ): string[] {
    const findings: string[] = [];
    
    if (actualCount === 0) {
      findings.push(`No ${this.name.toLowerCase()} cards found in the deck.`);
    } else if (actualCount < targetCount * 0.5) {
      findings.push(`Very low ${this.name.toLowerCase()} count (${actualCount}/${targetCount} recommended).`);
    } else if (actualCount < targetCount * 0.8) {
      findings.push(`Below recommended ${this.name.toLowerCase()} count (${actualCount}/${targetCount}).`);
    } else if (actualCount >= targetCount * 1.2) {
      findings.push(`Above average ${this.name.toLowerCase()} count (${actualCount}/${targetCount} recommended).`);
    } else {
      findings.push(`Good ${this.name.toLowerCase()} count (${actualCount}/${targetCount} recommended).`);
    }
    
    // Add quality-based findings
    const highImportance = cards.filter(c => c.importance === 'high').length;
    
    if (highImportance > 0) {
      findings.push(`${highImportance} high-quality ${this.name.toLowerCase()} cards identified.`);
    }
    
    return findings;
  }
  
  /**
   * Helper method to check if a card matches keywords or patterns
   */
  protected matchesCategory(card: DeckCardData): boolean {
    const searchText = `${card.name} ${card.oracle_text || ''} ${card.type_line}`.toLowerCase();
    
    // Check keywords
    if (this.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
      return true;
    }
    
    // Check patterns
    if (this.cardPatterns.some(pattern => pattern.test(searchText))) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Helper to calculate card quality/importance
   */
  protected calculateImportance(card: DeckCardData): CardEvaluation['importance'] {
    // Base implementation - can be overridden
    const cmc = card.cmc || 0;
    
    if (cmc <= 2) return 'high';
    if (cmc <= 4) return 'medium';
    return 'low';
  }
}