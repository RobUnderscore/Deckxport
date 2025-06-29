import { describe, it, expect } from 'vitest';
import {
  extractDeckIdFromUrl,
  isValidMoxfieldUrl,
  buildMoxfieldApiUrl,
  buildMoxfieldPublicUrl,
  sanitizeDeckId,
} from '../moxfield';

describe('Moxfield URL Utilities', () => {
  describe('extractDeckIdFromUrl', () => {
    it('should extract deck ID from standard URL', () => {
      const url = 'https://moxfield.com/decks/lkwkRXXSmkSd1W7VkOIjwQ';
      expect(extractDeckIdFromUrl(url)).toBe('lkwkRXXSmkSd1W7VkOIjwQ');
    });

    it('should extract deck ID from URL with www', () => {
      const url = 'https://www.moxfield.com/decks/abc123-def456';
      expect(extractDeckIdFromUrl(url)).toBe('abc123-def456');
    });

    it('should extract deck ID from URL with additional paths', () => {
      const url = 'https://moxfield.com/decks/test_deck-123/primer';
      expect(extractDeckIdFromUrl(url)).toBe('test_deck-123');
    });

    it('should return null for invalid URLs', () => {
      expect(extractDeckIdFromUrl('not-a-url')).toBeNull();
      expect(extractDeckIdFromUrl('https://example.com')).toBeNull();
      expect(extractDeckIdFromUrl('https://moxfield.com/users/test')).toBeNull();
    });
  });

  describe('isValidMoxfieldUrl', () => {
    it('should validate correct Moxfield URLs', () => {
      expect(isValidMoxfieldUrl('https://moxfield.com/decks/test123')).toBe(true);
      expect(isValidMoxfieldUrl('http://moxfield.com/decks/test123')).toBe(true);
      expect(isValidMoxfieldUrl('https://www.moxfield.com/decks/test123')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidMoxfieldUrl('https://example.com/decks/test')).toBe(false);
      expect(isValidMoxfieldUrl('moxfield.com/decks/')).toBe(false);
      expect(isValidMoxfieldUrl('https://moxfield.com/users/test')).toBe(false);
    });
  });

  describe('buildMoxfieldApiUrl', () => {
    it('should build correct API URL', () => {
      const deckId = 'lkwkRXXSmkSd1W7VkOIjwQ';
      expect(buildMoxfieldApiUrl(deckId)).toBe(
        'https://api.moxfield.com/v2/decks/all/lkwkRXXSmkSd1W7VkOIjwQ'
      );
    });
  });

  describe('buildMoxfieldPublicUrl', () => {
    it('should build correct public URL', () => {
      const deckId = 'test-deck-123';
      expect(buildMoxfieldPublicUrl(deckId)).toBe(
        'https://moxfield.com/decks/test-deck-123'
      );
    });
  });

  describe('sanitizeDeckId', () => {
    it('should accept valid deck IDs', () => {
      expect(sanitizeDeckId('abc123')).toBe('abc123');
      expect(sanitizeDeckId('test_deck-123')).toBe('test_deck-123');
      expect(sanitizeDeckId('ABC_xyz-789')).toBe('ABC_xyz-789');
    });

    it('should trim whitespace', () => {
      expect(sanitizeDeckId('  test123  ')).toBe('test123');
    });

    it('should reject invalid characters', () => {
      expect(sanitizeDeckId('test@123')).toBeNull();
      expect(sanitizeDeckId('test/deck')).toBeNull();
      expect(sanitizeDeckId('test deck')).toBeNull();
      expect(sanitizeDeckId('')).toBeNull();
    });
  });
});