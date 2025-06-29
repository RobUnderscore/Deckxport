#!/usr/bin/env node
/**
 * Test script for oracle tag fetching
 * Run with: npx tsx src/scripts/testOracleTags.ts
 * 
 * This script tests oracle tag fetching with proper rate limiting.
 * It will stop if it encounters repeated errors to prevent API abuse.
 */

import { fetchOracleTagsForCards } from '../services/oracleTags';

async function testOracleTagFetching() {
  console.log('Testing Oracle Tag Fetching...\n');
  
  // Test with common ramp cards
  const testCards = [
    'Sol Ring',
    'Arcane Signet',
    'Cultivate',
    'Kodama\'s Reach',
    'Birds of Paradise',
    'Llanowar Elves',
    'Rampant Growth',
    'Farseek',
    'Nature\'s Lore',
    'Three Visits',
    'Lightning Bolt',  // Not ramp
    'Counterspell',    // Not ramp
    'Swords to Plowshares', // Not ramp
    'Rhystic Study',   // Card draw
    'Beast Within',    // Removal
  ];
  
  console.log(`Fetching oracle tags for ${testCards.length} cards...`);
  console.time('Oracle tag fetch');
  
  try {
    const result = await fetchOracleTagsForCards(testCards);
    console.timeEnd('Oracle tag fetch');
    
    if (result.hasErrors) {
      console.log(`\n⚠️ Errors encountered: ${result.errors.join(', ')}\n`);
    }
    
    console.log(`\nFound oracle tags for ${result.tags.size} cards:\n`);
    
    // Display results
    for (const cardName of testCards) {
      const tags = result.tags.get(cardName);
      if (tags && tags.length > 0) {
        console.log(`✓ ${cardName}: ${tags.join(', ')}`);
      } else {
        console.log(`✗ ${cardName}: No tags found`);
      }
    }
    
    // Show tag statistics
    const allTags = new Map<string, number>();
    for (const tags of result.tags.values()) {
      for (const tag of tags) {
        allTags.set(tag, (allTags.get(tag) || 0) + 1);
      }
    }
    
    console.log('\nTag frequency:');
    const sortedTags = Array.from(allTags.entries())
      .sort((a, b) => b[1] - a[1]);
    for (const [tag, count] of sortedTags) {
      console.log(`  ${tag}: ${count} cards`);
    }
    
  } catch (error) {
    console.error('Error fetching oracle tags:', error);
  }
}

// Run the test
testOracleTagFetching();