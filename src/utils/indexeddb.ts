import type { Card } from '@/types/scryfall';

const DB_NAME = 'DeckxportCache';
const DB_VERSION = 3; // Incremented for oracle tags store key change
const CARD_STORE = 'cards';
const BULK_META_STORE = 'bulkMeta';
const ORACLE_TAGS_STORE = 'oracleTags';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const ORACLE_TAGS_CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours for oracle tags

export interface CachedCard extends Card {
  _cachedAt: number;
}

export interface BulkMetadata {
  type: string;
  downloadedAt: number;
  size: number;
  updateUri: string;
}

export interface CachedOracleTags {
  cacheKey: string; // Format: "set_number" e.g. "tdc_312"
  cardName: string; // Human-readable name for reference
  tags: string[];
  _cachedAt: number;
}

// Open IndexedDB connection
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log(`🔧 IndexedDB upgrade needed from v${event.oldVersion} to v${event.newVersion}`);
      const db = (event.target as IDBOpenDBRequest).result;

      // Create cards store with indexes
      if (!db.objectStoreNames.contains(CARD_STORE)) {
        const cardStore = db.createObjectStore(CARD_STORE, { keyPath: 'id' });
        cardStore.createIndex('name', 'name', { unique: false });
        cardStore.createIndex('oracle_id', 'oracle_id', { unique: false });
        cardStore.createIndex('_cachedAt', '_cachedAt', { unique: false });
      }

      // Create bulk metadata store
      if (!db.objectStoreNames.contains(BULK_META_STORE)) {
        db.createObjectStore(BULK_META_STORE, { keyPath: 'type' });
      }

      // Handle oracle tags store - delete old version if it exists with wrong key
      if (event.oldVersion < 3 && db.objectStoreNames.contains(ORACLE_TAGS_STORE)) {
        console.log('🗑️ Deleting old oracle tags store with wrong key structure');
        db.deleteObjectStore(ORACLE_TAGS_STORE);
      }
      
      // Create oracle tags store with correct key
      if (!db.objectStoreNames.contains(ORACLE_TAGS_STORE)) {
        console.log('📦 Creating oracle tags store with cacheKey as primary key');
        const oracleStore = db.createObjectStore(ORACLE_TAGS_STORE, { keyPath: 'cacheKey' });
        oracleStore.createIndex('_cachedAt', '_cachedAt', { unique: false });
      }
    };
  });
}

// Check if cached data is still valid
export function isCacheValid(cachedAt: number, maxAge: number = CACHE_DURATION_MS): boolean {
  return Date.now() - cachedAt < maxAge;
}

// Cache a single card
export async function cacheCard(card: Card): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([CARD_STORE], 'readwrite');
  const store = transaction.objectStore(CARD_STORE);

  const cachedCard: CachedCard = {
    ...card,
    _cachedAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const request = store.put(cachedCard);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
}

