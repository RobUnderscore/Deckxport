/**
 * Script to analyze oracle tag categories and types from Scryfall Tagger
 * Run with: npx tsx src/scripts/analyzeOracleTags.ts
 */

import { fetchCardTags } from '../services/scryfallTagger.js';

interface TagCategory {
  name: string;
  examples: string[];
  count: number;
}

const TAG_CATEGORIES: Record<string, TagCategory> = {
  'Card Advantage': {
    name: 'Card Advantage',
    examples: [],
    count: 0
  },
  'Ramp & Mana': {
    name: 'Ramp & Mana',
    examples: [],
    count: 0
  },
  'Removal & Interaction': {
    name: 'Removal & Interaction',
    examples: [],
    count: 0
  },
  'Protection & Evasion': {
    name: 'Protection & Evasion',
    examples: [],
    count: 0
  },
  'Combat & Creatures': {
    name: 'Combat & Creatures',
    examples: [],
    count: 0
  },
  'Synergies & Triggers': {
    name: 'Synergies & Triggers',
    examples: [],
    count: 0
  },
  'Game Mechanics': {
    name: 'Game Mechanics',
    examples: [],
    count: 0
  },
  'Win Conditions': {
    name: 'Win Conditions',
    examples: [],
    count: 0
  },
  'Utility': {
    name: 'Utility',
    examples: [],
    count: 0
  },
  'Other': {
    name: 'Other',
    examples: [],
    count: 0
  }
};

// Tag categorization mapping
const TAG_MAPPING: Record<string, string> = {
  // Card Advantage
  'draw': 'Card Advantage',
  'cantrip': 'Card Advantage',
  'card advantage': 'Card Advantage',
  'pure draw': 'Card Advantage',
  'wheel': 'Card Advantage',
  'impulse draw': 'Card Advantage',
  'extra cards': 'Card Advantage',
  
  // Ramp & Mana
  'ramp': 'Ramp & Mana',
  'mana-ramp': 'Ramp & Mana',
  'mana-rock': 'Ramp & Mana',
  'mana-dork': 'Ramp & Mana',
  'land-ramp': 'Ramp & Mana',
  'ritual': 'Ramp & Mana',
  'cost-reduction': 'Ramp & Mana',
  'adds-multiple-mana': 'Ramp & Mana',
  'cheaper than mv': 'Ramp & Mana',
  
  // Removal & Interaction
  'removal': 'Removal & Interaction',
  'creature-removal': 'Removal & Interaction',
  'spot-removal': 'Removal & Interaction',
  'targeted-removal': 'Removal & Interaction',
  'board-wipe': 'Removal & Interaction',
  'mass-removal': 'Removal & Interaction',
  'sweeper': 'Removal & Interaction',
  'wrath-effect': 'Removal & Interaction',
  'counter': 'Removal & Interaction',
  'counterspell': 'Removal & Interaction',
  'bounce': 'Removal & Interaction',
  'tapper': 'Removal & Interaction',
  'tapper-creature': 'Removal & Interaction',
  
  // Protection & Evasion
  'protection': 'Protection & Evasion',
  'hexproof': 'Protection & Evasion',
  'indestructible': 'Protection & Evasion',
  'evasion': 'Protection & Evasion',
  'flying': 'Protection & Evasion',
  'unblockable': 'Protection & Evasion',
  'menace': 'Protection & Evasion',
  
  // Combat & Creatures
  'attack trigger': 'Combat & Creatures',
  'synergy-attacker': 'Combat & Creatures',
  'quick equip': 'Combat & Creatures',
  'quick attach': 'Combat & Creatures',
  'combat damage': 'Combat & Creatures',
  'double strike': 'Combat & Creatures',
  'first strike': 'Combat & Creatures',
  'vigilance': 'Combat & Creatures',
  'haste': 'Combat & Creatures',
  'deathtouch': 'Combat & Creatures',
  'lifelink': 'Combat & Creatures',
  'trample': 'Combat & Creatures',
  
  // Synergies & Triggers
  'reflexive trigger': 'Synergies & Triggers',
  'etb trigger': 'Synergies & Triggers',
  'ltb trigger': 'Synergies & Triggers',
  'death trigger': 'Synergies & Triggers',
  'sacrifice': 'Synergies & Triggers',
  'aristocrats': 'Synergies & Triggers',
  
  // Game Mechanics
  'tuck': 'Game Mechanics',
  'tuck-self': 'Game Mechanics',
  'rhystic': 'Game Mechanics',
  'dilemma': 'Game Mechanics',
  'modal': 'Game Mechanics',
  'kicker': 'Game Mechanics',
  
  // Win Conditions
  'win-condition': 'Win Conditions',
  'combo-piece': 'Win Conditions',
  'finisher': 'Win Conditions',
  'game-ender': 'Win Conditions',
  'infinite-combo': 'Win Conditions',
  'alternate-win': 'Win Conditions',
  
  // Utility
  'tutor': 'Utility',
  'search': 'Utility',
  'graveyard hate': 'Utility',
  'artifact hate': 'Utility',
  'enchantment hate': 'Utility',
};

// Test cards covering different archetypes
const TEST_CARDS = [
  // Card Advantage
  { set: 'neo', number: '63', name: 'The Modern Age // Vector Glider' },
  { set: 'neo', number: '38', name: 'Jin-Gitaxias, Progress Tyrant' },
  
  // Ramp
  { set: 'neo', number: '261', name: 'Network Terminal' },
  { set: 'neo', number: '1', name: 'Ancestral Katana' },
  
  // Removal
  { set: 'neo', number: '111', name: 'March of Wretched Sorrow' },
  { set: 'neo', number: '95', name: 'Invoke Despair' },
  
  // Protection
  { set: 'neo', number: '25', name: 'Light of Hope' },
  
  // Win Conditions
  { set: 'neo', number: '75', name: 'The Reality Chip' },
  
  // Complex Cards
  { set: 'tdm', number: '40', name: 'Dirgur Island Dragon // Skimming Strike' },
  { set: 'nem', number: '142', name: 'Parallax Wave' },
];

