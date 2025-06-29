import { BaseCategoryEvaluator } from "../BaseEvaluator";
import type { DeckCardData } from "@/components/DeckTable";
import type { CardEvaluation } from "../types";

export class PlaceholderEvaluator extends BaseCategoryEvaluator {
  constructor(
    public name: string,
    public description: string,
    public category: keyof import("../types").DeckEvaluation['categories']
  ) {
    super();
  }
  
  keywords: string[] = [];
  cardPatterns: RegExp[] = [];
  
  protected getTargetCount(_totalCards: number): number {
    return 10;
  }
  
  protected evaluateCards(
    _cards: DeckCardData[], 
    _commanders: DeckCardData[]
  ): CardEvaluation[] {
    return [];
  }
  
  protected generateSuggestions(
    _cards: CardEvaluation[],
    _targetCount: number,
    _commanders: DeckCardData[],
    _allCards: DeckCardData[]
  ): string[] {
    return [`${this.name} evaluation coming soon.`];
  }
}