#!/usr/bin/env node
import { fetchCardBySetAndNumber, fetchCardCollection } from '../services/scryfall.js';
import type { CardIdentifier } from '../services/scryfall.js';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function testCardByName(name: string) {
  console.log(`\n🔍 Testing card lookup by name: "${name}"`);
  try {
    const result = await fetchCardCollection([{ name }]);
    
    if (result.not_found.length > 0) {
      console.log(`❌ Card not found: ${JSON.stringify(result.not_found, null, 2)}`);
    }
    
    if (result.data.length > 0) {
      const card = result.data[0];
      console.log(`✅ Found card: ${card.name}`);
      console.log(`   Set: ${card.set} (${card.set_name})`);
      console.log(`   Collector Number: ${card.collector_number}`);
      console.log(`   Layout: ${card.layout}`);
      console.log(`   Oracle Text: ${card.oracle_text || 'N/A'}`);
      console.log(`   Mana Cost: ${card.mana_cost || 'N/A'}`);
      if (card.card_faces) {
        console.log(`   Faces: ${card.card_faces.map(f => f.name).join(' // ')}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }
}

async function testCardBySetAndNumber(set: string, collectorNumber: string) {
  console.log(`\n🔍 Testing card lookup by set/collector number: ${set}/${collectorNumber}`);
  try {
    const card = await fetchCardBySetAndNumber(set, collectorNumber);
    console.log(`✅ Found card: ${card.name}`);
    console.log(`   Set: ${card.set} (${card.set_name})`);
    console.log(`   Collector Number: ${card.collector_number}`);
    console.log(`   Layout: ${card.layout}`);
    if (card.card_faces) {
      console.log(`   Faces: ${card.card_faces.map(f => f.name).join(' // ')}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }
}

async function testBatchLookup(identifiers: CardIdentifier[]) {
  console.log(`\n🔍 Testing batch lookup with ${identifiers.length} cards`);
  try {
    const result = await fetchCardCollection(identifiers);
    
    console.log(`✅ Found: ${result.data.length} cards`);
    console.log(`❌ Not found: ${result.not_found.length} cards`);
    
    if (result.not_found.length > 0) {
      console.log('\nNot found:');
      result.not_found.forEach(nf => {
        console.log(`  - ${JSON.stringify(nf)}`);
      });
    }
    
    if (result.data.length > 0) {
      console.log('\nFound:');
      result.data.forEach(card => {
        console.log(`  - ${card.name} (${card.set}/${card.collector_number})`);
      });
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }
}

async function testWestvaleAbbey() {
  console.log('\n🧪 Testing Westvale Abbey (dual-faced card)...');
  
  // Test different name formats
  const nameVariants = [
    'Westvale Abbey // Ormendahl, Profane Prince',
    'Westvale Abbey / Ormendahl, Profane Prince',
    'Westvale Abbey',
    'Ormendahl, Profane Prince'
  ];
  
  for (const name of nameVariants) {
    await testCardByName(name);
  }
  
  // Test by set and collector number (SOI #281)
  await testCardBySetAndNumber('soi', '281');
}

async function inspectDualFacedCard(set: string, collectorNumber: string) {
  console.log(`\n🔬 Inspecting dual-faced card structure: ${set}/${collectorNumber}`);
  try {
    const card = await fetchCardBySetAndNumber(set, collectorNumber);
    
    console.log(`\n📋 Basic Info:`);
    console.log(`   Name: ${card.name}`);
    console.log(`   Layout: ${card.layout}`);
    console.log(`   Mana Cost: ${card.mana_cost || 'N/A'}`);
    console.log(`   Oracle Text: ${card.oracle_text || 'N/A'}`);
    
    console.log(`\n🖼️  Image URIs:`);
    if (card.image_uris) {
      console.log(`   Has top-level image_uris: YES`);
      console.log(`   - Small: ${card.image_uris.small ? 'Present' : 'Missing'}`);
      console.log(`   - Normal: ${card.image_uris.normal ? 'Present' : 'Missing'}`);
      console.log(`   - Large: ${card.image_uris.large ? 'Present' : 'Missing'}`);
    } else {
      console.log(`   Has top-level image_uris: NO`);
    }
    
    if (card.card_faces && card.card_faces.length > 0) {
      console.log(`\n🎭 Card Faces: ${card.card_faces.length} faces`);
      card.card_faces.forEach((face, index) => {
        console.log(`\n   Face ${index + 1}: ${face.name}`);
        console.log(`   - Mana Cost: ${face.mana_cost || 'N/A'}`);
        console.log(`   - Type Line: ${face.type_line || 'N/A'}`);
        console.log(`   - Oracle Text: ${face.oracle_text ? face.oracle_text.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`   - Power/Toughness: ${face.power || 'N/A'}/${face.toughness || 'N/A'}`);
        console.log(`   - Image URIs: ${face.image_uris ? 'Present' : 'Missing'}`);
        if (face.image_uris) {
          console.log(`     • Small: ${face.image_uris.small ? 'Present' : 'Missing'}`);
          console.log(`     • Normal: ${face.image_uris.normal ? 'Present' : 'Missing'}`);
          console.log(`     • Large: ${face.image_uris.large ? 'Present' : 'Missing'}`);
        }
      });
    }
    
    console.log(`\n📝 Full card structure (truncated):`);
    const cardCopy = { ...card };
    // Truncate long fields for readability
    if (cardCopy.oracle_text && cardCopy.oracle_text.length > 100) {
      cardCopy.oracle_text = cardCopy.oracle_text.substring(0, 100) + '...';
    }
    if (cardCopy.card_faces) {
      cardCopy.card_faces = cardCopy.card_faces.map(face => ({
        ...face,
        oracle_text: face.oracle_text ? face.oracle_text.substring(0, 50) + '...' : undefined,
        image_uris: face.image_uris ? { ...face.image_uris, small: '...', normal: '...', large: '...' } : undefined
      }));
    }
    if (cardCopy.image_uris) {
      cardCopy.image_uris = { ...cardCopy.image_uris, small: '...', normal: '...', large: '...' };
    }
    console.log(JSON.stringify(cardCopy, null, 2));
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }
}

// Main CLI logic
async function main() {
  if (!command) {
    console.log(`
Scryfall API Test Tool

Usage:
  npm run test-scryfall name <card-name>          # Test lookup by name
  npm run test-scryfall set <set> <number>        # Test lookup by set/collector number
  npm run test-scryfall westvale                  # Test Westvale Abbey specifically
  npm run test-scryfall batch                     # Test batch lookup with sample cards
  npm run test-scryfall inspect <set> <number>    # Inspect dual-faced card structure

Examples:
  npm run test-scryfall name "Lightning Bolt"
  npm run test-scryfall set lea 161
  npm run test-scryfall westvale
  npm run test-scryfall inspect soi 281
    `);
    return;
  }
  
  switch (command) {
    case 'name':
      if (!args[1]) {
        console.error('Please provide a card name');
        process.exit(1);
      }
      await testCardByName(args.slice(1).join(' '));
      break;
      
    case 'set':
      if (!args[1] || !args[2]) {
        console.error('Please provide both set code and collector number');
        process.exit(1);
      }
      await testCardBySetAndNumber(args[1], args[2]);
      break;
      
    case 'westvale':
      await testWestvaleAbbey();
      break;
      
    case 'batch':
      // Test batch with mix of regular and dual-faced cards
      await testBatchLookup([
        { name: 'Lightning Bolt' },
        { name: 'Westvale Abbey // Ormendahl, Profane Prince' },
        { set: 'soi', collector_number: '281' },
        { name: 'Delver of Secrets // Insectile Aberration' },
        { set: 'isd', collector_number: '51' }
      ]);
      break;
      
    case 'inspect':
      if (!args[1] || !args[2]) {
        console.error('Please provide both set code and collector number');
        process.exit(1);
      }
      await inspectDualFacedCard(args[1], args[2]);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});