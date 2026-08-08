/**
 * Bible Quotes Chrome Extension - Utilities
 * Shared utility functions used across the extension
 */

class QuoteUtils {
  static THEME_KEYWORDS = {
    hope: ['hope', 'trust', 'promesa', 'esperanza', 'esperar'],
    love: ['love', 'loved', 'amor', 'amar', 'caridad'],
    faith: ['faith', 'believe', 'fe', 'creer', 'fidelidad'],
    peace: ['peace', 'rest', 'paz', 'reposo', 'calma'],
    wisdom: ['wisdom', 'understanding', 'sabiduría', 'entendimiento', 'prudencia'],
    strength: ['strength', 'strong', 'fortaleza', 'fuerte', 'ánimo'],
    grace: ['grace', 'mercy', 'gracia', 'misericordia', 'perdón'],
    salvation: ['salvation', 'saved', 'salvación', 'salvo', 'redención']
  };

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
   * Get deterministic quote of the day based on date
   * @param {string[]} quotes - Array of quote strings
   * @param {Date} date - Date used to derive deterministic index
   * @returns {string} Quote string for the day
   */
  static getQuoteOfTheDay(quotes, date = new Date()) {
    if (!Array.isArray(quotes) || quotes.length === 0) {
      return 'No quotes available - John 3:16';
    }

    const dayKey = date.toISOString().slice(0, 10);
    let hash = 0;

    for (let i = 0; i < dayKey.length; i++) {
      hash = ((hash << 5) - hash) + dayKey.charCodeAt(i);
      hash |= 0;
    }

    const index = Math.abs(hash) % quotes.length;
    return quotes[index];
  }

  /**
   * Extract book name from verse reference
   * @param {string} reference - Verse reference (e.g. "John 3:16")
   * @returns {string}
   */
  static extractBookName(reference = '') {
    if (!reference || typeof reference !== 'string') {
      return 'Unknown';
    }

    const cleaned = reference.trim();
    const match = cleaned.match(/^([1-3]?\s*[\p{L}]+(?:\s+[\p{L}]+)*)\s+\d+/u);
    if (match && match[1]) {
      return match[1].replace(/\s+/g, ' ').trim();
    }

    return cleaned.split(' ')[0] || 'Unknown';
  }

  /**
   * Detect matching themes for a quote text
   * @param {string} text - Quote text
   * @returns {string[]} Matched theme keys
   */
  static detectThemes(text = '') {
    const normalized = (text || '').toLowerCase();
    const matches = [];

    Object.entries(this.THEME_KEYWORDS).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        matches.push(theme);
      }
    });

    return matches;
  }

  /**
   * Filter quotes by free text, book, and theme
   * @param {string[]} quotes - All quote strings
   * @param {Object} filters - Filter options
   * @returns {string[]} Filtered quote strings
   */
  static filterQuotes(quotes, filters = {}) {
    if (!Array.isArray(quotes)) {
      return [];
    }

    const query = (filters.query || '').trim().toLowerCase();
    const selectedBook = (filters.book || '').trim().toLowerCase();
    const selectedTheme = (filters.theme || '').trim().toLowerCase();

    return quotes.filter((quoteString) => {
      const parsed = this.parseQuote(quoteString);
      const book = this.extractBookName(parsed.reference).toLowerCase();
      const themes = this.detectThemes(parsed.text);

      if (query) {
        const target = `${parsed.text} ${parsed.reference}`.toLowerCase();
        if (!target.includes(query)) {
          return false;
        }
      }

      if (selectedBook && selectedBook !== 'all' && book !== selectedBook) {
        return false;
      }

      if (selectedTheme && selectedTheme !== 'all' && !themes.includes(selectedTheme)) {
        return false;
      }

      return true;
    });
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
