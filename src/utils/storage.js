/**
 * Utility functions for localStorage management
 */

export const CROSSWORD_STORAGE_KEY = 'wedding-crossword-progress';

/**
 * Save crossword progress to localStorage
 * @param {Object} progress - The progress object to save
 */
export const saveCrosswordProgress = (progress) => {
  try {
    localStorage.setItem(CROSSWORD_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save crossword progress:', error);
  }
};

/**
 * Load crossword progress from localStorage
 * @returns {Object|null} The saved progress or null if not found
 */
export const loadCrosswordProgress = () => {
  try {
    const saved = localStorage.getItem(CROSSWORD_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load crossword progress:', error);
    return null;
  }
};

/**
 * Clear crossword progress from localStorage
 */
export const clearCrosswordProgress = () => {
  try {
    localStorage.removeItem(CROSSWORD_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear crossword progress:', error);
  }
};
