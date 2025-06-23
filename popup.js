/**
 * Bible Quotes Chrome Extension - Popup Script
 * Modern implementation with enhanced features and error handling
 */

class BibleQuotesPopup {
  constructor() {
    this.quotesData = {};
    this.currentQuotes = [];
    this.isLoading = false;
    this.init();
  }

  /**
   * Initialize the popup
   */
  async init() {
    try {
      await this.loadUserPreferences();
      await this.loadQuotes();
      this.setupEventListeners();
      this.displayQuotes();
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError('Failed to initialize the extension');
    }
  }

  /**
   * Load quotes from JSON file
   */
  async loadQuotes() {
    this.showLoading(true);
    
    try {
      const response = await fetch(chrome.runtime.getURL('quotes.json'));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      this.quotesData = await response.json();
      this.showLoading(false);
    } catch (error) {
      console.error('Error loading quotes:', error);
      this.showError('Could not load quotes. Please check your internet connection.');
      this.showLoading(false);
    }
  }

  /**
   * Load user preferences from Chrome storage
   */
  async loadUserPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        quoteCount: 1,
        enableQuotes: true,
        enableFavorites: false,
        favorites: []
      }, (result) => {
        this.preferences = result;
        this.updateUIFromPreferences();
        resolve(result);
      });
    });
  }

  /**
   * Update UI elements based on stored preferences
   */
  updateUIFromPreferences() {
    const { quoteCount, enableQuotes, enableFavorites } = this.preferences;
    
    document.getElementById('quoteCount').value = quoteCount;
    document.getElementById('enableQuotes').checked = enableQuotes;
    document.getElementById('enableFavorites').checked = enableFavorites;
    
    // Show/hide favorites button based on preference
    const favoriteBtn = document.getElementById('favoriteBtn');
    favoriteBtn.style.display = enableFavorites ? 'block' : 'none';
  }

  /**
   * Get random quotes from the loaded data
   */
  getRandomQuotes(count = 1) {
    if (!this.quotesData.books || !Array.isArray(this.quotesData.books)) {
      return [{ reference: "Error", text: "No quotes available." }];
    }

    const allQuotes = [];
    
    this.quotesData.books.forEach(book => {
      book.chapters.forEach(chapter => {
        chapter.verses.forEach(verse => {
          if (verse.text && verse.reference) {
            allQuotes.push({
              reference: verse.reference,
              text: verse.text,
              book: book.name,
              chapter: chapter.number
            });
          }
        });
      });
    });

    if (allQuotes.length === 0) {
      return [{ reference: "Error", text: "No quotes available." }];
    }

    // Get unique random quotes
    const randomQuotes = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < Math.min(count, allQuotes.length); i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * allQuotes.length);
      } while (usedIndices.has(randomIndex));
      
      usedIndices.add(randomIndex);
      randomQuotes.push(allQuotes[randomIndex]);
    }

    return randomQuotes;
  }

  /**
   * Display quotes in the popup
   */
  displayQuotes() {
    const quoteCount = parseInt(document.getElementById('quoteCount').value, 10);
    this.currentQuotes = this.getRandomQuotes(quoteCount);
    
    const quoteContainer = document.getElementById('quote');
    quoteContainer.innerHTML = '';
    
    this.currentQuotes.forEach((quote, index) => {
      const quoteElement = this.createQuoteElement(quote, index);
      quoteContainer.appendChild(quoteElement);
    });

    // Update favorites button state
    this.updateFavoritesButton();
  }

  /**
   * Create a quote element with modern styling
   */
  createQuoteElement(quote, index) {
    const quoteDiv = document.createElement('div');
    quoteDiv.className = 'quote fade-in';
    quoteDiv.setAttribute('data-quote-index', index);
    
    const textDiv = document.createElement('div');
    textDiv.className = 'quote-text';
    textDiv.textContent = quote.text;
    
    const referenceDiv = document.createElement('div');
    referenceDiv.className = 'quote-reference';
    referenceDiv.textContent = quote.reference;
    
    quoteDiv.appendChild(textDiv);
    quoteDiv.appendChild(referenceDiv);
    
    return quoteDiv;
  }

  /**
   * Show loading state
   */
  showLoading(show) {
    this.isLoading = show;
    const loadingElement = document.getElementById('loading');
    const quoteContainer = document.getElementById('quote');
    
    if (show) {
      loadingElement.style.display = 'block';
      quoteContainer.style.display = 'none';
    } else {
      loadingElement.style.display = 'none';
      quoteContainer.style.display = 'block';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.querySelector('p').textContent = message;
    errorElement.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const successElement = document.getElementById('success');
    successElement.querySelector('p').textContent = message;
    successElement.style.display = 'block';
    
    // Hide success after 3 seconds
    setTimeout(() => {
      successElement.style.display = 'none';
    }, 3000);
  }

  /**
   * Save user preferences
   */
  async savePreferences() {
    const preferences = {
      quoteCount: parseInt(document.getElementById('quoteCount').value, 10),
      enableQuotes: document.getElementById('enableQuotes').checked,
      enableFavorites: document.getElementById('enableFavorites').checked
    };

    return new Promise((resolve) => {
      chrome.storage.sync.set(preferences, () => {
        this.preferences = { ...this.preferences, ...preferences };
        this.showSuccess('Settings saved successfully!');
        resolve();
      });
    });
  }

  /**
   * Add current quote to favorites
   */
  async addToFavorites() {
    if (!this.currentQuotes || this.currentQuotes.length === 0) {
      this.showError('No quote to add to favorites');
      return;
    }

    const currentFavorites = this.preferences.favorites || [];
    const newFavorites = [...currentFavorites];
    
    this.currentQuotes.forEach(quote => {
      const quoteString = `${quote.text} - ${quote.reference}`;
      if (!newFavorites.includes(quoteString)) {
        newFavorites.push(quoteString);
      }
    });

    return new Promise((resolve) => {
      chrome.storage.sync.set({ favorites: newFavorites }, () => {
        this.preferences.favorites = newFavorites;
        this.showSuccess('Added to favorites!');
        this.updateFavoritesButton();
        resolve();
      });
    });
  }

  /**
   * Update favorites button state
   */
  updateFavoritesButton() {
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (!this.preferences.enableFavorites) return;

    const currentFavorites = this.preferences.favorites || [];
    const currentQuoteStrings = this.currentQuotes.map(q => `${q.text} - ${q.reference}`);
    
    const allInFavorites = currentQuoteStrings.every(quote => 
      currentFavorites.includes(quote)
    );

    if (allInFavorites) {
      favoriteBtn.textContent = '⭐ In Favorites';
      favoriteBtn.disabled = true;
    } else {
      favoriteBtn.textContent = '⭐ Add to Favorites';
      favoriteBtn.disabled = false;
    }
  }

  /**
   * Share current quote
   */
  async shareQuote() {
    if (!this.currentQuotes || this.currentQuotes.length === 0) {
      this.showError('No quote to share');
      return;
    }

    const quoteText = this.currentQuotes.map(q => 
      `${q.text} - ${q.reference}`
    ).join('\n\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Bible Quote',
          text: quoteText,
          url: 'https://chrome.google.com/webstore/detail/bible-quotes'
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(quoteText);
        this.showSuccess('Quote copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing quote:', error);
      this.showError('Failed to share quote');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // New quote button
    document.getElementById('newQuoteBtn').addEventListener('click', () => {
      if (!this.isLoading) {
        this.displayQuotes();
      }
    });

    // Quote count selector
    document.getElementById('quoteCount').addEventListener('change', async () => {
      await this.savePreferences();
      this.displayQuotes();
    });

    // Enable quotes checkbox
    document.getElementById('enableQuotes').addEventListener('change', async () => {
      await this.savePreferences();
    });

    // Enable favorites checkbox
    document.getElementById('enableFavorites').addEventListener('change', async () => {
      await this.savePreferences();
      this.updateUIFromPreferences();
    });

    // Favorite button
    document.getElementById('favoriteBtn').addEventListener('click', async () => {
      await this.addToFavorites();
    });

    // Share button
    document.getElementById('shareBtn').addEventListener('click', async () => {
      await this.shareQuote();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (!this.isLoading) {
          this.displayQuotes();
        }
      }
    });
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BibleQuotesPopup();
});
