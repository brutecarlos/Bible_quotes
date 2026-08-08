/**
 * Bible Quotes Chrome Extension - Utilities
 * Shared utility functions used across the extension
 */

class QuoteUtils {
  /**
   * Get random quotes from a flat array
   * @param {string[]} quotes - Array of quote strings
   * @param {number} count - Number of quotes to retrieve
   * @returns {string[]} Array of random quotes
   */
  static getRandomQuotes(quotes, count = 1) {
    if (!quotes || !Array.isArray(quotes) || quotes.length === 0) {
      return ['No quotes available - John 3:16'];
    }

    const validCount = this.validateQuoteCount(count);
    const randomQuotes = [];
    const usedIndices = new Set();

    for (let i = 0; i < Math.min(validCount, quotes.length); i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * quotes.length);
      } while (usedIndices.has(randomIndex));

      usedIndices.add(randomIndex);
      randomQuotes.push(quotes[randomIndex]);
    }

    return randomQuotes;
  }

  /**
   * Parse quote string into text and reference
   * @param {string} quoteString - Full quote string "text - Reference"
   * @returns {Object} { text, reference }
   */
  static parseQuote(quoteString) {
    const parts = quoteString.split(' - ');
    return {
      text: parts[0] || '',
      reference: parts[1] || 'Unknown'
    };
  }

  /**
   * Validate quote count is within acceptable range
   * @param {number} count - Quote count to validate
   * @returns {number} Validated count
   */
  static validateQuoteCount(count) {
    const parsed = parseInt(count, 10);
    if (isNaN(parsed)) return EXTENSION_CONFIG.MIN_QUOTE_COUNT;
    return Math.max(
      EXTENSION_CONFIG.MIN_QUOTE_COUNT,
      Math.min(parsed, EXTENSION_CONFIG.MAX_QUOTE_COUNT)
    );
  }

  /**
   * Process raw quotes data structure into flat array
   * @param {Object} data - Quotes data with books/chapters/verses structure
   * @returns {string[]} Flattened array of quote strings
   */
  static flattenQuotesData(data) {
    const quotes = [];

    if (!data.books || !Array.isArray(data.books)) {
      console.warn('Invalid quotes data structure');
      return quotes;
    }

    data.books.forEach(book => {
      if (!book.chapters || !Array.isArray(book.chapters)) {
        console.warn(`Invalid book structure for: ${book.name}`);
        return;
      }

      book.chapters.forEach(chapter => {
        if (!chapter.verses || !Array.isArray(chapter.verses)) {
          console.warn(`Invalid chapter structure for: ${book.book} ${chapter.chapter}`);
          return;
        }

        chapter.verses.forEach(verse => {
          if (verse.text && verse.reference) {
            quotes.push(`${verse.text} - ${verse.reference}`);
          }
        });
      });
    });

    return quotes;
  }

  /**
   * Check if a quote is in favorites
   * @param {string} quote - Quote string to check
   * @param {string[]} favorites - Array of favorite quotes
   * @returns {boolean} True if quote is in favorites
   */
  static isInFavorites(quote, favorites) {
    return Array.isArray(favorites) && favorites.includes(quote);
  }

  /**
   * Calculate days between two dates
   * @param {number} date1 - First date timestamp
   * @param {number} date2 - Second date timestamp (defaults to now)
   * @returns {number} Days between dates
   */
  static daysBetween(date1, date2 = Date.now()) {
    return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
  }

  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, delay = EXTENSION_CONFIG.DEBOUNCE_DELAY) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Format timestamp to readable date
   * @param {number} timestamp - Milliseconds since epoch
   * @returns {string} Formatted date string
   */
  static formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
