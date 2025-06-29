/**
 * Test script to experiment with Scryfall Tagger GraphQL API
 * Run with: npm run tsx src/scripts/testTaggerGraphQL.ts
 */

const TAGGER_GRAPHQL_ENDPOINT = 'https://tagger.scryfall.com/graphql';

const FETCH_CARD_QUERY = `
  query FetchCard(
    $set: String!
    $number: String!
    $back: Boolean = false
    $moderatorView: Boolean = false
  ) {
    card: cardBySet(set: $set, number: $number, back: $back) {
      ...CardAttrs
      backside
      layout
      scryfallUrl
      sideNames
      twoSided
      rotatedLayout
      taggings(moderatorView: $moderatorView) {
        ...TaggingAttrs
        tag {
          ...TagAttrs
          ancestorTags {
            ...TagAttrs
          }
        }
      }
      relationships(moderatorView: $moderatorView) {
        ...RelationshipAttrs
      }
    }
  }
  
  fragment CardAttrs on Card {
    artImageUrl
    backside
    cardImageUrl
    collectorNumber
    id
    illustrationId
    name
    oracleId
    printingId
    set
  }

  fragment RelationshipAttrs on Relationship {
    classifier
    classifierInverse
    annotation
    subjectId
    subjectName
    createdAt
    creatorId
    foreignKey
    id
    name
    pendingRevisions
    relatedId
    relatedName
    status
    type
  }

  fragment TagAttrs on Tag {
    category
    createdAt
    creatorId
    id
    name
    namespace
    pendingRevisions
    slug
    status
    type
  }

  fragment TaggingAttrs on Tagging {
    annotation
    subjectId
    createdAt
    creatorId
    foreignKey
    id
    pendingRevisions
    type
    status
    weight
  }
`;

async function testTaggerQuery() {
  console.log('Testing Scryfall Tagger GraphQL API...\n');

  // Test with the same card from the curl command
  const testCard = { set: 'tdm', number: '40' };
  
  // Using default credentials
  const sessionCookie = '_ga=GA1.2.358669891.1665763652; _ga_3P82LCZY01=GS1.1.1678978267.11.0.1678978270.0.0.0; _scryfall_tagger_session=J92dHYSC0KCeQfyDPKUZSB0fTvAEGcFaX3HkdkQtu3baDx3PJvO0ME7zEvVOZRihxSDLy8wSkvORcYiXqkbZMPdS3Lr7ZlJCgqnBk5hclE5205bMOSVSMvDZcpzOjXyw2QSieAE92m9wIUF3WYP7Dx9B6TVQB%2BlPLDh0GmLHrOu3vR7bFnqNwfxzNP4KJDhhZM5NYAEkYhYODhoOCDpo4uXvoKJdazVIHvZepWY%2FUKsF%2FDaEMXLZSWeIAM20E0jXzpH0m%2FUeYm9ZjbGTldIFUFIAsWMdwCzmIP4uOFKfIjI%3D--8P6bhrh4Ogk8VTYT--yP%2FrcXS9RJiSPYbvNMwfXA%3D%3D';
  const csrfToken = 'cepmUnygTvN63NBHK4KTAPzhPXY0cYdKF0zwnEr6fiTZfqiQGrQNAuvvOz5bQhfi1awVuMT3KRR2sRUeUxJhCw';

  try {
    // Test with authentication
    console.log('Test 1: With authentication cookie');
    console.log('URL:', TAGGER_GRAPHQL_ENDPOINT);
    
    const response1 = await fetch(TAGGER_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
        'Origin': 'https://tagger.scryfall.com',
        'Referer': `https://tagger.scryfall.com/card/${testCard.set}/${testCard.number}`,
        'Cookie': sessionCookie,
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        query: FETCH_CARD_QUERY,
        variables: {
          set: testCard.set,
          number: testCard.number,
          back: false,
          moderatorView: false,
        },
        operationName: 'FetchCard',
      }),
    });

    console.log('Response status:', response1.status);
    const result1 = await response1.json();
    console.log('Response:', JSON.stringify(result1, null, 2));

    if (result1.data?.card) {
      console.log('\n✅ Success! Card data retrieved:');
      console.log(`Card Name: ${result1.data.card.name}`);
      console.log(`Oracle ID: ${result1.data.card.oracleId}`);
      
      if (result1.data.card.taggings) {
        console.log('\nOracle Tags (namespace: card):');
        const oracleTags = result1.data.card.taggings
          .filter((tagging: any) => 
            tagging.tag?.type === 'ORACLE_CARD_TAG' || 
            tagging.tag?.namespace === 'card'
          )
          .map((tagging: any) => tagging.tag.name);
        console.log(oracleTags);
        console.log(`Total oracle tags: ${oracleTags.length}`);
      }
    }

    // Test with different cards
    console.log('\n\nTest 2: Testing with a different card (NEO #1)');
    const testCard2 = { set: 'neo', number: '1' };
    const response2 = await fetch(TAGGER_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
        'Origin': 'https://tagger.scryfall.com',
        'Referer': `https://tagger.scryfall.com/card/${testCard2.set}/${testCard2.number}`,
        'Cookie': sessionCookie,
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        query: FETCH_CARD_QUERY,
        variables: {
          set: testCard2.set,
          number: testCard2.number,
          back: false,
          moderatorView: false,
        },
        operationName: 'FetchCard',
      }),
    });

    const result2 = await response2.json();
    console.log('Response:', JSON.stringify(result2, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testTaggerQuery();