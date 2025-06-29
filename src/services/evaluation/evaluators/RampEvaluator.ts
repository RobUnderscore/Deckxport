import { BaseCategoryEvaluator } from "../BaseEvaluator";
import type { DeckCardData } from "@/components/DeckTable";
import type { CardEvaluation } from "../types";

export class RampEvaluator extends BaseCategoryEvaluator {
  name = "Ramp";
  description = "Evaluates mana acceleration and resource development";
  category = "ramp" as const;
  
  // Note: Scryfall has oracle tags that could help:
  // - oracletag:ramp (2,075+ cards)
  // - oracletag:mana-ramp (2,077+ cards)  
  // - oracletag:mana-rock (358+ cards)
  // - oracletag:mana-dork (381+ cards)
  // However, these aren't included in the standard API response
  // so we rely on our own detection logic
  
  keywords = [
    // Mana rocks - specific names only
    "sol ring", "arcane signet", "signet", "talisman of",
    "commander's sphere", "fellwar stone", "thought vessel", 
    "mind stone", "chromatic lantern", "coalition relic",
    "thran dynamo", "gilded lotus", "mana vault", "mana crypt",
    // Land ramp - more specific
    "search your library for", "onto the battlefield",
    "put a land", "put two basic land",
    // Mana dorks - specific patterns
    "birds of paradise", "llanowar elves", "elvish mystic",
    "avacyn's pilgrim", "noble hierarch",
    // Cost reduction
    "costs less to cast",
    "reduce", "mana cost",
    // Treasure/Gold
    "treasure token", "gold token",
    // Ritual effects
    "ritual", "until end of turn"
  ];
  
  cardPatterns = [
    // Land fetch patterns - must put land onto battlefield
    /search your library for .* land.* onto the battlefield/i,
    /search your library for .* land.* put (it|them) onto the battlefield/i,
    /put a.* land.* onto the battlefield/i,
    // Mana production patterns - more specific
    /\{T\}:\s*add \{[WUBRG\d]+\}/i,
    /add \{[WUBRG\d]+\} to your mana pool/i,
    /add.{0,10}mana of any/i,
    // Cost reduction patterns
    /spells?.{0,20}cost.{0,10}\{\d\}.{0,10}less/i,
    /costs?.{0,10}\{\d\}.{0,10}less to cast/i,
    // Treasure patterns
    /create.{0,20}treasure token/i,
    // Ritual patterns - temporary mana
    /add.{0,30}until end of turn/i,
    // Land untapping for mana
    /whenever.{0,30}untap all lands/i,
    /untap.{0,10}lands you control/i
  ];
  
  protected getTargetCount(totalCards: number): number {
    // EDH/Commander consensus based on research:
    // - Minimum: 7 ramp pieces
    // - Standard: 8-10 ramp pieces (most common recommendation)
    // - High ramp strategies: 12-15 pieces
    // For 99-card deck: target 10 ramp pieces
    if (totalCards >= 95) return 10;
    if (totalCards >= 80) return 9;
    if (totalCards >= 60) return 8;
    return 7;
  }
  
  protected evaluateCards(
    cards: DeckCardData[], 
    _commanders: DeckCardData[]
  ): CardEvaluation[] {
    const rampCards: CardEvaluation[] = [];
    
    for (const card of cards) {
      // Skip basic lands - they're mana base, not ramp
      if (this.isBasicLand(card)) {
        continue;
      }
      
      if (this.matchesCategory(card)) {
        const evaluation: CardEvaluation = {
          card,
          category: "Ramp",
          reasoning: this.categorizeRamp(card),
          importance: this.calculateRampImportance(card)
        };
        rampCards.push(evaluation);
      }
    }
    
    return rampCards;
  }
  
