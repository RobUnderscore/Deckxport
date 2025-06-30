import type { CardAggregate } from "@/types/cardAggregate";
import { useDeckEvaluationAggregate } from "@/hooks/useDeckEvaluationAggregate";
import { CategoryEvaluationCard } from "@/components/evaluation/CategoryEvaluationCardSimple";
import { Shield, Zap, Swords, Target, Gem, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { DualFacedCardPreview, DualFacedIndicator, getCombinedOracleText, getDualFacedDisplayImage } from "@/components/ui/dual-faced-card";

interface CommanderDeckEvaluationProps {
  cards: CardAggregate[];
  deckName?: string;
}

export function CommanderDeckEvaluation({ cards }: CommanderDeckEvaluationProps) {
  // Filter commanders from the deck
  const commanders = cards.filter(card => card.board === "commander");
  
  // Get deck evaluation
  const evaluation = useDeckEvaluationAggregate(cards);
  
  // Check for oracle tag coverage
  const totalCards = cards.length;
  const cardsWithTags = cards.filter(c => c.oracleTags.length > 0).length;
  const tagCoverage = totalCards > 0 ? (cardsWithTags / totalCards) * 100 : 0;
  
  return (
    <div className="space-y-6">
      {/* Oracle Tag Coverage */}
      {tagCoverage < 80 && (
        <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4">
          <p className="text-yellow-100 font-medium">⚠️ Limited Oracle Tag Coverage</p>
          <p className="text-yellow-200/80 text-sm mt-1">
            Only {cardsWithTags} of {totalCards} cards ({tagCoverage.toFixed(0)}%) have oracle tags. 
            Evaluation accuracy may be reduced for cards without tags.
          </p>
        </div>
      )}
      
      {/* Commander Info */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-2xl font-bold mb-4">Commander Analysis</h2>
        {commanders.length > 0 ? (
          <div className="space-y-4">
            {commanders.map((commander, index) => {
              const imageUrl = getDualFacedDisplayImage(commander);
              const oracleText = getCombinedOracleText(commander);
              const isDualFaced = commander.cardFaces && commander.cardFaces.length > 1;
              
              return (
                <div key={index} className="flex items-start gap-4">
                  {imageUrl && (
                    isDualFaced ? (
                      <DualFacedCardPreview card={commander}>
                        <img 
                          src={imageUrl} 
                          alt={commander.name}
                          className="w-24 h-32 rounded-md object-cover cursor-pointer"
                        />
                      </DualFacedCardPreview>
                    ) : (
                      <img 
                        src={imageUrl} 
                        alt={commander.name}
                        className="w-24 h-32 rounded-md object-cover"
                      />
                    )
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{commander.name}</h3>
                      {isDualFaced && <DualFacedIndicator card={commander} />}
                    </div>
                    <p className="text-muted-foreground">{commander.typeLine}</p>
                    <p className="text-sm mt-2 whitespace-pre-line">{oracleText}</p>
                    {commander.oracleTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {commander.oracleTags.map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">No commander found in this deck</p>
        )}
      </div>

      {/* Evaluation Categories */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Deck Evaluation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CategoryEvaluationCard
            icon={Gem}
            title="Ramp"
            rating={evaluation.ramp.rating}
            count={evaluation.ramp.count}
            cards={evaluation.ramp.cards}
            description="Mana acceleration and resource generation"
            accentColor="emerald"
          />
          
          <CategoryEvaluationCard
            icon={Shield}
            title="Interaction"
            rating={evaluation.interaction.rating}
            count={evaluation.interaction.count}
            cards={evaluation.interaction.cards}
            description="Removal, counters, and protection"
            accentColor="blue"
          />
          
          <CategoryEvaluationCard
            icon={Zap}
            title="Card Advantage"
            rating={evaluation.cardAdvantage.rating}
            count={evaluation.cardAdvantage.count}
            cards={evaluation.cardAdvantage.cards}
            description="Card draw and selection"
            accentColor="purple"
          />
          
          <CategoryEvaluationCard
            icon={Swords}
            title="Win Conditions"
            rating={evaluation.winConditions.rating}
            count={evaluation.winConditions.count}
            cards={evaluation.winConditions.cards}
            description="Ways to close out the game"
            accentColor="red"
          />
          
          <CategoryEvaluationCard
            icon={Target}
            title="Targeted Removal"
            rating={evaluation.targetedRemoval.rating}
            count={evaluation.targetedRemoval.count}
            cards={evaluation.targetedRemoval.cards}
            description="Single target removal spells"
            accentColor="orange"
          />
          
          <CategoryEvaluationCard
            icon={Layers}
            title="Board Wipes"
            rating={evaluation.boardWipes.rating}
            count={evaluation.boardWipes.count}
            cards={evaluation.boardWipes.cards}
            description="Mass removal effects"
            accentColor="pink"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4">Overall Assessment</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Cards</p>
            <p className="text-2xl font-bold">{evaluation.totalCards}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average CMC</p>
            <p className="text-2xl font-bold">{evaluation.averageCMC.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mana Sources</p>
            <p className="text-2xl font-bold">{evaluation.manaSources}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overall Rating</p>
            <p className={cn(
              "text-2xl font-bold",
              evaluation.overallRating >= 8 ? "text-green-500" :
              evaluation.overallRating >= 6 ? "text-yellow-500" :
              "text-red-500"
            )}>
              {evaluation.overallRating.toFixed(1)}/10
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          {evaluation.suggestions.map((suggestion, index) => (
            <p key={index} className="text-sm">
              • {suggestion}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}