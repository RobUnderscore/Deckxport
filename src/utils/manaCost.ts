/**
 * Calculates the total mana cost (converted mana cost) from a mana cost string
 * @param manaCost - String like "{2}{U}{B}" or "{X}{R}{R}"
 * @returns Total mana cost as a number
 */
export function calculateTotalManaCost(manaCost: string | undefined): number {
  if (!manaCost) return 0;
  
  let total = 0;
  
  // Match all mana symbols in curly braces
  const matches = manaCost.match(/\{([^}]+)\}/g);
  if (!matches) return 0;
  
  matches.forEach(match => {
    // Remove the curly braces
    const symbol = match.slice(1, -1);
    
    // Check if it's a number (generic mana)
    const num = parseInt(symbol);
    if (!isNaN(num)) {
      total += num;
    } 
    // X, Y, Z are treated as 0 for sorting purposes
    else if (symbol === 'X' || symbol === 'Y' || symbol === 'Z') {
      // X costs are typically 0 for sorting
      total += 0;
    }
    // Hybrid mana (e.g., {U/R}, {2/W}) counts as 1
    else if (symbol.includes('/')) {
      total += 1;
    }
    // Phyrexian mana (e.g., {U/P}) counts as 1
    else if (symbol.includes('P')) {
      total += 1;
    }
    // Regular colored mana (W, U, B, R, G, C) counts as 1
    else {
      total += 1;
    }
  });
  
  return total;
}

/**
 * Compares two mana costs for sorting
 * First by total cost, then by color requirements
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 */
export function compareManaCosts(costA: string | undefined, costB: string | undefined): number {
  const totalA = calculateTotalManaCost(costA);
  const totalB = calculateTotalManaCost(costB);
  
  if (totalA !== totalB) {
    return totalA - totalB;
  }
  
  // If total costs are equal, sort by number of colored mana symbols
  const coloredA = (costA?.match(/\{[WUBRGC]\}/g) || []).length;
  const coloredB = (costB?.match(/\{[WUBRGC]\}/g) || []).length;
  
  return coloredA - coloredB;
}