  /**
   * Override base class method for more accurate ramp detection
   */
  protected matchesCategory(card: DeckCardData): boolean {
    const name = card.name.toLowerCase();
    
    // Exclude common false positives first
    if (this.isExcludedCard(card)) {
      return false;
    }
    
    // Check oracle tags first if available (most accurate)
    if (card.oracle_tags && card.oracle_tags.length > 0) {
      const rampTags = ['ramp', 'mana-ramp', 'mana-rock', 'mana-dork', 
                        'mana-dork-egg', 'land-ramp', 'ritual', 
                        'cost-reduction', 'adds-multiple-mana'];
      
      if (card.oracle_tags.some(tag => rampTags.includes(tag))) {
        return true;
      }
      
      // If the card has oracle tags but none are ramp-related,
      // we can be confident it's not ramp
      return false;
    }
    
    // Fallback to name-based detection if no oracle tags
    if (this.isKnownRampCard(name)) {
      return true;
    }
    
    // Finally check patterns
    return super.matchesCategory(card);
  }
  
  private isExcludedCard(card: DeckCardData): boolean {
    const name = card.name.toLowerCase();
    const text = (card.oracle_text || '').toLowerCase();
    const typeLine = card.type_line.toLowerCase();
    
    // Exclude removal spells
    if (name.includes("path to exile") || name.includes("beast within") ||
        name.includes("generous gift") || name.includes("pongify") ||
        name.includes("rapid hybridization") || name.includes("swan song") ||
        name.includes("krosan grip")) {
      return true;
    }
    
    // Exclude card draw engines
    if (name.includes("howling mine") || name.includes("font of mythos") ||
        name.includes("sylvan library") || name.includes("guardian project") ||
        name.includes("mulldrifter") || name.includes("sea gate oracle")) {
      return true;
    }
    
    // Exclude flicker effects
    if (name.includes("momentary blink") || name.includes("ghostly flicker") ||
        name.includes("thassa, deep-dwelling")) {
      return true;
    }
    
    // Exclude lands that don't ramp (fixing only)
    if (typeLine.includes("land") && !typeLine.includes("creature")) {
      // Check if it's just a fixing land
      if (!text.includes("add") || 
          name.includes("temple of") || name.includes("command tower") ||
          name.includes("exotic orchard") || name.includes("reflecting pool") ||
          name.includes("reliquary tower") || name.includes("citadel") ||
          name.includes("palace") || name.includes("grove") ||
          (text.match(/add \{[WUBRG]\}/g) || []).length <= 1) {
        // Exception for lands that produce more than 1 mana
        if (!name.includes("ancient tomb") && !name.includes("temple of the false god") &&
            !name.includes("myriad landscape") && !name.includes("arixmethes")) {
          return true;
        }
      }
    }
    
    // Exclude utility creatures that happen to have "land" in text
    if (name.includes("acidic slime") || name.includes("satyr wayfinder") ||
        name.includes("tatyova") || name.includes("dream trawler")) {
      return true;
    }
    
    // Exclude win conditions and big threats
    if (name.includes("torment of hailfire") || name.includes("craterhoof behemoth") ||
        name.includes("finale of devastation") || name.includes("rishkar's expertise")) {
      return true;
    }
    
    // Exclude utility spells
    if (name.includes("capsize") || name.includes("life from the loam")) {
      return true;
    }
    
    return false;
  }
  
  private isKnownRampCard(name: string): boolean {
    const knownRampCards = [
      // Land ramp spells
      "cultivate", "kodama's reach", "rampant growth", "farseek",
      "nature's lore", "three visits", "skyshroud claim", "explosive vegetation",
      "circuitous route", "migration path", "search for tomorrow",
      // Mana rocks
      "sol ring", "arcane signet", "fellwar stone", "thought vessel",
      "mind stone", "commander's sphere", "chromatic lantern",
      "thran dynamo", "gilded lotus", "mana vault", "mana crypt",
      // Signets and Talismans
      "signet", "talisman of",
      // Mana dorks
      "birds of paradise", "llanowar elves", "elvish mystic", "fyndhorn elves",
      "avacyn's pilgrim", "noble hierarch", "bloom tender", "priest of titania",
      // Land ramp creatures
      "wood elves", "farhaven elf", "sakura-tribe elder", "solemn simulacrum",
      "burnished hart", "coiling oracle",
      // Special lands that ramp
      "ancient tomb", "myriad landscape", "temple of the false god",
      // Fetch lands (deck thinning)
      "evolving wilds", "terramorphic expanse",
      // Other ramp effects
      "wilderness reclamation", "crucible of worlds", "exploration", "burgeoning",
      "arixmethes, slumbering isle", "boseiju, who endures",
      // Rituals (temporary ramp)
      "dark ritual", "cabal ritual", "pyretic ritual", "desperate ritual",
      "seething song", "rite of flame", "simian spirit guide"
    ];
    
    return knownRampCards.some(rampCard => name.includes(rampCard));
  }
  
