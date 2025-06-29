# Oracle Tags Exploration for Deckxport

## Overview

We've successfully integrated Scryfall Tagger's oracle tag system into Deckxport, enabling advanced deck evaluation based on functional card categorization. Oracle tags are community-curated tags that describe what cards actually do, providing much richer analysis than simple text parsing.

## Key Features Implemented

### 1. **Oracle Tag Fetching**
- Sequential API calls with 250ms rate limiting
- Proper error handling for missing tags
- Integration with the existing data aggregation pipeline
- Tag data stored in CardAggregate type

### 2. **Advanced Evaluation System**
- **12 evaluation categories** with weighted scoring:
  - Ramp & Mana (weight: 1.5)
  - Card Advantage (weight: 1.5)
  - Interaction (weight: 1.2)
  - Win Conditions (weight: 1.0)
  - Targeted Removal (weight: 1.0)
  - Board Wipes (weight: 0.8)
  - Synergy (weight: 1.2)
  - Card Quality (weight: 0.6)
  - Tempo (weight: 0.8)
  - Card Selection (weight: 1.0)
  - Recursion (weight: 0.6)
  - Sacrifice Outlets (weight: 0.4)

### 3. **Comprehensive Deck Evaluation Component**
- Overall deck rating (0-10)
- Strengths and weaknesses identification
- Actionable suggestions
- Category breakdown with visual progress bars
- Detailed card lists for each category

### 4. **Oracle Tag Cloud Visualization**
- Visual representation of all tags in the deck
- Color-coded by category
- Hover tooltips showing cards with each tag
- Tag frequency and priority sorting
- Coverage statistics

## Oracle Tag Categories Discovered

### Card Advantage
- `draw`, `cantrip`, `card advantage`, `pure draw`, `wheel`, `impulse draw`, `extra cards`

### Ramp & Mana
- `ramp`, `mana-rock`, `mana-dork`, `land-ramp`, `ritual`, `cost-reduction`, `cheaper than mv`

### Removal & Interaction
- `removal`, `creature-removal`, `board-wipe`, `counterspell`, `bounce`, `tapper`

### Protection & Evasion
- `protection`, `hexproof`, `indestructible`, `evasion`, `flying`, `unblockable`

### Combat & Creatures
- `attack trigger`, `synergy-attacker`, `quick equip`, `combat damage`, `drain creature`

### Synergies & Triggers
- `reflexive trigger`, `etb trigger`, `death trigger`, `sacrifice`, `aristocrats`

### Game Mechanics
- `tuck`, `rhystic`, `dilemma`, `modal`, `kicker`, `ninjutsu`

### Win Conditions
- `win-condition`, `combo-piece`, `finisher`, `game-ender`, `infinite-combo`

### Utility
- `tutor`, `search`, `graveyard hate`, `artifact hate`, `utility land`

## Technical Implementation

### Data Flow
1. **Moxfield Import** → Basic deck data
2. **Scryfall Enrichment** → Card details, images, prices
3. **Tagger Tags** → Oracle tags for functional analysis
4. **Evaluation** → Comprehensive deck scoring

### Key Services
- `scryfallTagger.ts` - GraphQL API integration
- `deckAggregator.ts` - Orchestrates data fetching
- `advancedEvaluation.ts` - Analyzes deck using tags
- `oracleTagExamples.ts` - Tag categorization data

### UI Components
- `ComprehensiveDeckEvaluation.tsx` - Main evaluation display
- `OracleTagCloud.tsx` - Tag visualization
- `DeckEvaluationDemo.tsx` - Dedicated evaluation page

## Usage Examples

### Direct Evaluation
Navigate to `/evaluate` and enter a Moxfield deck ID to get:
- Overall deck rating
- Category scores
- Specific card recommendations
- Visual tag analysis

### Integrated Analysis
The main import page (`/`) now includes:
- Oracle tag display in the deck table
- Tag error tracking
- Quick link to evaluation page

## API Integration Details

### Authentication
- Uses session-based auth with CSRF tokens
- Default credentials work for read-only access
- Proxied through Vite (dev) and Vercel (production)

### Rate Limiting
- 250ms delay between card requests
- Sequential processing to avoid overwhelming the API
- Graceful error handling for missing tags

### Example Query
```graphql
query FetchCard($set: String!, $number: String!) {
  card: cardBySet(set: $set, number: $number) {
    name
    oracleId
    taggings {
      tag {
        name
        type
        namespace
        category
      }
    }
  }
}
```

## Future Enhancements

1. **Tag-Based Deck Building**
   - Suggest cards with specific tags
   - Balance tag distribution
   - Identify tag gaps

2. **Meta Analysis**
   - Compare tag distributions across formats
   - Track popular tag combinations
   - Identify emerging strategies

3. **Custom Tag Weights**
   - User-defined importance for categories
   - Format-specific evaluations
   - Personal preference profiles

4. **Tag History**
   - Track tag changes over time
   - Version comparison
   - Meta evolution tracking

## Deployment

### Development
```bash
npm run dev
# Vite proxy handles Tagger API calls
```

### Production (Vercel)
- Serverless function at `/api/tagger-proxy`
- Handles CORS and authentication
- No client-side credentials needed

## Conclusion

The oracle tag integration provides Deckxport with professional-grade deck evaluation capabilities. By leveraging community-curated functional tags, we can offer insights that go beyond simple text analysis, helping players understand their decks' true strengths and weaknesses.