import { parseManaSymbols } from './parseManaSymbols';

/**
 * Component wrapper for displaying mana costs
 */
export function ManaSymbols({ 
  cost, 
  size = 'ms-cost',
  className = '' 
}: { 
  cost: string | undefined;
  size?: string;
  className?: string;
}) {
  return (
    <span className={`mana-symbols-wrapper ${className}`}>
      {parseManaSymbols(cost, size)}
    </span>
  );
}