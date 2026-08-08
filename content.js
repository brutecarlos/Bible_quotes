/**
 * Bible Quotes Chrome Extension - Content Script
 * Enhanced implementation for injecting quotes into Google search results
 */

class BibleQuotesContent {
  constructor() {
    this.quotes = [];
    this.preferencesManager = PreferencesManager.getInstance();
    this.isInitialized = false;
    this.unsubscribePreferences = null;
    this.init();
  }

  /**
   * Initialize the content script
   */
  async init() {
    try {
      await this.preferencesManager.init();
      await I18nHelper.init(this.preferencesManager.get(STORAGE_KEYS.LANGUAGE, 'en'));
      
      if (this.preferencesManager.get(STORAGE_KEYS.ENABLE_QUOTES)) {
        await this.loadQuotes();
        this.injectQuotes();
      }
      
      this.isInitialized = true;
      this.setupPreferenceListener();
    } catch (error) {
      console.error('Bible Quotes Content Script initialization error:', error);
    }
  }

  /**
   * Load quotes from Chrome storage
   */
  async loadQuotes() {
    try {
      const preferredLanguage = this.preferencesManager.get(STORAGE_KEYS.LANGUAGE, 'en');
      const stored = await StorageHelper.getLocal([STORAGE_KEYS.QUOTES, STORAGE_KEYS.QUOTE_LANGUAGE]);
      const savedQuotes = stored[STORAGE_KEYS.QUOTES] || [];
      const savedLanguage = stored[STORAGE_KEYS.QUOTE_LANGUAGE] || null;

      if (savedQuotes.length === 0 || savedLanguage !== preferredLanguage) {
        const data = await StorageHelper.fetchQuotesFile(preferredLanguage);
        this.quotes = QuoteUtils.flattenQuotesData(data);
        await StorageHelper.storeQuotes(this.quotes, preferredLanguage);
      } else {
        this.quotes = savedQuotes;
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
      this.quotes = [];
    }
  }

  /**
   * Get random quotes from the loaded data
   */
  getRandomQuotes(count = 1) {
    return QuoteUtils.getRandomQuotes(this.quotes, count);
  }

  /**
   * Create and inject quotes into the Google search page
   */
  injectQuotes() {
    const count = this.preferencesManager.get(STORAGE_KEYS.QUOTE_COUNT, 1);
    const quotes = this.getRandomQuotes(count);
    const quotesContainer = this.createQuotesContainer(quotes);
    
    // Find the best insertion point
    const insertionPoint = this.findInsertionPoint();
    if (insertionPoint) {
      insertionPoint.insertBefore(quotesContainer, insertionPoint.firstChild);
      this.addQuoteStyles();
    } else {
      console.warn('Bible Quotes: Could not find insertion point for quotes');
    }
  }

  /**
   * Find the best place to insert quotes on Google search results
   */
  findInsertionPoint() {
    for (const selector of EXTENSION_CONFIG.CONTENT_SCRIPT_SELECTORS) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    // Fallback: insert at the beginning of body
    return document.body;
  }

  /**
   * Create the quotes container with modern styling
   */
  createQuotesContainer(quotes) {
    const container = document.createElement('div');
    container.id = 'bible-quotes-container';
    container.className = 'bible-quotes-modern';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'bible-quotes-header';
    header.innerHTML = `
      <span class="bible-quotes-icon">📖</span>
      <span class="bible-quotes-title">${I18nHelper.t('content.headerTitle')}</span>
      <button class="bible-quotes-close" aria-label="${I18nHelper.t('content.closeButton')}">×</button>
    `;
    container.appendChild(header);

    // Add quotes
    const quotesList = document.createElement('div');
    quotesList.className = 'bible-quotes-list';
    
    quotes.forEach(quote => {
      const quoteElement = this.createQuoteElement(quote);
      quotesList.appendChild(quoteElement);
    });
    
    container.appendChild(quotesList);

    // Add close functionality
    const closeBtn = container.querySelector('.bible-quotes-close');
    closeBtn.addEventListener('click', () => {
      container.style.display = 'none';
    });

    return container;
  }

  /**
   * Create individual quote element
   */
  createQuoteElement(quoteString) {
    const quoteDiv = document.createElement('div');
    quoteDiv.className = 'bible-quote-item';
    
    const { text, reference } = QuoteUtils.parseQuote(quoteString);
    
    const textElement = document.createElement('div');
    textElement.className = 'bible-quote-text';
    textElement.textContent = text;
    
    const referenceElement = document.createElement('div');
    referenceElement.className = 'bible-quote-reference';
    referenceElement.textContent = reference;
    
    quoteDiv.appendChild(textElement);
    quoteDiv.appendChild(referenceElement);

      const actionRow = document.createElement('div');
      actionRow.className = 'bible-quote-actions';

    // Always include favorites controls (inline star + action button)
    // Inline star (always visible) for quick favoriting
    const inlineStar = document.createElement('button');
    inlineStar.type = 'button';
    inlineStar.className = 'bible-quote-favorite-inline';
    inlineStar.setAttribute('aria-label', I18nHelper.t('content.favoriteAriaLabel'));
    inlineStar.textContent = '☆';
    inlineStar.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.addQuoteToFavorites(quoteString, inlineStar);
    });
    referenceElement.appendChild(inlineStar);