  private isBasicLand(card: DeckCardData): boolean {
    const typeLine = card.type_line.toLowerCase();
    
    // Check if it's a basic land type
    // Note: Basic lands have "Basic Land" in their type line
    // and also include their land type (Plains, Island, etc.)
    return typeLine.includes('basic land') || 
           (typeLine.includes('basic') && typeLine.includes('land'));
  }
  
  private categorizeRamp(card: DeckCardData): string {
    const text = (card.oracle_text || '').toLowerCase();
    const name = card.name.toLowerCase();
    const typeLine = card.type_line.toLowerCase();
    
    // Use oracle tags for categorization if available
    if (card.oracle_tags && card.oracle_tags.length > 0) {
      // Check for specific oracle tag patterns
      if (card.oracle_tags.includes('mana-dork') || card.oracle_tags.includes('mana-dork-egg')) {
        return "Mana dork (vulnerable)";
      }
      if (card.oracle_tags.includes('mana-rock')) {
        if (card.cmc === 0 || card.cmc === 1) {
          return "Fast mana (0-1 CMC)";
        } else if (card.cmc === 2) {
          return "2 CMC rock (efficient)";
        } else {
          return "3+ CMC rock (slower)";
        }
      }
      if (card.oracle_tags.includes('land-ramp')) {
        return "Land ramp (resilient)";
      }
      if (card.oracle_tags.includes('ritual')) {
        return "Ritual (temporary)";
      }
      if (card.oracle_tags.includes('cost-reduction')) {
        return "Cost reduction";
      }
      if (card.oracle_tags.includes('adds-multiple-mana')) {
        return "Multi-mana source";
      }
    }
    
    // Fallback to text-based categorization
    // Premium fast mana (0-1 CMC)
    if (name.includes("mana crypt") || name.includes("chrome mox") || 
        name.includes("mox diamond") || name.includes("lotus petal")) {
      return "Fast mana (0-1 CMC)";
    }
    
    // Sol Ring gets its own category due to ubiquity
    if (name.includes("sol ring")) {
      return "Sol Ring (staple)";
    }
    
    // Mana dorks (creatures that produce mana)
    if (typeLine.includes("creature") && 
        (text.includes("{t}: add") || text.includes("tap: add") || 
         name.includes("birds of paradise") || name.includes("llanowar elves"))) {
      return "Mana dork (vulnerable)";
    }
    
    // Land ramp (most resilient)
    if ((text.includes("search your library") && text.includes("land")) ||
        (text.includes("put") && text.includes("land") && text.includes("battlefield"))) {
      return "Land ramp (resilient)";
    }
    
    // 2 CMC rocks (efficient)
    if (typeLine.includes("artifact") && card.cmc === 2) {
      return "2 CMC rock (efficient)";
    }
    
    // Ritual effects (temporary)
    if (text.includes("until end of turn") || name.includes("ritual")) {
      return "Ritual (temporary)";
    }
    
    // Treasure/Gold generation
    if (text.includes("treasure") || text.includes("gold")) {
      return "Treasure/Gold generation";
    }
    
    // Cost reduction
    if (text.includes("cost") && (text.includes("less") || text.includes("reduce"))) {
      return "Cost reduction";
    }
    
    // Land untappers (can be very powerful)
    if (text.includes("untap") && text.includes("land")) {
      return "Land untapper";
    }
    
    // Higher CMC rocks
    if (typeLine.includes("artifact") && card.cmc >= 3) {
      return "3+ CMC rock (slower)";
    }
    
    // Special lands that ramp
    if (typeLine.includes("land") && (text.includes("add") || text.includes("mana"))) {
      return "Ramp land";
    }
    
    return "Other mana acceleration";
  }
  
