#!/usr/bin/env node
import { fetchMoxfieldDeck } from '../services/moxfield.js';
import type { MoxfieldCard } from '@/types';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function testDeckFetch(deckId: string) {
  console.log(`\n🔍 Fetching Moxfield deck: ${deckId}`);
  try {
    const deck = await fetchMoxfieldDeck(deckId);
    
    console.log(`\n✅ Deck: ${deck.name} by ${deck.createdByUser?.userName}`);
    console.log(`   Format: ${deck.format}`);
    console.log(`   Last Updated: ${deck.lastUpdatedAtUtc}`);
    
    // Extract cards with set/collector info
    const cardsWithSetInfo: Array<{name: string, set?: string, cn?: string, source: string}> = [];
    const cardsWithoutSetInfo: Array<{name: string, source: string}> = [];
    
    // Check v3 API structure
    if (deck.boards) {
      const boards = ['mainboard', 'sideboard', 'commanders', 'companion'] as const;
      
      for (const boardType of boards) {
        const board = deck.boards[boardType];
        if (board && 'cards' in board && board.cards) {
          Object.entries(board.cards).forEach(([cardId, card]) => {
            const moxCard = card as MoxfieldCard;
            const name = moxCard.card?.name || cardId;
            
            // Check all possible locations for set/collector info
            const set = moxCard.set || moxCard.card?.set;
            const cn = moxCard.cn || moxCard.collectorNumber || moxCard.card?.cn || moxCard.card?.collectorNumber;
            
            if (set && cn) {
              cardsWithSetInfo.push({ name, set, cn, source: boardType });
            } else {
              cardsWithoutSetInfo.push({ name, source: boardType });
            }
          });
        }
      }
    }
    
    console.log(`\n📊 Card Analysis:`);
    console.log(`   Total cards: ${cardsWithSetInfo.length + cardsWithoutSetInfo.length}`);
    console.log(`   Cards with set/collector info: ${cardsWithSetInfo.length}`);
    console.log(`   Cards without set/collector info: ${cardsWithoutSetInfo.length}`);
    
    if (cardsWithSetInfo.length > 0) {
      console.log(`\n✅ Sample cards with set/collector info:`);
      cardsWithSetInfo.slice(0, 5).forEach(card => {
        console.log(`   - ${card.name}: ${card.set}/${card.cn} (${card.source})`);
      });
    }
    
    if (cardsWithoutSetInfo.length > 0) {
      console.log(`\n❌ Cards without set/collector info:`);
      cardsWithoutSetInfo.slice(0, 5).forEach(card => {
        console.log(`   - ${card.name} (${card.source})`);
      });
    }
    
    // Check for dual-faced cards
    const dualFacedPatterns = ['//', ' / ', 'Flip', 'Transform', 'Modal DFC'];
    const potentialDualFaced = [...cardsWithSetInfo, ...cardsWithoutSetInfo]
      .filter(card => dualFacedPatterns.some(pattern => card.name.includes(pattern)));
    
    if (potentialDualFaced.length > 0) {
      console.log(`\n🎭 Potential dual-faced cards found:`);
      potentialDualFaced.forEach(card => {
        const hasSetInfo = 'set' in card && 'cn' in card;
        console.log(`   - ${card.name} ${hasSetInfo ? `(${card.set}/${card.cn})` : '(NO SET INFO)'}`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }
}

async function testSpecificCard(deckId: string, cardName: string) {
  console.log(`\n🔍 Looking for "${cardName}" in deck ${deckId}`);
  try {
    const deck = await fetchMoxfieldDeck(deckId);
    
    // Search all boards
    if (deck.boards) {
      const boards = ['mainboard', 'sideboard', 'commanders', 'companion'] as const;
      
      for (const boardType of boards) {
        const board = deck.boards[boardType];
        if (board && 'cards' in board && board.cards) {
          Object.entries(board.cards).forEach(([cardId, card]) => {
            const moxCard = card as MoxfieldCard;
            const name = moxCard.card?.name || cardId;
            
            if (name.toLowerCase().includes(cardName.toLowerCase())) {
              console.log(`\n✅ Found card in ${boardType}:`);
              console.log(`   Name: ${name}`);
              console.log(`   Quantity: ${moxCard.quantity}`);
              console.log(`   Set (moxCard.set): ${moxCard.set || 'undefined'}`);
              console.log(`   Set (card.set): ${moxCard.card?.set || 'undefined'}`);
              console.log(`   CN (moxCard.cn): ${moxCard.cn || 'undefined'}`);
              console.log(`   CN (moxCard.collectorNumber): ${moxCard.collectorNumber || 'undefined'}`);
              console.log(`   CN (card.cn): ${moxCard.card?.cn || 'undefined'}`);
              console.log(`   CN (card.collectorNumber): ${moxCard.card?.collectorNumber || 'undefined'}`);
              console.log(`   Scryfall URI: ${moxCard.card?.scryfall_uri || 'undefined'}`);
              console.log(`\n   Full moxCard data:`, JSON.stringify(moxCard, null, 2));
            }
          });
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }
}

// Main CLI logic
async function main() {
  if (!command) {
    console.log(`
Moxfield API Test Tool

Usage:
  npm run test-moxfield deck <deck-id>              # Analyze deck cards and set info
  npm run test-moxfield card <deck-id> <card-name>  # Find specific card in deck

Examples:
  npm run test-moxfield deck 3Q92qBjgjruem6CKhxqTOg
  npm run test-moxfield card 3Q92qBjgjruem6CKhxqTOg "Westvale Abbey"
    `);
    return;
  }
  
  switch (command) {
    case 'deck':
      if (!args[1]) {
        console.error('Please provide a deck ID');
        process.exit(1);
      }
      await testDeckFetch(args[1]);
      break;
      
    case 'card':
      if (!args[1] || !args[2]) {
        console.error('Please provide both deck ID and card name');
        process.exit(1);
      }
      await testSpecificCard(args[1], args.slice(2).join(' '));
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