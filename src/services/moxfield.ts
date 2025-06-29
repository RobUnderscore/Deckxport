/**
 * Moxfield API service for fetching deck data
 */

import type { MoxfieldDeck, MoxfieldError } from '@/types/moxfield';
import { fetchMoxfieldDeckMock } from './moxfield-mock';

// Moxfield API - using api2 subdomain with v3 endpoint
const MOXFIELD_API_BASE = 'https://api2.moxfield.com';
// Using CORS proxy to bypass CORS restrictions
const CORS_PROXY = 'https://corsproxy.io/?url=';
const USE_MOCK = false; // Let's use the real API

/**
 * Custom error class for Moxfield API errors
 */
export class MoxfieldApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public error?: string
  ) {
    super(message);
    this.name = 'MoxfieldApiError';
  }
}

/**
 * Fetches a deck from Moxfield API
 * @param deckId - The public deck ID
 * @returns Promise resolving to the deck data
 * @throws MoxfieldApiError on failure
 */
export async function fetchMoxfieldDeck(deckId: string): Promise<MoxfieldDeck> {
  // Use mock in development due to Cloudflare blocking
  if (USE_MOCK) {
    console.warn('Using mock Moxfield data in development. Production will require a backend.');
    return fetchMoxfieldDeckMock(deckId);
  }

  const baseUrl = `${MOXFIELD_API_BASE}/v3/decks/all/${deckId}`;
  // Use CORS proxy to bypass CORS restrictions
  const url = `${CORS_PROXY}${baseUrl}`;

  console.log('Fetching from:', url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      let errorData: MoxfieldError | undefined;
      try {
        errorData = await response.json();
      } catch {
        // Failed to parse error response
      }

      throw new MoxfieldApiError(
        errorData?.message || `Failed to fetch deck: ${response.statusText}`,
        response.status,
        errorData?.error
      );
    }

    const data = await response.json();
    return data as MoxfieldDeck;
  } catch (error) {
    if (error instanceof MoxfieldApiError) {
      throw error;
    }

    // Network or other errors
    throw new MoxfieldApiError(
      error instanceof Error ? error.message : 'Failed to fetch deck',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Fetches user's public decks from Moxfield
 * @param username - The username
 * @param pageSize - Number of results per page (max 100)
 * @param page - Page number (1-indexed)
 * @returns Promise resolving to paginated deck list
 */
export async function fetchUserDecks(
  username: string,
  pageSize: number = 20,
  page: number = 1
): Promise<MoxfieldUserDecksResponse> {
  const baseUrl = `${MOXFIELD_API_BASE}/v3/users/${username}/decks?pageSize=${pageSize}&pageNumber=${page}`;
  const url = `${CORS_PROXY}${baseUrl}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      let errorData: MoxfieldError | undefined;
      try {
        errorData = await response.json();
      } catch {
        // Failed to parse error response
      }

      throw new MoxfieldApiError(
        errorData?.message || `Failed to fetch user decks: ${response.statusText}`,
        response.status,
        errorData?.error
      );
    }

    const data = await response.json();
    return data as MoxfieldUserDecksResponse;
  } catch (error) {
    if (error instanceof MoxfieldApiError) {
      throw error;
    }

    throw new MoxfieldApiError(
      error instanceof Error ? error.message : 'Failed to fetch user decks',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

// Re-export type for convenience
import type { MoxfieldUserDecksResponse } from '@/types/moxfield';
export type { MoxfieldDeck, MoxfieldUserDecksResponse };
