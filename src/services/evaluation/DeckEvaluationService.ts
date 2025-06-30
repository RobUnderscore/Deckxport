import type { DeckCardData } from "@/components/DeckTable";
import type { 
  DeckEvaluation, 
  DeckStatistics, 
  ManaCurveData, 
  ColorIdentityAnalysis,
  CategoryEvaluator 
} from "./types";
import { RampEvaluator } from "./evaluators/RampEvaluator";
import { PlaceholderEvaluator } from "./evaluators/PlaceholderEvaluator";

export class DeckEvaluationService {
  private readonly evaluators: Map<string, CategoryEvaluator>;
  
  constructor() {
    this.evaluators = new Map();
    this.registerDefaultEvaluators();
  }
  
  private registerDefaultEvaluators() {
    // Register all evaluators here
    this.registerEvaluator(new RampEvaluator());
    
    // Register placeholder evaluators for now
    this.registerEvaluator(new PlaceholderEvaluator(
      "Card Draw",
      "Evaluates card advantage and draw engines",
      "cardDraw"
    ));
    this.registerEvaluator(new PlaceholderEvaluator(
      "Removal & Interaction",
      "Evaluates removal spells and interaction",
      "removal"
    ));
    this.registerEvaluator(new PlaceholderEvaluator(
      "Win Conditions",
      "Evaluates win conditions and finishers",
      "winConditions"
    ));
    this.registerEvaluator(new PlaceholderEvaluator(
      "Mana Base",
      "Evaluates lands and color fixing",
      "manaBase"
    ));
    this.registerEvaluator(new PlaceholderEvaluator(
      "Synergy & Theme",
      "Evaluates deck synergies and theme adherence",
      "synergy"
    ));
  }
  
  registerEvaluator(evaluator: CategoryEvaluator) {
    this.evaluators.set(evaluator.category, evaluator);
  }
  
  evaluateDeck(cards: DeckCardData[]): DeckEvaluation {
    const commanders = cards.filter(card => card.board === "commander");
    const mainboardCards = cards.filter(card => card.board === "mainboard");
    
    // Calculate statistics
    const statistics = this.calculateStatistics(mainboardCards);
    
    // Calculate mana curve
    const manaCurve = this.calculateManaCurve(mainboardCards);
    
    // Analyze color identity
    const colorIdentity = this.analyzeColorIdentity(mainboardCards, commanders);
    
    // Run all category evaluations
    const categories: any = {};
    let totalScore = 0;
    let evaluatorCount = 0;
    
    for (const [category, evaluator] of this.evaluators) {
      const evaluation = evaluator.evaluate(cards, commanders);
      categories[category] = evaluation;
      totalScore += evaluation.score;
      evaluatorCount++;
    }
    
    // Fill in placeholder evaluations for missing categories
    const allCategories = ['ramp', 'cardDraw', 'removal', 'winConditions', 'manaBase', 'synergy'];
    for (const category of allCategories) {
      if (!categories[category]) {
        categories[category] = {
          score: 50,
          rating: 'average',
          findings: [`${category} evaluation not yet implemented.`],
          suggestions: [],
          cards: [],
          targetCount: 0,
          actualCount: 0
        };
        totalScore += 50;
        evaluatorCount++;
      }
    }
    
    // Calculate overall score
    const overallScore = Math.round(totalScore / evaluatorCount);
    const overallRating = this.getOverallRating(overallScore);
    
    return {
      overallScore,
      overallRating,
      categories,
      statistics,
      manaCurve,
      colorIdentity
    };
  }
  
