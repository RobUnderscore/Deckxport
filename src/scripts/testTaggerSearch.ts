/**
 * Test script for Scryfall Tagger search functionality
 */

import { searchCardsByName } from '../services/scryfallTagger';

async function testSearch() {
  console.log('Testing Scryfall Tagger Search API...\n');

  try {
    // Test search for "Lightning Bolt"
    console.log('Searching for "Lightning Bolt"...');
    const results = await searchCardsByName('Lightning Bolt');
    
    if (results) {
      console.log(`Found ${results.length} results:\n`);
      
      // Show first 5 results
      results.slice(0, 5).forEach((card, idx) => {
        console.log(`${idx + 1}. ${card.name}`);
        console.log(`   Set: ${card.set.toUpperCase()} #${card.collectorNumber}`);
        console.log(`   Oracle ID: ${card.oracleId}`);
        console.log('');
      });
      
      if (results.length > 5) {
        console.log(`... and ${results.length - 5} more results`);
      }
    } else {
      console.log('No results found or error occurred');
    }

    // Test search for a more specific card
    console.log('\n\nSearching for "Black Lotus"...');
    const lotusResults = await searchCardsByName('Black Lotus');
    
    if (lotusResults) {
      console.log(`Found ${lotusResults.length} results:\n`);
      lotusResults.forEach((card, idx) => {
        console.log(`${idx + 1}. ${card.name} - ${card.set.toUpperCase()} #${card.collectorNumber}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testSearch();