  private calculateRampImportance(card: DeckCardData): CardEvaluation['importance'] {
    const cmc = card.cmc || 0;
    const text = (card.oracle_text || '').toLowerCase();
    const name = card.name.toLowerCase();
    const typeLine = card.type_line.toLowerCase();
    
    // Fast mana (0-1 CMC) is always high importance
    if (cmc <= 1 && !text.includes("ritual")) {
      return 'high';
    }
    
    // Sol Ring is the most important ramp piece
    if (name.includes("sol ring")) {
      return 'high';
    }
    
    // Efficient 2 CMC rocks that produce any color or multiple mana
    if (cmc === 2 && typeLine.includes("artifact") && 
        (text.includes("any color") || text.includes("two mana") || 
         name.includes("arcane signet") || name.includes("fellwar stone"))) {
      return 'high';
    }
    
    // Land ramp at 2-3 CMC (very resilient)
    if (cmc <= 3 && text.includes("search your library") && text.includes("land")) {
      return 'high';
    }
    
    // Efficient mana dorks (1-2 CMC)
    if (cmc <= 2 && typeLine.includes("creature") && text.includes("add")) {
      return 'medium'; // Vulnerable to removal
    }
    
    // 3 CMC rocks that provide additional value
    if (cmc === 3 && typeLine.includes("artifact") && 
        (text.includes("draw") || text.includes("scry") || text.includes("untap"))) {
      return 'medium';
    }
    
    // Higher CMC ramp that provides significant advantage
    if (cmc >= 4 && (text.includes("double") || text.includes("triple") || 
                     text.includes("any number of lands"))) {
      return 'medium';
    }
    
    // Rituals are low importance (one-time use)
    if (text.includes("until end of turn") || name.includes("ritual")) {
      return 'low';
    }
    
    // Everything else at 4+ CMC
    if (cmc >= 4) {
      return 'low';
    }
    
    return 'medium';
  }
  
