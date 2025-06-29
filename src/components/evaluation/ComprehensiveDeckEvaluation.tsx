import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Zap,
  Shield,
  Swords,
  Crown,
  Target,
  Bomb,
  Link,
  Sparkles,
  Clock,
  Search,
  RotateCcw,
  Skull
} from 'lucide-react';
import type { CardAggregate } from '@/types/cardAggregate';
import type { DeckEvaluation } from '@/services/evaluation/advancedEvaluation';
import { generateDeckEvaluation } from '@/services/evaluation/advancedEvaluation';

interface ComprehensiveDeckEvaluationProps {
  cards: CardAggregate[];
  deckName?: string;
}

// Icons for each category
const CATEGORY_ICONS = {
  ramp: Zap,
  cardAdvantage: TrendingUp,
  interaction: Shield,
  winConditions: Crown,
  targetedRemoval: Target,
  boardWipes: Bomb,
  synergy: Link,
  cardQuality: Sparkles,
  tempo: Clock,
  cardSelection: Search,
  recursion: RotateCcw,
  sacrificeOutlets: Skull,
};

// Rating color mapping
function getRatingColor(rating: number): string {
  if (rating >= 8) return 'text-green-500';
  if (rating >= 6) return 'text-yellow-500';
  if (rating >= 4) return 'text-orange-500';
  return 'text-red-500';
}

function getRatingBgColor(rating: number): string {
  if (rating >= 8) return 'bg-green-500/20';
  if (rating >= 6) return 'bg-yellow-500/20';
  if (rating >= 4) return 'bg-orange-500/20';
  return 'bg-red-500/20';
}

export function ComprehensiveDeckEvaluation({ cards, deckName }: ComprehensiveDeckEvaluationProps) {
  const [evaluation, setEvaluation] = useState<DeckEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function evaluate() {
      setLoading(true);
      try {
        const evaluation = await generateDeckEvaluation(cards);
        setEvaluation(evaluation);
      } catch (error) {
        console.error('Failed to evaluate deck:', error);
      } finally {
        setLoading(false);
      }
    }
    
    evaluate();
  }, [cards]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Analyzing deck...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Unable to evaluate deck</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating Card */}
      <Card>
        <CardHeader>
          <CardTitle>{deckName ? `${deckName} Evaluation` : 'Deck Evaluation'}</CardTitle>
          <CardDescription>
            Comprehensive analysis based on oracle tags and card interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold">Overall Rating</h3>
              <p className="text-sm text-muted-foreground">
                Based on {Object.keys(evaluation.categories).length} evaluation criteria
              </p>
            </div>
            <div className={`text-5xl font-bold ${getRatingColor(evaluation.overallRating)}`}>
              {evaluation.overallRating}/10
            </div>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Strengths
              </h4>
              {evaluation.strengths.length > 0 ? (
                <ul className="space-y-1">
                  {evaluation.strengths.map((strength, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="h-3 w-3 text-green-500" />
                      <span className="capitalize">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No standout strengths</p>
              )}
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Weaknesses
              </h4>
              {evaluation.weaknesses.length > 0 ? (
                <ul className="space-y-1">
                  {evaluation.weaknesses.map((weakness, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="h-3 w-3 text-red-500" />
                      <span className="capitalize">{weakness}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No major weaknesses</p>
              )}
            </div>
          </div>

          {/* Suggestions */}
          {evaluation.suggestions.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Suggestions
              </h4>
              <ul className="space-y-1">
                {evaluation.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="h-3 w-3 text-blue-500 mt-0.5" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>
            Click on any category to see the cards contributing to that score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory || 'overview'} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="essential">Essential</TabsTrigger>
              <TabsTrigger value="synergies">Synergies</TabsTrigger>
              <TabsTrigger value="details">All Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              {Object.entries(evaluation.categories).map(([key, category]) => {
                const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        <span className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {category.count} cards
                        </Badge>
                      </div>
                      <span className={`font-bold ${getRatingColor(category.rating)}`}>
                        {category.rating}/10
                      </span>
                    </div>
                    <Progress 
                      value={category.rating * 10} 
                      className="h-2"
                    />
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="essential" className="space-y-4">
              <div className="grid gap-4">
                {['ramp', 'cardAdvantage', 'interaction', 'winConditions'].map(key => {
                  const category = evaluation.categories[key as keyof typeof evaluation.categories];
                  const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
                  
                  return (
                    <div key={key} className={`p-4 rounded-lg ${getRatingBgColor(category.rating)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4" />}
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <Badge variant="outline" className={getRatingColor(category.rating)}>
                          {category.rating}/10
                        </Badge>
                      </div>
                      {category.cards.length > 0 ? (
                        <div className="text-sm space-y-1">
                          {category.cards.slice(0, 5).map((card, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{card.name}</span>
                              <span className="text-muted-foreground">×{card.quantity}</span>
                            </div>
                          ))}
                          {category.cards.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{category.cards.length - 5} more cards
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No cards in this category</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="synergies" className="space-y-4">
              <div className="grid gap-4">
                {['synergy', 'tempo', 'cardQuality', 'cardSelection'].map(key => {
                  const category = evaluation.categories[key as keyof typeof evaluation.categories];
                  const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
                  
                  return (
                    <div key={key} className={`p-4 rounded-lg ${getRatingBgColor(category.rating)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4" />}
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <Badge variant="outline" className={getRatingColor(category.rating)}>
                          {category.rating}/10
                        </Badge>
                      </div>
                      {category.cards.length > 0 ? (
                        <div className="text-sm space-y-1">
                          {category.cards.slice(0, 5).map((card, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{card.name}</span>
                              <span className="text-muted-foreground">×{card.quantity}</span>
                            </div>
                          ))}
                          {category.cards.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{category.cards.length - 5} more cards
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No cards in this category</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {Object.entries(evaluation.categories).map(([key, category]) => {
                const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
                
                return (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{category.count} cards</Badge>
                        <Badge variant="outline" className={getRatingColor(category.rating)}>
                          {category.rating}/10
                        </Badge>
                      </div>
                    </div>
                    <Progress value={category.rating * 10} className="h-2 mb-3" />
                    {category.cards.length > 0 ? (
                      <div className="grid gap-1 text-sm">
                        {category.cards.map((card, i) => (
                          <div key={i} className="flex justify-between py-1 hover:bg-muted/50 px-2 -mx-2 rounded">
                            <span>{card.name}</span>
                            <span className="text-muted-foreground">×{card.quantity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No cards in this category</p>
                    )}
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}