  private calculateStatistics(cards: DeckCardData[]): DeckStatistics {
    const stats: DeckStatistics = {
      totalCards: cards.length,
      averageCMC: 0,
      cardTypes: {
        creatures: 0,
        instants: 0,
        sorceries: 0,
        enchantments: 0,
        artifacts: 0,
        planeswalkers: 0,
        lands: 0,
        other: 0
      },
      manaSources: {
        lands: 0,
        rocks: 0,
        dorks: 0,
        other: 0
      }
    };
    
    let totalCMC = 0;
    let nonLandCount = 0;
    
    for (const card of cards) {
      const typeLine = card.type_line.toLowerCase();
      
      // Count card types
      if (typeLine.includes("creature")) {
        stats.cardTypes.creatures++;
      } else if (typeLine.includes("instant")) {
        stats.cardTypes.instants++;
      } else if (typeLine.includes("sorcery")) {
        stats.cardTypes.sorceries++;
      } else if (typeLine.includes("enchantment")) {
        stats.cardTypes.enchantments++;
      } else if (typeLine.includes("artifact")) {
        stats.cardTypes.artifacts++;
      } else if (typeLine.includes("planeswalker")) {
        stats.cardTypes.planeswalkers++;
      } else if (typeLine.includes("land")) {
        stats.cardTypes.lands++;
        stats.manaSources.lands++;
      } else {
        stats.cardTypes.other++;
      }
      
      // Calculate average CMC (excluding lands)
      if (!typeLine.includes("land")) {
        totalCMC += card.cmc || 0;
        nonLandCount++;
      }
      
      // Categorize mana sources
      const oracleText = (card.oracle_text || '').toLowerCase();
      if (typeLine.includes("artifact") && oracleText.includes("add")) {
        stats.manaSources.rocks++;
      } else if (typeLine.includes("creature") && oracleText.includes("add")) {
        stats.manaSources.dorks++;
      }
    }
    
    stats.averageCMC = nonLandCount > 0 ? Math.round((totalCMC / nonLandCount) * 100) / 100 : 0;
    
    return stats;
  }
  
  private calculateManaCurve(cards: DeckCardData[]): ManaCurveData {
    const curve: { [cmc: number]: number } = {};
    let totalCMC = 0;
    let nonLandCount = 0;
    let highestCMC = 0;
    
    for (const card of cards) {
      if (!card.type_line.toLowerCase().includes("land")) {
        const cmc = card.cmc || 0;
        curve[cmc] = (curve[cmc] || 0) + 1;
        totalCMC += cmc;
        nonLandCount++;
        highestCMC = Math.max(highestCMC, cmc);
      }
    }
    
    // Convert to array format
    const curveArray = [];
    for (let i = 0; i <= highestCMC; i++) {
      curveArray.push({ cmc: i, count: curve[i] || 0 });
    }
    
    return {
      curve: curveArray,
      averageCMC: nonLandCount > 0 ? totalCMC / nonLandCount : 0,
      highestCMC
    };
  }
  
  private analyzeColorIdentity(
    cards: DeckCardData[], 
    commanders: DeckCardData[]
  ): ColorIdentityAnalysis {
    const devotion: { [color: string]: number } = {
      W: 0, U: 0, B: 0, R: 0, G: 0
    };
    
    // Get commander color identity
    const commanderColors = new Set<string>();
    commanders.forEach(commander => {
      commander.color_identity?.forEach(color => commanderColors.add(color));
    });
    
    // Count color symbols in mana costs
    for (const card of cards) {
      const manaCost = card.mana_cost || '';
      const matches = manaCost.match(/\{([WUBRG])\}/g) || [];
      
      matches.forEach(match => {
        const color = match.replace(/[{}]/g, '');
        if (devotion.hasOwnProperty(color)) {
          devotion[color]++;
        }
      });
    }
    
    // Determine color balance
    const activeColors = Object.entries(devotion).filter(([_, count]) => count > 0);
    let colorBalance: ColorIdentityAnalysis['colorBalance'] = 'balanced';
    
    if (activeColors.length === 1) {
      colorBalance = 'mono';
    } else if (activeColors.length > 1) {
      const counts = activeColors.map(([_, count]) => count);
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      
      if (max > min * 2) {
        colorBalance = 'skewed';
      }
    }
    
    return {
      colors: Array.from(commanderColors),
      devotion,
      colorBalance
    };
  }
  
  private getOverallRating(score: number): DeckEvaluation['overallRating'] {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    if (score >= 30) return 'below-average';
    return 'poor';
  }
}