import type { DeckCardData } from "@/components/DeckTable";

/**
 * Base evaluation result interface
 */
export interface EvaluationResult {
  score: number; // 0-100
  rating: 'poor' | 'below-average' | 'average' | 'good' | 'excellent';
  findings: string[];
  suggestions: string[];
}

/**
 * Detailed card evaluation with reasons
 */
export interface CardEvaluation {
  card: DeckCardData;
  category: string;
  reasoning: string;
  importance: 'low' | 'medium' | 'high';
}

/**
 * Complete deck evaluation results
 */
export interface DeckEvaluation {
  overallScore: number;
  overallRating: 'poor' | 'below-average' | 'average' | 'good' | 'excellent';
  
  categories: {
    ramp: CategoryEvaluation;
    cardDraw: CategoryEvaluation;
    removal: CategoryEvaluation;
    winConditions: CategoryEvaluation;
    manaBase: CategoryEvaluation;
    synergy: CategoryEvaluation;
  };
  
  statistics: DeckStatistics;
  manaCurve: ManaCurveData;
  colorIdentity: ColorIdentityAnalysis;
}

/**
 * Individual category evaluation
 */
export interface CategoryEvaluation extends EvaluationResult {
  cards: CardEvaluation[];
  targetCount: number;
  actualCount: number;
}

/**
 * Deck statistics
 */
export interface DeckStatistics {
  totalCards: number;
  averageCMC: number;
  
  cardTypes: {
    creatures: number;
    instants: number;
    sorceries: number;
    enchantments: number;
    artifacts: number;
    planeswalkers: number;
    lands: number;
    other: number;
  };
  
  manaSources: {
    lands: number;
    rocks: number;
    dorks: number;
    other: number;
  };
}

/**
 * Mana curve data for visualization
 */
export interface ManaCurveData {
  curve: { cmc: number; count: number }[];
  averageCMC: number;
  highestCMC: number;
}

/**
 * Color identity analysis
 */
export interface ColorIdentityAnalysis {
  colors: string[];
  devotion: { [color: string]: number };
  colorBalance: 'balanced' | 'skewed' | 'mono';
}

/**
 * Base evaluator interface
 */
export interface Evaluator<T = EvaluationResult> {
  name: string;
  description: string;
  evaluate(cards: DeckCardData[], commanders: DeckCardData[]): T;
}

/**
 * Category evaluator interface
 */
export interface CategoryEvaluator extends Evaluator<CategoryEvaluation> {
  category: keyof DeckEvaluation['categories'];
  keywords: string[];
  cardPatterns: RegExp[];
}