      const favoriteButton = document.createElement('button');
      favoriteButton.type = 'button';
      favoriteButton.className = 'bible-quote-favorite-button';
      favoriteButton.textContent = I18nHelper.t('content.favorite');

      const currentFavorites = this.preferencesManager.get(STORAGE_KEYS.FAVORITES, []) || [];
      const isFav = QuoteUtils.isInFavorites(quoteString, currentFavorites);
      inlineStar.textContent = isFav ? '★' : '☆';
      favoriteButton.textContent = isFav ? I18nHelper.t('content.unfavorite') : I18nHelper.t('content.favorite');

      favoriteButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.addQuoteToFavorites(quoteString, favoriteButton);
      });

      actionRow.appendChild(favoriteButton);
      quoteDiv.appendChild(actionRow);

    return quoteDiv;
  }

  /**
   * Add a quote to the favorites list
   */
  async addQuoteToFavorites(quoteString, button) {
    try {
      const currentFavorites = this.preferencesManager.get(STORAGE_KEYS.FAVORITES, []) || [];
      const isFav = QuoteUtils.isInFavorites(quoteString, currentFavorites);

      let updatedFavorites;
      if (isFav) {
        // remove
        updatedFavorites = currentFavorites.filter(q => q !== quoteString);
      } else {
        // add
        updatedFavorites = [...currentFavorites, quoteString];
      }

      await this.preferencesManager.set(STORAGE_KEYS.FAVORITES, updatedFavorites);

      // Update UI for both inline star and action button within the same quote item
      const quoteItem = button.closest('.bible-quote-item');
      if (quoteItem) {
        const inline = quoteItem.querySelector('.bible-quote-favorite-inline');
        const actionBtn = quoteItem.querySelector('.bible-quote-favorite-button');

        if (isFav) {
          if (inline) inline.textContent = '☆';
          if (actionBtn) actionBtn.textContent = I18nHelper.t('content.favorite');
          this.showInlineMessage(button, I18nHelper.t('content.removedFromFavorites'));
        } else {
          if (inline) inline.textContent = '★';
          if (actionBtn) actionBtn.textContent = I18nHelper.t('content.unfavorite');
          this.showInlineMessage(button, I18nHelper.t('content.addedToFavorites'));
        }
      }

    } catch (error) {
      console.error('Error toggling favorite:', error);
      this.showInlineMessage(button, I18nHelper.t('content.favoriteUpdateFailed'));
    }
  }

  /**
   * Show a temporary inline message next to a button
   */
  showInlineMessage(targetButton, message) {
    const messageEl = document.createElement('span');
    messageEl.className = 'bible-quote-inline-message';
    messageEl.textContent = message;
    targetButton.insertAdjacentElement('afterend', messageEl);

    setTimeout(() => {
      messageEl.remove();
    }, 2500);
  }

  /**
   * Add CSS styles for the quotes
   */
  addQuoteStyles() {
    if (document.getElementById('bible-quotes-styles')) {
      return; // Styles already added
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'bible-quotes-styles';
    styleElement.textContent = `
      .bible-quotes-modern {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        margin: 20px 0;
        padding: 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      }

      .bible-quotes-header {
        background: rgba(255, 255, 255, 0.1);
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .bible-quotes-icon {
        font-size: 18px;
        margin-right: 8px;
      }

      .bible-quotes-title {
        color: white;
        font-weight: 600;
        font-size: 16px;
        flex-grow: 1;
      }

      .bible-quotes-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        transition: all 0.3s ease;
      }

      .bible-quotes-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }

      .bible-quotes-list {
        padding: 20px;
      }

      .bible-quote-item {
        margin-bottom: 15px;
        padding: 18px 16px 18px 16px;
        background: rgba(255, 255, 255, 0.98);
        border-radius: 8px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        transition: all 0.25s ease;
        border-left: 6px solid #4b6ef6;
        position: relative;
      }

      .bible-quote-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .bible-quote-item:last-child {
        margin-bottom: 0;
      }

      .bible-quote-text {
        font-size: 16px;
        line-height: 1.6;
        color: #2c3e50;
        margin-bottom: 10px;
        font-style: italic;
      }

      .bible-quote-reference {
        font-size: 14px;
        font-weight: 600;
        color: #667eea;
        text-align: right;
        font-style: normal;
      }

      .bible-quote-actions {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .bible-quote-favorite-button {
        background: linear-gradient(90deg,#ffd93d,#ffb347);
        border: none;
        color: #1f2d3d;
        padding: 10px 16px;
        border-radius: 999px;
        font-weight: 800;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(255,189,60,0.18);
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }

      .bible-quote-favorite-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 28px rgba(255,189,60,0.22);
      }

      .bible-quote-favorite-button:disabled {
        background: #cfd8dc;
        color: #55606a;
        cursor: default;
        box-shadow: none;
      }

      /* Inline star badge positioned top-right for immediate visibility */
      .bible-quote-favorite-inline {
        position: absolute;
        top: 10px;
        right: 12px;
        background: rgba(255,255,255,0.95);
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: #ff9f1c;
        border: 2px solid rgba(255,159,28,0.12);
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      }

      .bible-quote-inline-message {
        margin-left: 12px;
        color: #ffffff;
        background: rgba(0, 0, 0, 0.65);
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 12px;
        align-self: center;
      }

      .bible-quote-tooltip {
        position: absolute;
        top: 48px;
        right: 12px;
        background: rgba(0,0,0,0.85);
        color: #fff;
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 12px;
        z-index: 10001;
        max-width: 220px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.22);
      }
      .bible-quote-inline-message {
        margin-left: 12px;
        color: #ffffff;
        background: rgba(0, 0, 0, 0.65);
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 12px;
        align-self: center;
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .bible-quote-item {
          background: rgba(44, 62, 80, 0.95);
        }
        
        .bible-quote-text {
          color: #ecf0f1;
        }
        
        .bible-quote-reference {
          color: #74b9ff;
        }
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .bible-quotes-modern {
          margin: 10px;
          border-radius: 8px;
        }
        
        .bible-quotes-header {
          padding: 10px 15px;
        }
        
        .bible-quotes-list {
          padding: 15px;
        }
        
        .bible-quote-text {
          font-size: 14px;
        }
      }

      /* Animation */
      .bible-quotes-modern {
        animation: slideInDown 0.5s ease-out;
      }

      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;

    document.head.appendChild(styleElement);
    // Show tooltip for first-time users (once per browser install)
    try {
      const shown = localStorage.getItem('bible_quotes_fav_tooltip_shown');
      if (!shown) {
        // create a transient tooltip near the first injected quote
        setTimeout(() => {
          const container = document.getElementById('bible-quotes-container');
          if (!container) return;
          const firstItem = container.querySelector('.bible-quote-item');
          if (!firstItem) return;
          const tooltip = document.createElement('div');
          tooltip.className = 'bible-quote-tooltip';
          tooltip.textContent = I18nHelper.t('content.tooltipFavorite');
          firstItem.appendChild(tooltip);
          setTimeout(() => tooltip.remove(), 6000);
          try { localStorage.setItem('bible_quotes_fav_tooltip_shown', '1'); } catch(e) {}
        }, 800);
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  /**
   * Listen for preference changes
   */
  setupPreferenceListener() {
    // Subscribe to preference changes
    this.unsubscribePreferences = this.preferencesManager.subscribe(async (key, value) => {
      if (key === STORAGE_KEYS.ENABLE_QUOTES) {
        if (value) {
          await this.loadQuotes();
          this.removeQuotes();
          this.injectQuotes();
        } else {
          this.removeQuotes();
        }
      }

      if (key === STORAGE_KEYS.LANGUAGE) {
        await I18nHelper.setLocale(value);

        if (this.preferencesManager.get(STORAGE_KEYS.ENABLE_QUOTES)) {
          await this.loadQuotes();
          this.removeQuotes();
          this.injectQuotes();
        }
      }
    });
  }

  /**
   * Remove quotes from the page
   */
  removeQuotes() {
    const container = document.getElementById('bible-quotes-container');
    if (container) {
      container.remove();
    }
  }

  /**
   * Cleanup - called when script unloads
   */
  cleanup() {
    if (this.unsubscribePreferences) {
      this.unsubscribePreferences();
    }
    this.removeQuotes();
  }
}

// Initialize the content script
const bibleQuotes = new BibleQuotesContent();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  bibleQuotes.cleanup();
});
