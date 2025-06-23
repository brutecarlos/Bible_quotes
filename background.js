/**
 * Bible Quotes Chrome Extension - Background Script
 * Enhanced service worker with better error handling and performance
 */

class BibleQuotesBackground {
  constructor() {
    this.isInitialized = false;
    this.quotesCache = null;
    this.init();
  }

  /**
   * Initialize the background script
   */
  async init() {
    try {
      await this.loadQuotesIntoStorage();
      this.setupEventListeners();
      this.isInitialized = true;
      console.log('Bible Quotes Background Script initialized successfully');
    } catch (error) {
      console.error('Bible Quotes Background Script initialization error:', error);
    }
  }

  /**
   * Load quotes from JSON file and store in Chrome storage
   */
  async loadQuotesIntoStorage() {
    try {
      // Check if quotes are already loaded
      const existingQuotes = await this.getQuotesFromStorage();
      if (existingQuotes && existingQuotes.length > 0) {
        console.log('Quotes already loaded in storage');
        return existingQuotes;
      }

      console.log('Loading quotes from JSON file...');
      const response = await fetch(chrome.runtime.getURL('quotes.json'));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quotes.json: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.books || !Array.isArray(data.books)) {
        throw new Error('Invalid quotes data structure');
      }

      // Process and flatten quotes
      const quotes = this.processQuotesData(data);
      
      // Store in Chrome storage
      await this.storeQuotes(quotes);
      
      console.log(`Successfully loaded ${quotes.length} quotes into storage`);
      return quotes;
      
    } catch (error) {
      console.error('Error loading quotes:', error);
      throw error;
    }
  }

  /**
   * Process the quotes data structure into a flat array
   */
  processQuotesData(data) {
    const quotes = [];
    
    data.books.forEach(book => {
      if (!book.chapters || !Array.isArray(book.chapters)) {
        console.warn(`Invalid book structure for: ${book.name}`);
        return;
      }

      book.chapters.forEach(chapter => {
        if (!chapter.verses || !Array.isArray(chapter.verses)) {
          console.warn(`Invalid chapter structure for: ${book.name} ${chapter.number}`);
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
   * Store quotes in Chrome local storage
   */
  async storeQuotes(quotes) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ 
        quotes: quotes,
        lastUpdated: Date.now(),
        version: '2.0.0'
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          this.quotesCache = quotes;
          resolve();
        }
      });
    });
  }

  /**
   * Get quotes from Chrome storage
   */
  async getQuotesFromStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['quotes', 'lastUpdated'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.quotes || []);
        }
      });
    });
  }

  /**
   * Setup event listeners for extension events
   */
  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('Bible Quotes Extension installed/updated:', details.reason);
      
      if (details.reason === 'install') {
        this.handleFirstInstall();
      } else if (details.reason === 'update') {
        this.handleUpdate(details.previousVersion);
      }
    });

    // Handle extension startup
    chrome.runtime.onStartup.addListener(() => {
      console.log('Bible Quotes Extension started');
      this.init();
    });

    // Handle messages from popup and content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChanges(changes, namespace);
    });
  }

  /**
   * Handle first-time installation
   */
  async handleFirstInstall() {
    try {
      // Set default preferences
      await this.setDefaultPreferences();
      
      // Show welcome notification
      this.showNotification(
        'Bible Quotes Extension Installed!',
        'Click the extension icon to get started with daily Bible quotes.'
      );
      
      console.log('First install completed successfully');
    } catch (error) {
      console.error('Error during first install:', error);
    }
  }

  /**
   * Handle extension updates
   */
  async handleUpdate(previousVersion) {
    try {
      console.log(`Updated from version ${previousVersion} to 2.0.0`);
      
      // Reload quotes if needed
      await this.loadQuotesIntoStorage();
      
      // Show update notification
      this.showNotification(
        'Bible Quotes Extension Updated!',
        'New features and improvements are now available.'
      );
    } catch (error) {
      console.error('Error during update:', error);
    }
  }

  /**
   * Set default user preferences
   */
  async setDefaultPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({
        quoteCount: 1,
        enableQuotes: true,
        enableFavorites: false,
        favorites: [],
        theme: 'auto',
        notifications: true
      }, resolve);
    });
  }

  /**
   * Handle messages from other parts of the extension
   */
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getQuotes':
          const quotes = await this.getQuotesFromStorage();
          sendResponse({ success: true, quotes });
          break;
          
        case 'refreshQuotes':
          await this.loadQuotesIntoStorage();
          sendResponse({ success: true });
          break;
          
        case 'getStats':
          const stats = await this.getExtensionStats();
          sendResponse({ success: true, stats });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle storage changes
   */
  handleStorageChanges(changes, namespace) {
    if (namespace === 'local' && changes.quotes) {
      console.log('Quotes updated in storage');
      this.quotesCache = changes.quotes.newValue;
    }
  }

  /**
   * Get extension statistics
   */
  async getExtensionStats() {
    try {
      const quotes = await this.getQuotesFromStorage();
      const preferences = await this.getUserPreferences();
      
      return {
        totalQuotes: quotes.length,
        userPreferences: preferences,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        quoteCount: 1,
        enableQuotes: true,
        enableFavorites: false
      }, resolve);
    });
  }

  /**
   * Show notification to user
   */
  showNotification(title, message) {
    // Check if notifications are enabled
    chrome.storage.sync.get(['notifications'], (result) => {
      if (result.notifications !== false) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon48.png',
          title: title,
          message: message
        });
      }
    });
  }

  /**
   * Clean up old data (for future use)
   */
  async cleanupOldData() {
    try {
      const result = await chrome.storage.local.get(['lastUpdated']);
      const lastUpdated = result.lastUpdated;
      
      // Clean up if data is older than 30 days
      if (lastUpdated && (Date.now() - lastUpdated) > 30 * 24 * 60 * 60 * 1000) {
        console.log('Cleaning up old data...');
        await this.loadQuotesIntoStorage();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Initialize the background script
const bibleQuotesBackground = new BibleQuotesBackground();

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BibleQuotesBackground;
}