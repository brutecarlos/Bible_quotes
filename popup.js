/**
 * Bible Quotes Chrome Extension - Popup Script
 * Modern implementation with enhanced features and error handling
 */

class BibleQuotesPopup {
  constructor() {
    this.quotes = [];
    this.currentQuotes = [];
    this.isLoading = false;
    this.preferencesManager = PreferencesManager.getInstance();
    this.cachedElements = {};
    this.init();
  }

  /**
   * Cache DOM elements for better performance
   */
  cacheElements() {
    this.cachedElements = {
      quoteContainer: document.getElementById('quote'),
      loadingElement: document.getElementById('loading'),
      errorElement: document.getElementById('error'),
      successElement: document.getElementById('success'),
      quoteCountInput: document.getElementById('quoteCount'),
      quoteLanguageSelect: document.getElementById('quoteLanguage'),
      viewFavoritesBtn: document.getElementById('viewFavoritesBtn'),
      favoritesModal: document.getElementById('favoritesModal'),
      favoritesList: document.getElementById('favoritesList'),
      favoritesCloseBtn: document.getElementById('favoritesCloseBtn'),
      favoritesClearBtn: document.getElementById('favoritesClearBtn'),
      enableQuotesCheckbox: document.getElementById('enableQuotes'),
      enableFavoritesCheckbox: document.getElementById('enableFavorites'),
      newQuoteBtn: document.getElementById('newQuoteBtn'),
      favoriteBtn: document.getElementById('favoriteBtn'),
      shareBtn: document.getElementById('shareBtn')
    };
  }

  /**
   * Initialize the popup
   */
  async init() {
    try {
      this.cacheElements();
      await this.preferencesManager.init();
      await I18nHelper.init(this.preferencesManager.get(STORAGE_KEYS.LANGUAGE, 'en'));
      I18nHelper.translateDocument();
      this.updateUIFromPreferences();
      await this.loadQuotes();
      this.setupEventListeners();
      this.setupPreferenceListeners();
      this.displayQuotes();
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError(I18nHelper.t('popup.errorInitFailed'));
    }
  }

  /**
   * Load quotes from storage
   */
  async loadQuotes() {
    this.showLoading(true);
    
    try {
      const preferredLanguage = this.preferencesManager.get(STORAGE_KEYS.LANGUAGE, 'en');
      this.cachedElements.quoteLanguageSelect.value = preferredLanguage;
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
      
      this.showLoading(false);
    } catch (error) {
      console.error('Error loading quotes:', error);
      this.showError(I18nHelper.t('popup.errorLoadQuotes'));
      this.showLoading(false);
    }
  }

  /**
   * Update UI elements based on stored preferences
   */
  updateUIFromPreferences() {
    const quoteCount = this.preferencesManager.get(STORAGE_KEYS.QUOTE_COUNT, 1);
    const quoteLanguage = this.preferencesManager.get(STORAGE_KEYS.LANGUAGE, 'en');
    const enableQuotes = this.preferencesManager.get(STORAGE_KEYS.ENABLE_QUOTES, true);
    const enableFavorites = this.preferencesManager.get(STORAGE_KEYS.ENABLE_FAVORITES, false);
    
    this.cachedElements.quoteCountInput.value = quoteCount;
    this.cachedElements.quoteLanguageSelect.value = quoteLanguage;
    this.cachedElements.enableQuotesCheckbox.checked = enableQuotes;
    this.cachedElements.enableFavoritesCheckbox.checked = enableFavorites;
    
    // Show/hide favorites button based on preference
    this.cachedElements.favoriteBtn.style.display = enableFavorites ? 'block' : 'none';
  }

  /**
   * Setup listeners for preference changes
   */
  setupPreferenceListeners() {
    this.preferencesManager.subscribe((key, value) => {
      if (key === STORAGE_KEYS.ENABLE_FAVORITES) {
        this.cachedElements.favoriteBtn.style.display = value ? 'block' : 'none';
      }
      if (key === STORAGE_KEYS.FAVORITES) {
        // If modal is open, refresh the list
        if (this.cachedElements.favoritesModal && this.cachedElements.favoritesModal.style.display === 'flex') {
          this.renderFavoritesList();
        }
      }
    });
  }

  /**
   * Get random quotes
   */
  getRandomQuotes(count = 1) {
    return QuoteUtils.getRandomQuotes(this.quotes, count);
  }

