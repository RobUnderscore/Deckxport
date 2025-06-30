import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RotateCw, Layers } from 'lucide-react';
import type { CardAggregate } from '@/types/cardAggregate';
import { ManaSymbols } from '@/utils/manaSymbols';
import { parseManaSymbols } from '@/utils/parseManaSymbols';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DualFacedCardPreviewProps {
  card: CardAggregate;
  children: React.ReactNode;
  className?: string;
}

export function DualFacedCardPreview({ card, children, className }: DualFacedCardPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDualFaced = card.layout && ['transform', 'modal_dfc', 'flip', 'adventure', 'split'].includes(card.layout);
  
  if (!isDualFaced || !card.cardFaces || card.cardFaces.length < 2) {
    return <>{children}</>;
  }

  return (
    <>
      <div 
        className={cn("cursor-pointer relative", className)} 
        onClick={() => setIsOpen(true)}
      >
        {children}
        <div className="absolute -top-1 -right-1 bg-purple-600 rounded-full p-0.5" title="Double-faced card">
          <Layers className="w-3 h-3 text-white" />
        </div>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{card.name}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {card.cardFaces.map((face, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {face.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {card.cardFaces.map((face, index) => (
              <TabsContent key={index} value={index.toString()} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card Image */}
                  <div className="flex justify-center">
                    {face.imageUris?.normal && (
                      <img 
                        src={face.imageUris.normal} 
                        alt={face.name}
                        className="rounded-lg shadow-lg max-h-[500px]"
                      />
                    )}
                  </div>
                  
                  {/* Card Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{face.name}</h3>
                      {face.manaCost && (
                        <div className="mt-1">
                          <ManaSymbols cost={face.manaCost} size="ms" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400">Type</p>
                      <p className="font-medium">{face.typeLine}</p>
                    </div>
                    
                    {face.oracleText && (
                      <div>
                        <p className="text-sm text-gray-400">Oracle Text</p>
                        <div className="whitespace-pre-line mt-1 oracle-text-mana">
                          {parseManaSymbols(face.oracleText, 'ms')}
                        </div>
                      </div>
                    )}
                    
                    {(face.power || face.toughness) && (
                      <div>
                        <p className="text-sm text-gray-400">Power/Toughness</p>
                        <p className="font-medium text-lg">{face.power}/{face.toughness}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface DualFacedIndicatorProps {
  card: CardAggregate;
  className?: string;
}

export function DualFacedIndicator({ card, className }: DualFacedIndicatorProps) {
  const isDualFaced = card.layout && ['transform', 'modal_dfc', 'flip', 'adventure', 'split'].includes(card.layout);
  
  if (!isDualFaced || !card.cardFaces || card.cardFaces.length < 2) {
    return null;
  }

  const layoutIcons = {
    transform: <RotateCw className="w-3 h-3" />,
    modal_dfc: <Layers className="w-3 h-3" />,
    flip: <RotateCw className="w-3 h-3" />,
    adventure: <Layers className="w-3 h-3" />,
    split: <Layers className="w-3 h-3" />,
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300",
        className
      )}
      title={`${card.layout} card`}
    >
      {layoutIcons[card.layout as keyof typeof layoutIcons] || <Layers className="w-3 h-3" />}
      <span className="capitalize">{card.layout}</span>
    </div>
  );
}

// Helper function to get combined oracle text for dual-faced cards
export function getCombinedOracleText(card: CardAggregate): string {
  if (!card.cardFaces || card.cardFaces.length < 2) {
    return card.oracleText || '';
  }
  
  return card.cardFaces
    .map(face => `${face.name}:\n${face.oracleText || ''}`)
    .join('\n\n');
}

// Helper function to get display image for dual-faced cards (front face)
export function getDualFacedDisplayImage(card: CardAggregate): string | undefined {
  if (card.imageUris?.normal) {
    return card.imageUris.normal;
  }
  
  if (card.cardFaces && card.cardFaces.length > 0) {
    return card.cardFaces[0].imageUris?.normal || 
           card.cardFaces[0].imageUris?.small;
  }
  
  return undefined;
}