  protected generateSuggestions(
    cards: CardEvaluation[],
    targetCount: number,
    commanders: DeckCardData[],
    allCards: DeckCardData[]
  ): string[] {
    const suggestions: string[] = [];
    const actualCount = cards.length;
    const deficit = targetCount - actualCount;
    
    // Analyze deck composition
    const basicLandCount = this.countBasicLands(allCards);
    const rampByType = this.analyzeRampComposition(cards);
    const avgCMC = this.calculateAverageRampCMC(cards);
    
    // Check for staples
    const hasRing = cards.some(c => c.card.name.toLowerCase().includes("sol ring"));
    const hasSignet = cards.some(c => c.card.name.toLowerCase().includes("arcane signet"));
    
    // === POSITIVE FEEDBACK ===
    
    // Ramp count check
    if (actualCount >= targetCount && actualCount <= targetCount * 1.3) {
      suggestions.push(`✅ Good ramp count (${actualCount}/${targetCount}). Well-balanced for most strategies.`);
    } else if (actualCount >= targetCount * 1.3 && actualCount < targetCount * 1.5) {
      suggestions.push(`✅ Above-average ramp count (${actualCount}). Good for ramp-focused strategies.`);
    }
    
    // Staples check
    if (hasRing) {
      suggestions.push("✅ Sol Ring included - essential Commander staple.");
    }
    if (hasSignet && commanders.length > 0) {
      suggestions.push("✅ Arcane Signet included - excellent color fixing.");
    }
    
    // CMC curve check
    if (avgCMC <= 2.5 && actualCount >= 8) {
      suggestions.push(`✅ Excellent ramp curve (avg ${avgCMC.toFixed(1)} CMC) - fast and efficient.`);
    } else if (avgCMC <= 3.0 && actualCount >= 8) {
      suggestions.push(`✅ Good ramp curve (avg ${avgCMC.toFixed(1)} CMC).`);
    }
    
    // Type diversity check
    const hasGoodDiversity = rampByType.artifacts <= actualCount * 0.6 && 
                            rampByType.creatures <= actualCount * 0.4 && 
                            rampByType.landRamp >= 2;
    if (hasGoodDiversity && actualCount >= 8) {
      suggestions.push("✅ Well-diversified ramp package - resilient to various removal.");
    }
    
    // Low CMC ramp check
    const lowCMCRamp = cards.filter(c => (c.card.cmc || 0) <= 2).length;
    const targetLowCMC = Math.max(3, Math.floor(actualCount * 0.4));
    if (lowCMCRamp >= targetLowCMC) {
      suggestions.push(`✅ Strong early game ramp (${lowCMCRamp} pieces at 1-2 CMC).`);
    }
    
    // Quality check
    const highQuality = cards.filter(c => c.importance === 'high').length;
    if (actualCount >= 8 && highQuality >= actualCount * 0.5) {
      suggestions.push(`✅ High-quality ramp package (${highQuality}/${actualCount} premium pieces).`);
    }
    
    // Basic land synergy check for fetch spells
    const basicFetchSpells = cards.filter(c => 
      c.reasoning.includes("Land ramp") && 
      (c.card.oracle_text || '').toLowerCase().includes("basic")).length;
    
    if (basicFetchSpells > 0) {
      // Research shows: 2-3 of each basic type minimum
      // For consistent fetching: 10-15+ basics recommended
      const minBasicsForFetch = Math.max(10, Math.min(15, basicFetchSpells * 2));
      
      if (basicLandCount >= 15) {
        suggestions.push(`✅ Excellent basic land count (${basicLandCount}) for ${basicFetchSpells} basic fetch spells.`);
      } else if (basicLandCount >= minBasicsForFetch) {
        suggestions.push(`✅ Good basic land count (${basicLandCount}) for ${basicFetchSpells} basic fetch spells.`);
      }
    }
    
    // === AREAS FOR IMPROVEMENT ===
    
    // Too little ramp
    if (deficit > 0) {
      suggestions.push(`⚠️ Add ${deficit} more ramp pieces. Target: ${targetCount} (standard is 8-10).`);
      
      if (!hasRing) {
        suggestions.push("❌ Sol Ring is missing - include this Commander staple.");
      }
      
      if (!hasSignet && commanders.length > 0) {
        suggestions.push("⚠️ Consider Arcane Signet for reliable color fixing.");
      }
    }
    
    // Too much ramp
    else if (actualCount >= targetCount * 1.5) {
      suggestions.push(`⚠️ Very high ramp count (${actualCount} pieces, ${Math.round(actualCount/targetCount*100)}% of target). Ensure you have enough payoffs and threats.`);
    }
    
    // Ramp curve issues
    if (avgCMC > 3.0) {
      suggestions.push(`⚠️ High average ramp CMC (${avgCMC.toFixed(1)}) - add more 1-2 CMC options for faster starts.`);
    }
    
    // Type balance issues
    if (rampByType.artifacts > actualCount * 0.7) {
      suggestions.push("⚠️ Heavy artifact ramp (vulnerable to Vandalblast/Bane of Progress). Diversify with land ramp.");
    }
    
    if (rampByType.creatures > actualCount * 0.5) {
      suggestions.push("⚠️ Many mana dorks (vulnerable to board wipes). Balance with artifacts/land ramp.");
    }
    
    if (rampByType.landRamp < 2 && actualCount >= 8) {
      suggestions.push("⚠️ Low land ramp count. Land ramp is most resilient to removal.");
    }
    
    // CMC distribution issues
    if (lowCMCRamp < targetLowCMC && actualCount >= 8) {
      suggestions.push(`⚠️ Need more 1-2 CMC ramp (have ${lowCMCRamp}, want ${targetLowCMC}+) for consistent early game.`);
    }
    
    // Quality issues
    if (actualCount >= 10 && highQuality < actualCount * 0.3) {
      suggestions.push("⚠️ Consider upgrading to more efficient ramp (Talismans, Signets, Nature's Lore, etc).");
    }
    
    // Ritual warning
    if (rampByType.rituals > 2) {
      suggestions.push("⚠️ Multiple rituals detected - these provide temporary mana. Ensure permanent ramp too.");
    }
    
    // Basic land synergy issues  
    if (basicFetchSpells > 0) {
      const minBasicsForFetch = Math.max(10, Math.min(15, basicFetchSpells * 2));
      
      if (basicLandCount < 10) {
        suggestions.push(`❌ Very low basic count (${basicLandCount}) for ${basicFetchSpells} fetch spells. Need 10+ basics minimum.`);
      } else if (basicLandCount < minBasicsForFetch) {
        suggestions.push(`⚠️ Low basic count (${basicLandCount}) for ${basicFetchSpells} fetch spells. Consider ${minBasicsForFetch}+ for consistency.`);
      }
      
      // Check basics per color
      if (commanders.length > 0) {
        const colorCount = new Set(commanders.flatMap(c => c.color_identity || [])).size;
        const basicsPerColor = Math.floor(basicLandCount / Math.max(1, colorCount));
        if (basicsPerColor < 2) {
          suggestions.push(`❌ Only ${basicsPerColor} basics per color average. Need 2-3 of each for reliable fetching.`);
        }
      }
    }
    
    // Additional warnings for heavy fetch strategies
    if (basicFetchSpells >= 5 && basicLandCount < 15) {
      suggestions.push(`⚠️ Heavy reliance on basic fetch (${basicFetchSpells} spells) but only ${basicLandCount} basics. Risk of dead draws late game.`);
    }
    
    // Non-basic fetch spell check (Farseek, Nature's Lore for duals)
    const nonBasicFetchCount = cards.filter(c => 
      c.reasoning.includes("Land ramp") && 
      !(c.card.oracle_text || '').toLowerCase().includes("basic")).length;
    
    if (nonBasicFetchCount > 0 && rampByType.landRamp > 5) {
      suggestions.push(`💡 ${nonBasicFetchCount} non-basic fetch spells detected. Consider shock/dual lands with basic types.`);
    }
    
    // === RECOMMENDATIONS ===
    
    if (suggestions.filter(s => s.startsWith("⚠️") || s.startsWith("❌")).length === 0 && 
        suggestions.filter(s => s.startsWith("✅")).length >= 3) {
      suggestions.push("💫 Your ramp package is well-optimized! Consider your local meta for fine-tuning.");
    }
    
    return suggestions;
  }
  