function categorizeTag(tagName: string): string {
  const lowerTag = tagName.toLowerCase();
  
  // Check exact matches first
  if (TAG_MAPPING[lowerTag]) {
    return TAG_MAPPING[lowerTag];
  }
  
  // Check partial matches
  for (const [pattern, category] of Object.entries(TAG_MAPPING)) {
    if (lowerTag.includes(pattern) || pattern.includes(lowerTag)) {
      return category;
    }
  }
  
  // Special categorizations based on patterns
  if (lowerTag.includes('draw') || lowerTag.includes('card')) {
    return 'Card Advantage';
  }
  if (lowerTag.includes('mana') || lowerTag.includes('ramp')) {
    return 'Ramp & Mana';
  }
  if (lowerTag.includes('destroy') || lowerTag.includes('exile') || lowerTag.includes('kill')) {
    return 'Removal & Interaction';
  }
  if (lowerTag.includes('protect') || lowerTag.includes('hexproof') || lowerTag.includes('ward')) {
    return 'Protection & Evasion';
  }
  if (lowerTag.includes('attack') || lowerTag.includes('combat') || lowerTag.includes('creature')) {
    return 'Combat & Creatures';
  }
  if (lowerTag.includes('trigger') || lowerTag.includes('whenever') || lowerTag.includes('when')) {
    return 'Synergies & Triggers';
  }
  if (lowerTag.includes('win') || lowerTag.includes('combo') || lowerTag.includes('infinite')) {
    return 'Win Conditions';
  }
  
  return 'Other';
}

async function analyzeOracleTags() {
  console.log('Analyzing Oracle Tags from Scryfall Tagger...\n');
  
  const allTags = new Set<string>();
  const tagsByCard = new Map<string, string[]>();
  
  // Fetch tags for each test card
  for (const testCard of TEST_CARDS) {
    console.log(`Fetching tags for ${testCard.name} (${testCard.set}/${testCard.number})...`);
    
    try {
      const card = await fetchCardTags(testCard.set, testCard.number);
      
      if (card && card.taggings) {
        const oracleTags = card.taggings
          .filter(tagging => 
            tagging.tag?.type === 'ORACLE_CARD_TAG' || 
            tagging.tag?.namespace === 'card'
          )
          .map(tagging => tagging.tag.name);
        
        tagsByCard.set(testCard.name, oracleTags);
        oracleTags.forEach(tag => allTags.add(tag));
        
        console.log(`  Found ${oracleTags.length} oracle tags`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error) {
      console.error(`  Error: ${error}`);
    }
  }
  
  // Categorize all found tags
  console.log('\n\nCategorizing tags...');
  for (const tag of allTags) {
    const category = categorizeTag(tag);
    const catData = TAG_CATEGORIES[category];
    if (catData && !catData.examples.includes(tag)) {
      catData.examples.push(tag);
      catData.count++;
    } else if (!catData) {
      console.log(`Warning: No category found for tag "${tag}" (category: ${category})`);
    }
  }
  
  // Display results
  console.log('\n\n=== ORACLE TAG ANALYSIS ===\n');
  console.log(`Total unique tags found: ${allTags.size}\n`);
  
  // Display by category
  for (const [categoryName, category] of Object.entries(TAG_CATEGORIES)) {
    if (category.count > 0) {
      console.log(`\n${categoryName} (${category.count} tags):`);
      console.log('  ' + category.examples.sort().join(', '));
    }
  }
  
  // Display by card
  console.log('\n\n=== TAGS BY CARD ===\n');
  for (const [cardName, tags] of tagsByCard.entries()) {
    console.log(`\n${cardName}:`);
    if (tags.length > 0) {
      // Group by category
      const byCategory = new Map<string, string[]>();
      for (const tag of tags) {
        const cat = categorizeTag(tag);
        if (!byCategory.has(cat)) {
          byCategory.set(cat, []);
        }
        byCategory.get(cat)!.push(tag);
      }
      
      for (const [cat, catTags] of byCategory.entries()) {
        console.log(`  ${cat}: ${catTags.join(', ')}`);
      }
    } else {
      console.log('  No oracle tags');
    }
  }
  
  // Suggest new evaluation functions
  console.log('\n\n=== EVALUATION SUGGESTIONS ===\n');
  console.log('Based on the oracle tags found, here are suggested evaluation functions:\n');
  
  const suggestions = [
    '1. Synergy Score: Count cards with synergy tags (synergy-*, triggers, combos)',
    '2. Flexibility Score: Count modal cards, kicker, split cards, MDFCs',
    '3. Tempo Score: Count "cheaper than mv", quick equip, haste enablers',
    '4. Resilience Score: Count protection, recursion, and self-protection',
    '5. Card Quality: Track virtual vanilla, french vanilla vs complex cards',
    '6. Combo Potential: Identify combo pieces and infinite combo enablers',
    '7. Mana Efficiency: Track rituals, cost reducers, and free spells',
    '8. Card Selection: Track tutors, scry, library manipulation',
  ];
  
  suggestions.forEach(s => console.log(s));
}

// Run the analysis
analyzeOracleTags().catch(console.error);