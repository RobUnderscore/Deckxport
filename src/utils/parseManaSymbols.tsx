import React from 'react';

// Map of mana symbols to their mana-font CSS classes
export const MANA_SYMBOL_MAP: Record<string, string> = {
  // Basic mana
  'W': 'ms-w',
  'U': 'ms-u',
  'B': 'ms-b',
  'R': 'ms-r',
  'G': 'ms-g',
  'C': 'ms-c', // Colorless
  
  // Generic mana
  '0': 'ms-0',
  '1': 'ms-1',
  '2': 'ms-2',
  '3': 'ms-3',
  '4': 'ms-4',
  '5': 'ms-5',
  '6': 'ms-6',
  '7': 'ms-7',
  '8': 'ms-8',
  '9': 'ms-9',
  '10': 'ms-10',
  '11': 'ms-11',
  '12': 'ms-12',
  '13': 'ms-13',
  '14': 'ms-14',
  '15': 'ms-15',
  '16': 'ms-16',
  '17': 'ms-17',
  '18': 'ms-18',
  '19': 'ms-19',
  '20': 'ms-20',
  'X': 'ms-x',
  'Y': 'ms-y',
  'Z': 'ms-z',
  
  // Hybrid mana
  'W/U': 'ms-wu',
  'W/B': 'ms-wb',
  'U/B': 'ms-ub',
  'U/R': 'ms-ur',
  'B/R': 'ms-br',
  'B/G': 'ms-bg',
  'R/G': 'ms-rg',
  'R/W': 'ms-rw',
  'G/W': 'ms-gw',
  'G/U': 'ms-gu',
  
  // Phyrexian mana
  'W/P': 'ms-wp',
  'U/P': 'ms-up',
  'B/P': 'ms-bp',
  'R/P': 'ms-rp',
  'G/P': 'ms-gp',
  
  // Hybrid Phyrexian
  '2/W': 'ms-2w',
  '2/U': 'ms-2u',
  '2/B': 'ms-2b',
  '2/R': 'ms-2r',
  '2/G': 'ms-2g',
  
  // Special symbols
  'T': 'ms-tap',
  'Q': 'ms-untap',
  'E': 'ms-e', // Energy
  'S': 'ms-s', // Snow
  
  // Additional costs
  'CHAOS': 'ms-chaos',
  'A': 'ms-acorn',
  'TK': 'ms-tk', // Ticket
};

/**
 * Parses a mana cost string and returns JSX with mana symbols
 * @param manaCost - String like "{2}{U}{B}" or "{T}: Add {G}"
 * @param size - Size class for the icons (default: "ms-cost" for normal size)
 */
export function parseManaSymbols(manaCost: string | undefined, size: string = 'ms-cost'): React.ReactNode {
  if (!manaCost) return null;
  
  // First, split by newlines to handle multi-line text
  const lines = manaCost.split('\n');
  
  return (
    <>
      {lines.map((line, lineIndex) => {
        // Split by curly braces to separate symbols and text
        const parts = line.split(/(\{[^}]+\})/g);
        
        return (
          <React.Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {parts.map((part, partIndex) => {
              // Check if this part is a mana symbol (enclosed in braces)
              const match = part.match(/^\{([^}]+)\}$/);
              if (match) {
                const symbol = match[1];
                const cssClass = MANA_SYMBOL_MAP[symbol];
                
                if (cssClass) {
                  return (
                    <i
                      key={`${lineIndex}-${partIndex}`}
                      className={`ms ${cssClass} ${size} ms-shadow`}
                      aria-label={symbol}
                    />
                  );
                }
                // If we don't recognize the symbol, just return it as text
                return <span key={`${lineIndex}-${partIndex}`}>{part}</span>;
              }
              
              // Regular text (not in braces)
              return part ? <span key={`${lineIndex}-${partIndex}`}>{part}</span> : null;
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}