  private analyzeRampComposition(cards: CardEvaluation[]): {
    artifacts: number;
    creatures: number;
    landRamp: number;
    rituals: number;
    other: number;
  } {
    const composition = {
      artifacts: 0,
      creatures: 0,
      landRamp: 0,
      rituals: 0,
      other: 0
    };
    
    cards.forEach(({ card, reasoning }) => {
      const typeLine = card.type_line.toLowerCase();
      if (reasoning.includes("Land ramp") || reasoning.includes("Land fetch")) {
        composition.landRamp++;
      } else if (reasoning.includes("Ritual")) {
        composition.rituals++;
      } else if (typeLine.includes("creature")) {
        composition.creatures++;
      } else if (typeLine.includes("artifact")) {
        composition.artifacts++;
      } else {
        composition.other++;
      }
    });
    
    return composition;
  }
  
  private calculateAverageRampCMC(cards: CardEvaluation[]): number {
    const rampWithCMC = cards.filter(c => c.card.cmc !== undefined && c.card.cmc !== null);
    if (rampWithCMC.length === 0) return 0;
    
    const totalCMC = rampWithCMC.reduce((sum, c) => sum + (c.card.cmc || 0), 0);
    return totalCMC / rampWithCMC.length;
  }
  
  private countBasicLands(allCards: DeckCardData[]): number {
    const basicLands = allCards.filter(card => this.isBasicLand(card));
    
    // Sum up the quantities of all basic lands
    const totalBasicLands = basicLands.reduce((sum, card) => {
      return sum + (card.quantity || 1);
    }, 0);
    
    return totalBasicLands;
  }
}