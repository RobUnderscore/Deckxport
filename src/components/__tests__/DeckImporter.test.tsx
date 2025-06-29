import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DeckImporter } from '../DeckImporter';
import { AllTheProviders } from '@/tests/utils';
import type { MoxfieldDeck } from '@/types/moxfield';

// Mock the hooks
vi.mock('@/hooks/useMoxfieldDeck', () => ({
  useMoxfieldDeck: vi.fn(),
}));

vi.mock('@/hooks/useScryfall', () => ({
  useCardsByNames: vi.fn(),
}));

import { useMoxfieldDeck } from '@/hooks/useMoxfieldDeck';
import { useCardsByNames } from '@/hooks/useScryfall';

describe('DeckImporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle v3 API structure correctly', async () => {
    const mockDeckV3: MoxfieldDeck = {
      id: 'test-v3',
      publicId: 'test-v3',
      publicUrl: 'https://moxfield.com/decks/test-v3',
      name: 'Test Deck V3',
      format: 'commander',
      visibility: 'public',
      createdByUser: { userName: 'testuser' },
      createdAtUtc: '2024-01-01',
      lastUpdatedAtUtc: '2024-01-01',
      version: 3,
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      boards: {
        mainboard: {
          count: 3,
          cards: {
            'Lightning Bolt': { quantity: 4, boardType: 'mainboard', finish: 'nonfoil' },
            Counterspell: { quantity: 2, boardType: 'mainboard', finish: 'nonfoil' },
            'Sol Ring': { quantity: 1, boardType: 'mainboard', finish: 'foil' },
          },
        },
      },
    };

    vi.mocked(useMoxfieldDeck).mockReturnValue({
      data: mockDeckV3,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      fetchStatus: 'idle',
      status: 'success',
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useMoxfieldDeck>);

    vi.mocked(useCardsByNames).mockReturnValue({
      data: { data: [], not_found: [] },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCardsByNames>);

    render(<DeckImporter />, { wrapper: AllTheProviders });

    // Input URL and submit
    const input = screen.getByPlaceholderText('Paste Moxfield deck URL...');
    fireEvent.change(input, { target: { value: 'https://moxfield.com/decks/test-v3' } });
    fireEvent.click(screen.getByText('Go'));

    // Check deck info is displayed correctly
    await waitFor(() => {
      expect(screen.getByText('Test Deck V3')).toBeInTheDocument();
      expect(screen.getByText(/testuser/)).toBeInTheDocument();
      expect(screen.getByText(/3 unique cards/)).toBeInTheDocument();
      expect(screen.getByText(/7 total cards/)).toBeInTheDocument();
    });
  });

  it('should handle v2 API structure correctly', async () => {
    const mockDeckV2: MoxfieldDeck = {
      id: 'test-v2',
      publicId: 'test-v2',
      publicUrl: 'https://moxfield.com/decks/test-v2',
      name: 'Test Deck V2',
      format: 'modern',
      visibility: 'public',
      createdByUser: { userName: 'testuser2' },
      createdAtUtc: '2024-01-01',
      lastUpdatedAtUtc: '2024-01-01',
      version: 2,
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      mainboard: {
        Tarmogoyf: { quantity: 4, boardType: 'mainboard', finish: 'nonfoil' },
        Thoughtseize: { quantity: 3, boardType: 'mainboard', finish: 'nonfoil' },
      },
    };

    vi.mocked(useMoxfieldDeck).mockReturnValue({
      data: mockDeckV2,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      fetchStatus: 'idle',
      status: 'success',
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useMoxfieldDeck>);

    vi.mocked(useCardsByNames).mockReturnValue({
      data: { data: [], not_found: [] },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useCardsByNames>);

    render(<DeckImporter />, { wrapper: AllTheProviders });

    // Input URL and submit
    const input = screen.getByPlaceholderText('Paste Moxfield deck URL...');
    fireEvent.change(input, { target: { value: 'https://moxfield.com/decks/test-v2' } });
    fireEvent.click(screen.getByText('Go'));

    // Check deck info is displayed correctly
    await waitFor(() => {
      expect(screen.getByText('Test Deck V2')).toBeInTheDocument();
      expect(screen.getByText(/testuser2/)).toBeInTheDocument();
      expect(screen.getByText(/2 unique cards/)).toBeInTheDocument();
      expect(screen.getByText(/7 total cards/)).toBeInTheDocument();
    });
  });
});
