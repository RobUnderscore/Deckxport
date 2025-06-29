/**
 * Examples of oracle tag types discovered from Scryfall Tagger
 * These examples showcase the rich functional tagging system
 */

export const ORACLE_TAG_EXAMPLES = {
  'Card Advantage': [
    'draw',
    'cantrip',
    'card advantage',
    'pure draw',
    'wheel',
    'impulse draw',
    'extra cards',
    'impulse-artifact',
    'discard outlet-creature',
  ],
  
  'Ramp & Mana': [
    'ramp',
    'mana-ramp',
    'mana-rock',
    'mana-dork',
    'land-ramp',
    'ritual',
    'cost-reduction',
    'adds-multiple-mana',
    'cheaper than mv',
    'affinity for artifacts',
    'tap fuel-artifact',
    'tap fuel-creature',
  ],
  
  'Removal & Interaction': [
    'removal',
    'creature-removal',
    'spot-removal',
    'targeted-removal',
    'board-wipe',
    'mass-removal',
    'sweeper',
    'wrath-effect',
    'counter',
    'counterspell',
    'counterspell with set mechanic',
    'counterspell-ability',
    'counterspell-soft',
    'bounce',
    'tapper',
    'tapper-creature',
    'removal-creature-destroy',
    'removal-planeswalker-destroy',
    'removal-planeswalker-burn',
    'removal-artifact-destroy',
    'removal-enchantment-destroy',
    'removal-land-destroy',
    'swap removal',
    'burn any',
    'pinger',
    'bombard',
  ],
  
  'Protection & Evasion': [
    'protection',
    'hexproof',
    'indestructible',
    'evasion',
    'flying',
    'unblockable',
    'menace',
  ],
  
  'Combat & Creatures': [
    'attack trigger',
    'synergy-attacker',
    'quick equip',
    'quick attach',
    'combat damage',
    'double strike',
    'first strike',
    'vigilance',
    'haste',
    'deathtouch',
    'lifelink',
    'trample',
    'drain creature',
    'power matters',
    'typal-neo-solo-attack',
  ],
  
  'Synergies & Triggers': [
    'reflexive trigger',
    'etb trigger',
    'ltb trigger',
    'death trigger',
    'sacrifice',
    'aristocrats',
    'synergy-artifact',
    'synergy-aura',
    'synergy-legendary',
    'synergy-black',
    'cast trigger-you',
    'sacrifice outlet-land',
    'discard outlet-creature',
    'saboteur',
    'typal coupling',
    'typal-ninja',
    'typal-rogue',
    'intervening if clause',
  ],
  
  'Game Mechanics': [
    'tuck',
    'tuck-self',
    'rhystic',
    'dilemma',
    'modal',
    'kicker',
    'ninjutsu',
    'alliteration',
    'virtual vanilla',
    'french vanilla',
    'virtual french vanilla',
    'activate from hand',
    'activated-ability',
    'single target instant/sorcery',
    'animate self',
  ],
  
  'Win Conditions': [
    'win-condition',
    'combo-piece',
    'finisher',
    'game-ender',
    'infinite-combo',
    'alternate-win',
  ],
  
  'Utility': [
    'tutor',
    'tutor-cmc',
    'tutor-enchantment-aura',
    'tutor-to-battlefield',
    'search',
    'graveyard hate',
    'artifact hate',
    'enchantment hate',
    'hate-nonbasic-land',
    'utility land',
    'disenchant/naturalize',
    'donate rampant growth',
    'name matters',
  ],
  
  'Cycles & Groups': [
    'cycle-neo-march',
    'cycle-neo-legendary-land',
    'cycle-tdm-c-omen',
  ],
  
  'Miscellaneous': [
    'fun ruling',
    'gains pp counters',
    'repeatable crime',
  ],
};

/**
 * Tag priority for evaluation
 * Higher priority tags are more important for deck evaluation
 */
export const TAG_PRIORITY = {
  // Essential mechanics
  'ramp': 10,
  'mana-rock': 10,
  'mana-dork': 10,
  'draw': 10,
  'card advantage': 10,
  'removal': 9,
  'board-wipe': 9,
  'counterspell': 8,
  'protection': 8,
  
  // Win conditions
  'win-condition': 10,
  'combo-piece': 9,
  'finisher': 8,
  
  // Synergies
  'synergy-artifact': 7,
  'synergy-legendary': 7,
  'aristocrats': 7,
  
  // Utility
  'tutor': 8,
  'recursion': 7,
  'graveyard': 6,
  
  // Combat
  'evasion': 6,
  'attack trigger': 5,
  'combat damage': 5,
  
  // Other
  'virtual vanilla': 2,
  'french vanilla': 3,
};

/**
 * Get tag category
 */
export function getTagCategory(tag: string): string {
  for (const [category, tags] of Object.entries(ORACLE_TAG_EXAMPLES)) {
    if (tags.includes(tag)) {
      return category;
    }
  }
  return 'Other';
}

/**
 * Get tag priority
 */
export function getTagPriority(tag: string): number {
  return TAG_PRIORITY[tag as keyof typeof TAG_PRIORITY] || 5;
}