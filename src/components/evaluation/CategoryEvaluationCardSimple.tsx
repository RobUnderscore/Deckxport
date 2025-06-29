import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

interface CategoryEvaluationCardProps {
  title: string;
  icon: LucideIcon;
  rating: number; // 0-10
  count: number;
  cards: Array<{ name: string; quantity: number }>;
  description: string;
  accentColor?: 'emerald' | 'blue' | 'purple' | 'red' | 'orange' | 'pink';
}

export function CategoryEvaluationCard({ 
  title, 
  icon: Icon, 
  rating, 
  count, 
  cards, 
  description,
  accentColor = 'blue'
}: CategoryEvaluationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-400';
    if (rating >= 6) return 'text-blue-400';
    if (rating >= 4) return 'text-yellow-400';
    if (rating >= 2) return 'text-orange-400';
    return 'text-red-400';
  };
  
  const getAccentClasses = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      red: 'bg-red-500/10 border-red-500/20 text-red-400',
      orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    };
    return colors[color] || colors.blue;
  };
  
  return (
    <div className="bg-card rounded-lg p-4 border">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", getAccentClasses(accentColor))}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-2xl font-bold", getRatingColor(rating))}>
            {rating}/10
          </div>
          <p className="text-sm text-muted-foreground">{count} cards</p>
        </div>
      </div>
      
      {cards.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide cards
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show cards ({cards.length})
              </>
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-2 space-y-1">
              {cards.map((card, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{card.name}</span>
                  <span className="text-muted-foreground">×{card.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}