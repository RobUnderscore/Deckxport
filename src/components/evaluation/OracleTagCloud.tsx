import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CardAggregate } from '@/types/cardAggregate';
import { getTagCategory, getTagPriority } from '@/data/oracleTagExamples';

interface OracleTagCloudProps {
  cards: CardAggregate[];
}

interface TagInfo {
  tag: string;
  count: number;
  cards: string[];
  category: string;
  priority: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Card Advantage': 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
  'Ramp & Mana': 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
  'Removal & Interaction': 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
  'Protection & Evasion': 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
  'Combat & Creatures': 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
  'Synergies & Triggers': 'bg-pink-500/10 text-pink-600 hover:bg-pink-500/20',
  'Game Mechanics': 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20',
  'Win Conditions': 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20',
  'Utility': 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20',
  'Other': 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20',
};

export function OracleTagCloud({ cards }: OracleTagCloudProps) {
  const tagInfo = useMemo(() => {
    const tagMap = new Map<string, TagInfo>();
    
    cards.forEach(card => {
      card.oracleTags.forEach(tag => {
        const existing = tagMap.get(tag) || {
          tag,
          count: 0,
          cards: [],
          category: getTagCategory(tag),
          priority: getTagPriority(tag),
        };
        
        existing.count += card.quantity;
        if (!existing.cards.includes(card.name)) {
          existing.cards.push(card.name);
        }
        
        tagMap.set(tag, existing);
      });
    });
    
    // Sort by priority and count
    return Array.from(tagMap.values()).sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.count - a.count;
    });
  }, [cards]);

  const categoryGroups = useMemo(() => {
    const groups = new Map<string, TagInfo[]>();
    
    tagInfo.forEach(info => {
      const category = info.category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(info);
    });
    
    // Sort categories by total tag count
    return Array.from(groups.entries()).sort((a, b) => {
      const aTotal = a[1].reduce((sum, tag) => sum + tag.count, 0);
      const bTotal = b[1].reduce((sum, tag) => sum + tag.count, 0);
      return bTotal - aTotal;
    });
  }, [tagInfo]);

  const totalTags = tagInfo.length;
  const totalTaggedCards = cards.filter(c => c.oracleTags.length > 0).length;
  const tagCoverage = Math.round((totalTaggedCards / cards.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oracle Tag Analysis</CardTitle>
        <CardDescription>
          {totalTags} unique tags across {totalTaggedCards} cards ({tagCoverage}% coverage)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tag Cloud */}
        <div>
          <h3 className="text-sm font-semibold mb-3">All Tags by Priority</h3>
          <div className="flex flex-wrap gap-2">
            {tagInfo.slice(0, 30).map(({ tag, count, cards, category }) => (
              <div
                key={tag}
                className="group relative"
              >
                <Badge
                  variant="secondary"
                  className={`cursor-help transition-colors ${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}`}
                >
                  {tag} ({count})
                </Badge>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <p className="text-xs font-semibold mb-1">{category}</p>
                  <p className="text-xs text-muted-foreground">
                    Found in: {cards.slice(0, 3).join(', ')}
                    {cards.length > 3 && ` +${cards.length - 3} more`}
                  </p>
                </div>
              </div>
            ))}
            {tagInfo.length > 30 && (
              <Badge variant="outline" className="text-muted-foreground">
                +{tagInfo.length - 30} more tags
              </Badge>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Tags by Category</h3>
          <div className="space-y-3">
            {categoryGroups.slice(0, 5).map(([category, tags]) => {
              const totalCount = tags.reduce((sum, tag) => sum + tag.count, 0);
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-xs text-muted-foreground">
                      {tags.length} tags, {totalCount} occurrences
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 8).map(({ tag, count }) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`text-xs ${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}`}
                      >
                        {tag} ({count})
                      </Badge>
                    ))}
                    {tags.length > 8 && (
                      <Badge variant="ghost" className="text-xs text-muted-foreground">
                        +{tags.length - 8}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Missing Tags Info */}
        {tagCoverage < 100 && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {cards.length - totalTaggedCards} cards are missing oracle tags.
              This might be because they haven't been tagged yet in the Scryfall Tagger database.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}