import type { CategoryEvaluation } from "@/services/evaluation/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CategoryEvaluationCardProps {
  title: string;
  icon: React.ReactNode;
  evaluation: CategoryEvaluation;
}

export function CategoryEvaluationCard({ title, icon, evaluation }: CategoryEvaluationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getRatingColor = (rating: CategoryEvaluation['rating']) => {
    switch (rating) {
      case 'excellent': return 'text-green-400 bg-green-400/10';
      case 'good': return 'text-blue-400 bg-blue-400/10';
      case 'average': return 'text-yellow-400 bg-yellow-400/10';
      case 'below-average': return 'text-orange-400 bg-orange-400/10';
      case 'poor': return 'text-red-400 bg-red-400/10';
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    if (score >= 20) return 'text-orange-400';
    return 'text-red-400';
  };
  
  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {evaluation.actualCount} / {evaluation.targetCount} recommended
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={cn("text-2xl font-bold", getScoreColor(evaluation.score))}>
              {evaluation.score}
            </p>
            <p className={cn("text-xs px-2 py-1 rounded-full capitalize", getRatingColor(evaluation.rating))}>
              {evaluation.rating}
            </p>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-accent rounded"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {/* Findings */}
      <div className="space-y-2">
        {evaluation.findings.map((finding, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            • {finding}
          </p>
        ))}
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* Cards list */}
          {evaluation.cards.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Cards in this category:</h4>
              <div className="space-y-2">
                {evaluation.cards.map((cardEval, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        cardEval.importance === 'high' ? 'bg-green-400' :
                        cardEval.importance === 'medium' ? 'bg-yellow-400' :
                        'bg-gray-400'
                      )} />
                      <span>{cardEval.card.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{cardEval.reasoning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Suggestions */}
          {evaluation.suggestions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Suggestions:</h4>
              <div className="space-y-1">
                {evaluation.suggestions.map((suggestion, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    • {suggestion}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}