// Cache multiple cards
export async function cacheCards(cards: Card[]): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([CARD_STORE], 'readwrite');
  const store = transaction.objectStore(CARD_STORE);

  const timestamp = Date.now();

  await Promise.all(
    cards.map((card) => {
      const cachedCard: CachedCard = {
        ...card,
        _cachedAt: timestamp,
      };

      return new Promise<void>((resolve, reject) => {
        const request = store.put(cachedCard);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    })
  );

  db.close();
}

// Get a cached card by ID
export async function getCachedCard(id: string): Promise<CachedCard | null> {
  const db = await openDB();
  const transaction = db.transaction([CARD_STORE], 'readonly');
  const store = transaction.objectStore(CARD_STORE);

  const card = await new Promise<CachedCard | null>((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  db.close();

  if (card && !isCacheValid(card._cachedAt)) {
    return null;
  }

  return card;
}

// Get multiple cached cards by IDs
export async function getCachedCards(ids: string[]): Promise<Map<string, CachedCard>> {
  const db = await openDB();
  const transaction = db.transaction([CARD_STORE], 'readonly');
  const store = transaction.objectStore(CARD_STORE);

  const results = new Map<string, CachedCard>();

  await Promise.all(
    ids.map(
      (id) =>
        new Promise<void>((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => {
            const card = request.result as CachedCard | undefined;
            if (card && isCacheValid(card._cachedAt)) {
              results.set(id, card);
            }
            resolve();
          };
          request.onerror = () => reject(request.error);
        })
    )
  );

  db.close();
  return results;
}

// Get cached cards by name
export async function getCachedCardsByName(names: string[]): Promise<Map<string, CachedCard>> {
  const db = await openDB();
  const transaction = db.transaction([CARD_STORE], 'readonly');
  const store = transaction.objectStore(CARD_STORE);
  const index = store.index('name');

  const results = new Map<string, CachedCard>();

  await Promise.all(
    names.map(
      (name) =>
        new Promise<void>((resolve, reject) => {
          const request = index.getAll(name);
          request.onsuccess = () => {
            const cards = request.result as CachedCard[];
            // Get the most recently cached valid card
            const validCard = cards
              .filter((card) => isCacheValid(card._cachedAt))
              .sort((a, b) => b._cachedAt - a._cachedAt)[0];

            if (validCard) {
              results.set(name, validCard);
            }
            resolve();
          };
          request.onerror = () => reject(request.error);
        })
    )
  );

  db.close();
  return results;
}

// Save bulk metadata
export async function saveBulkMetadata(metadata: BulkMetadata): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([BULK_META_STORE], 'readwrite');
  const store = transaction.objectStore(BULK_META_STORE);

  await new Promise<void>((resolve, reject) => {
    const request = store.put(metadata);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
}

// Get bulk metadata
export async function getBulkMetadata(type: string): Promise<BulkMetadata | null> {
  const db = await openDB();
  const transaction = db.transaction([BULK_META_STORE], 'readonly');
  const store = transaction.objectStore(BULK_META_STORE);

  const metadata = await new Promise<BulkMetadata | null>((resolve, reject) => {
    const request = store.get(type);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return metadata;
}

// Clear old cached cards
export async function clearExpiredCache(): Promise<number> {
  const db = await openDB();
  const transaction = db.transaction([CARD_STORE], 'readwrite');
  const store = transaction.objectStore(CARD_STORE);
  const index = store.index('_cachedAt');

  const cutoffTime = Date.now() - CACHE_DURATION_MS;
  const range = IDBKeyRange.upperBound(cutoffTime);

  let deletedCount = 0;

  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(range);

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });

  db.close();
  return deletedCount;
}

// Get cache statistics
export async function getCacheStats(): Promise<{
  totalCards: number;
  validCards: number;
  expiredCards: number;
  oldestCard: number | null;
  newestCard: number | null;
  totalOracleTags: number;
  validOracleTags: number;
  expiredOracleTags: number;
}> {
  const db = await openDB();
  
  // Get card stats
  const cardTransaction = db.transaction([CARD_STORE], 'readonly');
  const cardStore = cardTransaction.objectStore(CARD_STORE);

  const cardStats = await new Promise<{
    totalCards: number;
    validCards: number;
    expiredCards: number;
    oldestCard: number | null;
    newestCard: number | null;
  }>((resolve, reject) => {
    let totalCards = 0;
    let validCards = 0;
    let expiredCards = 0;
    let oldestCard: number | null = null;
    let newestCard: number | null = null;

    const request = cardStore.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const card = cursor.value as CachedCard;
        totalCards++;

        if (isCacheValid(card._cachedAt)) {
          validCards++;
        } else {
          expiredCards++;
        }

        if (oldestCard === null || card._cachedAt < oldestCard) {
          oldestCard = card._cachedAt;
        }
        if (newestCard === null || card._cachedAt > newestCard) {
          newestCard = card._cachedAt;
        }

        cursor.continue();
      } else {
        resolve({ totalCards, validCards, expiredCards, oldestCard, newestCard });
      }
    };

    request.onerror = () => reject(request.error);
  });

  // Get oracle tags stats
  const oracleTransaction = db.transaction([ORACLE_TAGS_STORE], 'readonly');
  const oracleStore = oracleTransaction.objectStore(ORACLE_TAGS_STORE);

  const oracleStats = await new Promise<{
    totalOracleTags: number;
    validOracleTags: number;
    expiredOracleTags: number;
  }>((resolve, reject) => {
    let totalOracleTags = 0;
    let validOracleTags = 0;
    let expiredOracleTags = 0;

    const request = oracleStore.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const tags = cursor.value as CachedOracleTags;
        totalOracleTags++;

        if (isCacheValid(tags._cachedAt, ORACLE_TAGS_CACHE_DURATION_MS)) {
          validOracleTags++;
        } else {
          expiredOracleTags++;
        }

        cursor.continue();
      } else {
        resolve({ totalOracleTags, validOracleTags, expiredOracleTags });
      }
    };

    request.onerror = () => reject(request.error);
  });

  db.close();
  
  return {
    ...cardStats,
    ...oracleStats
  };
}

