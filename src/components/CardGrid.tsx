import type { Card } from '@/types/scryfall';

interface CardGridProps {
  cards: Card[];
  isLoading?: boolean;
}

export function CardGrid({ cards, isLoading }: CardGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2 animate-pulse">
            <div className="aspect-[488/680] bg-secondary rounded-lg" />
            <div className="h-4 bg-secondary rounded w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        // Get the appropriate image URI
        const imageUri = card.image_uris?.normal || 
                        card.card_faces?.[0]?.image_uris?.normal ||
                        card.image_uris?.small ||
                        card.card_faces?.[0]?.image_uris?.small;
        
        return (
          <div key={card.id} className="space-y-2">
            {imageUri ? (
              <img
                src={imageUri}
                alt={card.name}
                className="w-full rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                loading="lazy"
              />
            ) : (
              <div className="aspect-[488/680] bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground text-sm text-center px-2">
                  No image available
                </span>
              </div>
            )}
            <h3 className="text-sm font-medium text-center line-clamp-2">
              {card.name}
            </h3>
          </div>
        );
      })}
    </div>
  );
}