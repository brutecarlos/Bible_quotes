/**
 * Bible Quotes Chrome Extension - Background Script
 * Enhanced service worker with better error handling and performance
 */

// Load utility modules using service worker importScripts
// Files must be specified with proper path
importScripts(
  'constants.js',
  'utils.js',
  'storageHelper.js',
  'preferencesManager.js'
);

class BibleQuotesBackground {
  constructor() {
    this.isInitialized = false;
    this.preferencesManager = PreferencesManager.getInstance();
    this.init();
  }

  /**
   * Initialize the background script
   */
  async init() {
    try {
      await this.preferencesManager.init();
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
      const existingQuotes = await StorageHelper.getQuotes();
      if (existingQuotes && existingQuotes.length > 0) {
        console.log('Quotes already loaded in storage');
        return existingQuotes;
      }

      console.log('Loading quotes from JSON file...');
      const preferredLanguage = this.preferencesManager.get(STORAGE_KEYS.LANGUAGE, null);
      const data = await StorageHelper.fetchQuotesFile(preferredLanguage);

      // Process and flatten quotes
      const quotes = QuoteUtils.flattenQuotesData(data);

      // Store in Chrome storage
      await StorageHelper.storeQuotes(quotes, preferredLanguage);

      console.log(`Successfully loaded ${quotes.length} quotes into storage`);
      return quotes;

    } catch (error) {
      console.error('Error loading quotes:', error);
      throw error;
    }
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
      // Preferences already initialized by PreferencesManager

      // Show welcome notification
      this.showNotification(
        NOTIFICATION_MESSAGES.INSTALLED.title,
        NOTIFICATION_MESSAGES.INSTALLED.message
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
      console.log(`Updated from version ${previousVersion} to ${EXTENSION_CONFIG.VERSION}`);

      // Reload quotes if needed
      await this.loadQuotesIntoStorage();

      // Show update notification
      this.showNotification(
        NOTIFICATION_MESSAGES.UPDATED.title,
        NOTIFICATION_MESSAGES.UPDATED.message
      );
    } catch (error) {
      console.error('Error during update:', error);
    }
  }

  /**
   * Handle messages from other parts of the extension
   */
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case MESSAGE_ACTIONS.GET_QUOTES:
          const quotes = await StorageHelper.getQuotes();
          sendResponse({ success: true, quotes });
          break;

        case MESSAGE_ACTIONS.REFRESH_QUOTES:
          await this.loadQuotesIntoStorage();
          sendResponse({ success: true });
          break;

        case MESSAGE_ACTIONS.GET_STATS:
          const stats = await this.getExtensionStats();
          sendResponse({ success: true, stats });
          break;

        case MESSAGE_ACTIONS.GET_PREFERENCES:
          const preferences = this.preferencesManager.getAll();
          sendResponse({ success: true, preferences });
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
    if (namespace === 'local' && changes[STORAGE_KEYS.QUOTES]) {
      console.log('Quotes updated in storage');
    }
  }

  /**
   * Get extension statistics
   */
  async getExtensionStats() {
    try {
      const quotes = await StorageHelper.getQuotes();
      const preferences = this.preferencesManager.getAll();

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
   * Show notification to user
   */
  showNotification(title, message) {
    // Check if notifications are enabled
    if (this.preferencesManager.get(STORAGE_KEYS.ENABLE_NOTIFICATIONS, true)) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: EXTENSION_CONFIG.NOTIFICATION_ICON,
        title: title,
        message: message
      });
    }
  }

  /**
   * Clean up old data (for future use)
   */
  async cleanupOldData() {
    try {
      const result = await StorageHelper.getLocal(STORAGE_KEYS.LAST_UPDATED);
      const lastUpdated = result[STORAGE_KEYS.LAST_UPDATED];

      // Clean up if data is older than threshold days
      const daysOld = QuoteUtils.daysBetween(lastUpdated);
      if (daysOld > EXTENSION_CONFIG.CLEANUP_THRESHOLD_DAYS) {
        console.log('Cleaning up old data...');
        await this.loadQuotesIntoStorage();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Initialize the background script after all imports are loaded
const bibleQuotesBackground = new BibleQuotesBackground();

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BibleQuotesBackground;
}
