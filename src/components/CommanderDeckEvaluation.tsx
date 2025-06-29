import type { DeckCardData } from "@/components/DeckTable";
import { useDeckEvaluation } from "@/hooks/useDeckEvaluation";
import { CategoryEvaluationCard } from "@/components/evaluation/CategoryEvaluationCard";
import { Shield, Zap, Swords, Target, Gem, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommanderDeckEvaluationProps {
  cards: DeckCardData[];
  deckName?: string;
  oracleTagError?: string | null;
}

export function CommanderDeckEvaluation({ cards, oracleTagError }: CommanderDeckEvaluationProps) {
  // Filter commanders from the deck
  const commanders = cards.filter(card => card.board === "commander");
  
  // Get deck evaluation
  const evaluation = useDeckEvaluation(cards);
  
  return (
    <div className="space-y-6">
      {/* Oracle Tag Warning */}
      {oracleTagError && (
        <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4">
          <p className="text-yellow-100 font-medium">⚠️ Oracle Tag Warning</p>
          <p className="text-yellow-200/80 text-sm mt-1">
            Oracle tags could not be retrieved from Scryfall. The evaluation below is based on text analysis only and may be less accurate.
          </p>
        </div>
      )}
      
      {/* Commander Info */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-2xl font-bold mb-4">Commander Analysis</h2>
        {commanders.length > 0 ? (
          <div className="space-y-4">
            {commanders.map((commander, index) => (
              <div key={index} className="flex items-start gap-4">
                {commander.image_uris?.small && (
                  <img 
                    src={commander.image_uris.small} 
                    alt={commander.name}
                    className="w-24 h-32 rounded-md object-cover"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">{commander.name}</h3>
                  <p className="text-muted-foreground">{commander.type_line}</p>
                  <p className="text-sm mt-2">{commander.oracle_text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No commanders found in this deck.</p>
        )}
      </div>

      {/* Deck Statistics */}
      {evaluation && (
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-bold mb-4">Deck Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{evaluation.statistics.totalCards}</p>
              <p className="text-sm text-muted-foreground">Total Cards</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{evaluation.statistics.averageCMC}</p>
              <p className="text-sm text-muted-foreground">Avg CMC</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{evaluation.statistics.cardTypes.lands}</p>
              <p className="text-sm text-muted-foreground">Lands</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{evaluation.colorIdentity.colors.join("/")}</p>
              <p className="text-sm text-muted-foreground">Colors</p>
            </div>
          </div>
          
          {/* Card type breakdown */}
          <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creatures:</span>
              <span>{evaluation.statistics.cardTypes.creatures}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Instants:</span>
              <span>{evaluation.statistics.cardTypes.instants}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sorceries:</span>
              <span>{evaluation.statistics.cardTypes.sorceries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Enchantments:</span>
              <span>{evaluation.statistics.cardTypes.enchantments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Artifacts:</span>
              <span>{evaluation.statistics.cardTypes.artifacts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Planeswalkers:</span>
              <span>{evaluation.statistics.cardTypes.planeswalkers}</span>
            </div>
          </div>
        </div>
      )}

      {/* Overall Score */}
      {evaluation && (
        <div className="bg-card rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Overall Deck Score</h2>
            <div className="text-right">
              <p className={cn(
                "text-4xl font-bold",
                evaluation.overallScore >= 80 ? 'text-green-400' :
                evaluation.overallScore >= 60 ? 'text-blue-400' :
                evaluation.overallScore >= 40 ? 'text-yellow-400' :
                'text-red-400'
              )}>
                {evaluation.overallScore}/100
              </p>
              <p className={cn(
                "text-sm capitalize px-3 py-1 rounded-full mt-1",
                evaluation.overallRating === 'excellent' ? 'bg-green-400/20 text-green-400' :
                evaluation.overallRating === 'good' ? 'bg-blue-400/20 text-blue-400' :
                evaluation.overallRating === 'average' ? 'bg-yellow-400/20 text-yellow-400' :
                evaluation.overallRating === 'below-average' ? 'bg-orange-400/20 text-orange-400' :
                'bg-red-400/20 text-red-400'
              )}>
                {evaluation.overallRating}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Category Evaluations */}
      {evaluation && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Category Analysis</h2>
          
          <CategoryEvaluationCard
            title="Ramp Package"
            icon={<Zap className="h-5 w-5" />}
            evaluation={evaluation.categories.ramp}
          />
          
          <CategoryEvaluationCard
            title="Card Draw"
            icon={<Layers className="h-5 w-5" />}
            evaluation={evaluation.categories.cardDraw}
          />
          
          <CategoryEvaluationCard
            title="Removal & Interaction"
            icon={<Swords className="h-5 w-5" />}
            evaluation={evaluation.categories.removal}
          />
          
          <CategoryEvaluationCard
            title="Win Conditions"
            icon={<Target className="h-5 w-5" />}
            evaluation={evaluation.categories.winConditions}
          />
          
          <CategoryEvaluationCard
            title="Mana Base"
            icon={<Gem className="h-5 w-5" />}
            evaluation={evaluation.categories.manaBase}
          />
          
          <CategoryEvaluationCard
            title="Synergy & Theme"
            icon={<Shield className="h-5 w-5" />}
            evaluation={evaluation.categories.synergy}
          />
        </div>
      )}

    </div>
  );
}