/**
 * Table preferences management
 * Persists user's table settings in localStorage
 */

import type { VisibilityState, SortingState } from '@tanstack/react-table';

const STORAGE_KEYS = {
  COLUMN_VISIBILITY: 'deckxport-table-columns',
  SORTING: 'deckxport-table-sorting',
  GLOBAL_FILTER: 'deckxport-table-filter',
} as const;

export interface TablePreferences {
  columnVisibility?: VisibilityState;
  sorting?: SortingState;
  globalFilter?: string;
}

/**
 * Save column visibility preferences
 */
export function saveColumnVisibility(visibility: VisibilityState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COLUMN_VISIBILITY, JSON.stringify(visibility));
  } catch (error) {
    console.error('Failed to save column visibility:', error);
  }
}

/**
 * Load column visibility preferences
 */
export function loadColumnVisibility(): VisibilityState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.COLUMN_VISIBILITY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load column visibility:', error);
    return null;
  }
}

/**
 * Save sorting preferences
 */
export function saveSorting(sorting: SortingState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SORTING, JSON.stringify(sorting));
  } catch (error) {
    console.error('Failed to save sorting:', error);
  }
}

/**
 * Load sorting preferences
 */
export function loadSorting(): SortingState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SORTING);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load sorting:', error);
    return null;
  }
}

/**
 * Save all table preferences at once
 */
export function saveTablePreferences(prefs: TablePreferences): void {
  if (prefs.columnVisibility) saveColumnVisibility(prefs.columnVisibility);
  if (prefs.sorting) saveSorting(prefs.sorting);
}

/**
 * Load all table preferences
 */
export function loadTablePreferences(): TablePreferences {
  return {
    columnVisibility: loadColumnVisibility() || undefined,
    sorting: loadSorting() || undefined,
  };
}

/**
 * Clear all table preferences
 */
export function clearTablePreferences(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear table preferences:', error);
  }
}