# Using Deckxport

## API Integration

**Moxfield API** - We use `api2.moxfield.com/v3` endpoints through a CORS proxy (corsproxy.io) to access deck data.

**Scryfall API** - Direct browser access with no restrictions for card images and details.

## Quick Start

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to http://localhost:5173

3. Paste a Moxfield deck URL into the input field

4. Click "Go" to fetch and display all cards

## Example URLs

- Commander deck: https://moxfield.com/decks/lkwkRXXSmkSd1W7VkOIjwQ
- Any public Moxfield deck URL will work

## Features

- Fetches deck data from Moxfield
- Retrieves card images and details from Scryfall
- Displays cards in a responsive grid
- Shows card titles below each image
- Handles double-faced cards
- Shows loading states
- Error handling for invalid URLs
- Caches data for performance