  /**
   * Display quotes in the popup
   */
  displayQuotes() {
    const quoteCount = this.preferencesManager.get(STORAGE_KEYS.QUOTE_COUNT, 1);
    this.currentQuotes = this.getRandomQuotes(quoteCount);
    
    const quoteContainer = this.cachedElements.quoteContainer;
    quoteContainer.innerHTML = '';
    
    this.currentQuotes.forEach((quoteString, index) => {
      const quote = QuoteUtils.parseQuote(quoteString);
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
    
    if (show) {
      this.cachedElements.loadingElement.style.display = 'block';
      this.cachedElements.quoteContainer.style.display = 'none';
    } else {
      this.cachedElements.loadingElement.style.display = 'none';
      this.cachedElements.quoteContainer.style.display = 'block';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorElement = this.cachedElements.errorElement;
    if (errorElement) {
      errorElement.querySelector('p').textContent = message;
      errorElement.style.display = 'block';
      
      // Hide error after timeout
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, EXTENSION_CONFIG.ERROR_TIMEOUT);
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const successElement = this.cachedElements.successElement;
    if (successElement) {
      successElement.querySelector('p').textContent = message;
      successElement.style.display = 'block';
      
      // Hide success after timeout
      setTimeout(() => {
        successElement.style.display = 'none';
      }, EXTENSION_CONFIG.SUCCESS_TIMEOUT);
    }
  }

  /**
   * Save user preferences
   */
  async savePreferences(showSuccessMessage = true) {
    const preferences = {
      [STORAGE_KEYS.QUOTE_COUNT]: QuoteUtils.validateQuoteCount(
        this.cachedElements.quoteCountInput.value
      ),
      [STORAGE_KEYS.LANGUAGE]: this.cachedElements.quoteLanguageSelect.value,
      [STORAGE_KEYS.ENABLE_QUOTES]: this.cachedElements.enableQuotesCheckbox.checked,
      [STORAGE_KEYS.ENABLE_FAVORITES]: this.cachedElements.enableFavoritesCheckbox.checked
    };

    try {
      await this.preferencesManager.setMultiple(preferences);
      this.updateUIFromPreferences();
      if (showSuccessMessage) {
        this.showSuccess(I18nHelper.t('popup.notificationSettingsSaved'));
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      this.showError(I18nHelper.t('popup.errorStorage'));
    }
  }

  /**
   * Add current quote to favorites
   */
  async addToFavorites() {
    if (!this.currentQuotes || this.currentQuotes.length === 0) {
      this.showError(I18nHelper.t('popup.errorNoQuote'));
      return;
    }

    const currentFavorites = this.preferencesManager.get(STORAGE_KEYS.FAVORITES, []) || [];
    const newFavorites = [...currentFavorites];
    
    this.currentQuotes.forEach(quoteString => {
      if (!newFavorites.includes(quoteString)) {
        newFavorites.push(quoteString);
      }
    });

    try {
      await this.preferencesManager.set(STORAGE_KEYS.FAVORITES, newFavorites);
      this.showSuccess(I18nHelper.t('popup.notificationAddedToFavorites'));
      this.updateFavoritesButton();
    } catch (error) {
      console.error('Error adding to favorites:', error);
      this.showError(I18nHelper.t('popup.errorStorage'));
    }
  }

  /**
   * Update favorites button state
   */
  updateFavoritesButton() {
    const favoriteBtn = this.cachedElements.favoriteBtn;
    if (!this.preferencesManager.get(STORAGE_KEYS.ENABLE_FAVORITES)) return;

    const currentFavorites = this.preferencesManager.get(STORAGE_KEYS.FAVORITES, []) || [];
    
    const allInFavorites = this.currentQuotes.every(quote => 
      currentFavorites.includes(quote)
    );

    if (allInFavorites) {
      favoriteBtn.textContent = I18nHelper.t('popup.inFavorites');
      favoriteBtn.disabled = true;
    } else {
      favoriteBtn.textContent = I18nHelper.t('popup.addToFavorites');
      favoriteBtn.disabled = false;
    }
  }

  /**
   * Share current quote
   */
  async shareQuote() {
    if (!this.currentQuotes || this.currentQuotes.length === 0) {
      this.showError(I18nHelper.t('popup.errorNoQuote'));
      return;
    }

    const quoteText = this.currentQuotes.join('\n\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: I18nHelper.t('popup.shareTitle'),
          text: quoteText,
          url: 'https://chrome.google.com/webstore/detail/bible-quotes'
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(quoteText);
        this.showSuccess(I18nHelper.t('popup.notificationQuoteCopied'));
      }
    } catch (error) {
      console.error('Error sharing quote:', error);
      this.showError(I18nHelper.t('popup.errorShareFailed'));
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // New quote button
    this.cachedElements.newQuoteBtn.addEventListener('click', () => {
      if (!this.isLoading) {
        this.displayQuotes();
      }
    });

    // Quote count selector
    this.cachedElements.quoteCountInput.addEventListener('change', async () => {
      await this.savePreferences();
      this.displayQuotes();
    });

    // Enable quotes checkbox
    this.cachedElements.enableQuotesCheckbox.addEventListener('change', async () => {
      await this.savePreferences();
    });

    // Enable favorites checkbox
    this.cachedElements.enableFavoritesCheckbox.addEventListener('change', async () => {
      await this.savePreferences();
      this.updateUIFromPreferences();
    });

    // Quote language selector
    this.cachedElements.quoteLanguageSelect.addEventListener('change', async () => {
      await this.savePreferences(false);
      await I18nHelper.setLocale(this.cachedElements.quoteLanguageSelect.value);
      await this.loadQuotes();
      this.displayQuotes();
      this.showSuccess(I18nHelper.t('popup.notificationSettingsSaved'));
    });

    // Favorite button
    this.cachedElements.favoriteBtn.addEventListener('click', async () => {
      await this.addToFavorites();
    });

    // Share button
    this.cachedElements.shareBtn.addEventListener('click', async () => {
      await this.shareQuote();
    });

    // View Favorites button
    if (this.cachedElements.viewFavoritesBtn) {
      this.cachedElements.viewFavoritesBtn.addEventListener('click', () => {
        this.showFavorites();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'r' || e.key === 'R') && !this.isLoading) {
        e.preventDefault();
        this.displayQuotes();
      }
    });
    // Favorites modal close / clear handlers
    if (this.cachedElements.favoritesCloseBtn) {
      this.cachedElements.favoritesCloseBtn.addEventListener('click', () => this.closeFavorites());
    }

    if (this.cachedElements.favoritesClearBtn) {
      this.cachedElements.favoritesClearBtn.addEventListener('click', async () => {
        if (!confirm(I18nHelper.t('popup.confirmClearFavorites'))) return;
        await this.preferencesManager.set(STORAGE_KEYS.FAVORITES, []);
        this.renderFavoritesList();
        this.updateFavoritesButton();
      });
    }
  }

  /**
   * Show favorites modal and render list
   */
  showFavorites() {
    const modal = this.cachedElements.favoritesModal;
    if (!modal) return;
    modal.style.display = 'flex';
    this.renderFavoritesList();
  }

  /**
   * Close favorites modal
   */
  closeFavorites() {
    const modal = this.cachedElements.favoritesModal;
    if (!modal) return;
    modal.style.display = 'none';
  }

  /**
   * Render the favorites list inside the modal
   */
  renderFavoritesList() {
    const listEl = this.cachedElements.favoritesList;
    listEl.innerHTML = '';

    const favorites = this.preferencesManager.get(STORAGE_KEYS.FAVORITES, []) || [];
    if (!favorites || favorites.length === 0) {
      const li = document.createElement('li');
      li.className = 'favorites-item';
      li.textContent = I18nHelper.t('popup.favoritesEmpty');
      listEl.appendChild(li);
      return;
    }

    favorites.slice().reverse().forEach((quote, idx) => {
      const li = document.createElement('li');
      li.className = 'favorites-item';

      const textDiv = document.createElement('div');
      textDiv.className = 'favorites-text';
      textDiv.textContent = quote;

      const actions = document.createElement('div');
      actions.className = 'favorites-actions';

      const shareBtn = document.createElement('button');
      shareBtn.className = 'btn-small';
      shareBtn.textContent = I18nHelper.t('popup.favoritesShare');
      shareBtn.addEventListener('click', async () => {
        try {
          if (navigator.share) {
            await navigator.share({ title: I18nHelper.t('popup.shareTitle'), text: quote });
          } else {
            await navigator.clipboard.writeText(quote);
            this.showSuccess(I18nHelper.t('popup.notificationQuoteCopied'));
          }
        } catch (e) {
          console.error('Share failed', e);
        }
      });

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-small';
      removeBtn.textContent = I18nHelper.t('popup.favoritesRemove');
      removeBtn.addEventListener('click', async () => {
        await this.removeFavoriteByValue(quote);
        this.renderFavoritesList();
        this.updateFavoritesButton();
      });

      actions.appendChild(shareBtn);
      actions.appendChild(removeBtn);

      li.appendChild(textDiv);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
  }

  /**
   * Remove favorite by exact quote value
   */
  async removeFavoriteByValue(quoteValue) {
    const current = this.preferencesManager.get(STORAGE_KEYS.FAVORITES, []) || [];
    const updated = current.filter(q => q !== quoteValue);
    await this.preferencesManager.set(STORAGE_KEYS.FAVORITES, updated);
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BibleQuotesPopup();
});