// Cache oracle tags for a card
export async function cacheOracleTags(cacheKey: string, cardName: string, tags: string[]): Promise<void> {
  console.log(`🗄️ IndexedDB: Storing oracle tags for ${cacheKey} (${cardName})`);
  
  const db = await openDB();
  const transaction = db.transaction([ORACLE_TAGS_STORE], 'readwrite');
  const store = transaction.objectStore(ORACLE_TAGS_STORE);

  const cachedTags: CachedOracleTags = {
    cacheKey,
    cardName,
    tags,
    _cachedAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const request = store.put(cachedTags);
    request.onsuccess = () => {
      console.log(`✅ IndexedDB: Successfully stored ${cacheKey}`);
      resolve();
    };
    request.onerror = () => {
      console.error(`❌ IndexedDB: Failed to store ${cacheKey}:`, request.error);
      reject(request.error);
    };
  });

  db.close();
}

// Get cached oracle tags for a card
export async function getCachedOracleTags(cacheKey: string): Promise<string[] | null> {
  const db = await openDB();
  const transaction = db.transaction([ORACLE_TAGS_STORE], 'readonly');
  const store = transaction.objectStore(ORACLE_TAGS_STORE);

  const cached = await new Promise<CachedOracleTags | null>((resolve, reject) => {
    const request = store.get(cacheKey);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  db.close();

  if (cached && !isCacheValid(cached._cachedAt, ORACLE_TAGS_CACHE_DURATION_MS)) {
    return null;
  }

  return cached?.tags || null;
}

// Get cached oracle tags for multiple cards
export async function getCachedOracleTagsForCards(cacheKeys: string[]): Promise<Map<string, string[]>> {
  console.log(`🔍 IndexedDB: Looking up ${cacheKeys.length} oracle tag entries`);
  
  const db = await openDB();
  const transaction = db.transaction([ORACLE_TAGS_STORE], 'readonly');
  const store = transaction.objectStore(ORACLE_TAGS_STORE);

  const results = new Map<string, string[]>();
  let foundCount = 0;
  let expiredCount = 0;

  await Promise.all(
    cacheKeys.map(
      (cacheKey) =>
        new Promise<void>((resolve, reject) => {
          const request = store.get(cacheKey);
          request.onsuccess = () => {
            const cached = request.result as CachedOracleTags | undefined;
            if (cached) {
              if (isCacheValid(cached._cachedAt, ORACLE_TAGS_CACHE_DURATION_MS)) {
                results.set(cacheKey, cached.tags);
                foundCount++;
              } else {
                expiredCount++;
                console.log(`⏰ IndexedDB: Cache expired for ${cacheKey}`);
              }
            }
            resolve();
          };
          request.onerror = () => {
            console.error(`❌ IndexedDB: Error reading ${cacheKey}:`, request.error);
            reject(request.error);
          };
        })
    )
  );

  db.close();
  console.log(`📊 IndexedDB: Found ${foundCount} valid entries, ${expiredCount} expired, ${cacheKeys.length - foundCount - expiredCount} missing`);
  return results;
}

// Clear expired oracle tags
export async function clearExpiredOracleTags(): Promise<number> {
  const db = await openDB();
  const transaction = db.transaction([ORACLE_TAGS_STORE], 'readwrite');
  const store = transaction.objectStore(ORACLE_TAGS_STORE);
  const index = store.index('_cachedAt');

  const cutoffTime = Date.now() - ORACLE_TAGS_CACHE_DURATION_MS;
  const range = IDBKeyRange.upperBound(cutoffTime);

  let deletedCount = 0;

  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(range);

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });

  db.close();
  return deletedCount;
}
