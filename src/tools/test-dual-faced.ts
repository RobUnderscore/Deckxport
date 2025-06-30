#!/usr/bin/env node
import { aggregateDeckData } from '../services/deckAggregator.js';

// Parse command line arguments
const args = process.argv.slice(2);
const deckId = args[0];

async function testDualFacedCardsInDeck(deckId: string) {
  console.log(`\n🧪 Testing dual-faced card handling for deck: ${deckId}`);
  
  try {
    // Import the deck
    const result = await aggregateDeckData(deckId, (progress) => {
      if (progress.currentCard) {
        console.log(`   Processing: ${progress.currentCard} (${progress.cardsProcessed}/${progress.totalCards})`);
      }
    });
    
    console.log(`\n✅ Deck imported: ${result.deckName} by ${result.deckAuthor}`);
    console.log(`   Total cards: ${result.cards.length}`);
    
    // Find dual-faced cards
    const dualFacedCards = result.cards.filter(card => 
      card.layout && ['transform', 'modal_dfc', 'flip', 'adventure', 'split'].includes(card.layout)
    );
    
    console.log(`\n🎭 Dual-faced cards found: ${dualFacedCards.length}`);
    
    dualFacedCards.forEach(card => {
      console.log(`\n📋 ${card.name}`);
      console.log(`   Layout: ${card.layout}`);
      console.log(`   Set: ${card.set}/${card.collectorNumber}`);
      console.log(`   Type: ${card.typeLine}`);
      console.log(`   CMC: ${card.cmc}`);
      console.log(`   Colors: ${card.colors.join(', ') || 'Colorless'}`);
      console.log(`   Primary Image: ${card.imageUris?.normal ? 'Present' : 'Missing'}`);
      
      if (card.cardFaces && card.cardFaces.length > 0) {
        console.log(`   Faces: ${card.cardFaces.length}`);
        card.cardFaces.forEach((face, index) => {
          console.log(`\n   Face ${index + 1}: ${face.name}`);
          console.log(`     - Type: ${face.typeLine}`);
          console.log(`     - Mana Cost: ${face.manaCost || 'N/A'}`);
          console.log(`     - Oracle Text: ${face.oracleText ? face.oracleText.substring(0, 50) + '...' : 'N/A'}`);
          console.log(`     - P/T: ${face.power || 'N/A'}/${face.toughness || 'N/A'}`);
          console.log(`     - Image: ${face.imageUris?.normal ? 'Present' : 'Missing'}`);
        });
      } else {
        console.log(`   ❌ No face data available`);
      }
      
      console.log(`   Oracle Tags: ${card.oracleTags.length > 0 ? card.oracleTags.join(', ') : 'None'}`);
    });
    
    // Check for cards with missing images
    const cardsWithMissingImages = result.cards.filter(card => 
      !card.imageUris?.normal && (!card.cardFaces || !card.cardFaces[0]?.imageUris?.normal)
    );
    
    if (cardsWithMissingImages.length > 0) {
      console.log(`\n⚠️  Cards with missing images: ${cardsWithMissingImages.length}`);
      cardsWithMissingImages.forEach(card => {
        console.log(`   - ${card.name} (${card.set}/${card.collectorNumber})`);
      });
    }
    
    // Report errors
    if (result.errors.length > 0) {
      console.log(`\n❌ Errors encountered: ${result.errors.length}`);
      result.errors.forEach(error => {
        console.log(`   - ${error.cardName}: ${error.error} (${error.stage})`);
      });
    }
    
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error}`);
  }
}

// Main CLI logic
async function main() {
  if (!deckId) {
    console.log(`
Dual-Faced Card Test Tool

Usage:
  npm run test-dual-faced <deck-id>

Example:
  npm run test-dual-faced 3Q92qBjgjruem6CKhxqTOg
    `);
    return;
  }
  
  await testDualFacedCardsInDeck(deckId);
}

// Run the CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});