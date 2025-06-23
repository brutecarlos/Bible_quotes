/**
 * Bible Quotes Chrome Extension - Options Page Script
 * Handles all options page functionality including settings, statistics, and data management
 */

class BibleQuotesOptions {
  constructor() {
    this.preferences = {};
    this.stats = {};
    this.init();
  }

  /**
   * Initialize the options page
   */
  async init() {
    try {
      await this.loadPreferences();
      await this.loadStatistics();
      this.setupEventListeners();
      this.updateUI();
      console.log('Bible Quotes Options page initialized');
    } catch (error) {
      console.error('Error initializing options page:', error);
      this.showError('Failed to load options');
    }
  }

  /**
   * Load user preferences from Chrome storage
   */
  async loadPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        quoteCount: 1,
        enableQuotes: true,
        enableFavorites: false,
        enableNotifications: true,
        enableAutoRefresh: false,
        enableGoogleQuotes: true,
        enableBingQuotes: false,
        enableDuckDuckGoQuotes: false,
        favorites: [],
        installDate: Date.now()
      }, (result) => {
        this.preferences = result;
        resolve(result);
      });
    });
  }

  /**
   * Load extension statistics
   */
  async loadStatistics() {
    try {
      // Get quotes count
      const quotesResult = await this.getQuotesFromStorage();
      const totalQuotes = quotesResult.length;
      
      // Get favorites count
      const favoritesCount = this.preferences.favorites?.length || 0;
      
      // Calculate days installed
      const installDate = this.preferences.installDate || Date.now();
      const daysInstalled = Math.floor((Date.now() - installDate) / (1000 * 60 * 60 * 24));
      
      this.stats = {
        totalQuotes,
        favoritesCount,
        daysInstalled,
        version: '2.0.0'
      };
    } catch (error) {
      console.error('Error loading statistics:', error);
      this.stats = {
        totalQuotes: 0,
        favoritesCount: 0,
        daysInstalled: 0,
        version: '2.0.0'
      };
    }
  }

  /**
   * Get quotes from storage
   */
  async getQuotesFromStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['quotes'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.quotes || []);
        }
      });
    });
  }

  /**
   * Update the UI with current preferences and statistics
   */
  updateUI() {
    // Update form elements
    document.getElementById('defaultQuoteCount').value = this.preferences.quoteCount;
    document.getElementById('enableNotifications').checked = this.preferences.enableNotifications;
    document.getElementById('enableAutoRefresh').checked = this.preferences.enableAutoRefresh;
    document.getElementById('enableGoogleQuotes').checked = this.preferences.enableGoogleQuotes;
    document.getElementById('enableBingQuotes').checked = this.preferences.enableBingQuotes;
    document.getElementById('enableDuckDuckGoQuotes').checked = this.preferences.enableDuckDuckGoQuotes;
    document.getElementById('enableFavorites').checked = this.preferences.enableFavorites;

    // Update statistics
    document.getElementById('totalQuotes').textContent = this.stats.totalQuotes.toLocaleString();
    document.getElementById('favoriteCount').textContent = this.stats.favoritesCount;
    document.getElementById('daysInstalled').textContent = this.stats.daysInstalled;
  }

  /**
   * Setup event listeners for all interactive elements
   */
  setupEventListeners() {
    // General settings
    document.getElementById('defaultQuoteCount').addEventListener('change', (e) => {
      this.preferences.quoteCount = parseInt(e.target.value, 10);
      this.savePreferences();
    });

    document.getElementById('enableNotifications').addEventListener('change', (e) => {
      this.preferences.enableNotifications = e.target.checked;
      this.savePreferences();
    });

    document.getElementById('enableAutoRefresh').addEventListener('change', (e) => {
      this.preferences.enableAutoRefresh = e.target.checked;
      this.savePreferences();
    });

    // Search engine settings
    document.getElementById('enableGoogleQuotes').addEventListener('change', (e) => {
      this.preferences.enableGoogleQuotes = e.target.checked;
      this.savePreferences();
    });

    document.getElementById('enableBingQuotes').addEventListener('change', (e) => {
      this.preferences.enableBingQuotes = e.target.checked;
      this.savePreferences();
    });

    document.getElementById('enableDuckDuckGoQuotes').addEventListener('change', (e) => {
      this.preferences.enableDuckDuckGoQuotes = e.target.checked;
      this.savePreferences();
    });

    // Favorites settings
    document.getElementById('enableFavorites').addEventListener('change', (e) => {
      this.preferences.enableFavorites = e.target.checked;
      this.savePreferences();
    });

    // Favorites management buttons
    document.getElementById('exportFavorites').addEventListener('click', () => {
      this.exportFavorites();
    });

    document.getElementById('importFavorites').addEventListener('click', () => {
      this.importFavorites();
    });

    document.getElementById('clearFavorites').addEventListener('click', () => {
      this.clearFavorites();
    });

    // Data management buttons
    document.getElementById('exportData').addEventListener('click', () => {
      this.exportAllData();
    });

    document.getElementById('importData').addEventListener('click', () => {
      this.importAllData();
    });

    document.getElementById('resetData').addEventListener('click', () => {
      this.resetToDefaults();
    });

    // Footer links
    document.getElementById('privacyLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openPrivacyPolicy();
    });

    document.getElementById('supportLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.openSupport();
    });
  }

  /**
   * Save preferences to Chrome storage
   */
  async savePreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.set(this.preferences, () => {
        this.showSuccess('Settings saved successfully!');
        resolve();
      });
    });
  }

  /**
   * Export favorites to JSON file
   */
  async exportFavorites() {
    try {
      const favorites = this.preferences.favorites || [];
      const dataStr = JSON.stringify(favorites, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bible-quotes-favorites.json';
      link.click();
      
      URL.revokeObjectURL(url);
      this.showSuccess('Favorites exported successfully!');
    } catch (error) {
      console.error('Error exporting favorites:', error);
      this.showError('Failed to export favorites');
    }
  }

  /**
   * Import favorites from JSON file
   */
  async importFavorites() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        const favorites = JSON.parse(text);
        
        if (Array.isArray(favorites)) {
          this.preferences.favorites = favorites;
          await this.savePreferences();
          await this.loadStatistics();
          this.updateUI();
          this.showSuccess(`Imported ${favorites.length} favorites!`);
        } else {
          this.showError('Invalid favorites file format');
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error importing favorites:', error);
      this.showError('Failed to import favorites');
    }
  }

  /**
   * Clear all favorites
   */
  async clearFavorites() {
    if (confirm('Are you sure you want to clear all favorites? This action cannot be undone.')) {
      this.preferences.favorites = [];
      await this.savePreferences();
      await this.loadStatistics();
      this.updateUI();
      this.showSuccess('All favorites cleared!');
    }
  }

  /**
   * Export all extension data
   */
  async exportAllData() {
    try {
      const quotes = await this.getQuotesFromStorage();
      const exportData = {
        preferences: this.preferences,
        quotes: quotes,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bible-quotes-backup.json';
      link.click();
      
      URL.revokeObjectURL(url);
      this.showSuccess('All data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showError('Failed to export data');
    }
  }

  /**
   * Import all extension data
   */
  async importAllData() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        const importData = JSON.parse(text);
        
        if (importData.preferences && importData.quotes) {
          // Import preferences
          this.preferences = { ...this.preferences, ...importData.preferences };
          await this.savePreferences();
          
          // Import quotes
          await this.importQuotes(importData.quotes);
          
          await this.loadStatistics();
          this.updateUI();
          this.showSuccess('Data imported successfully!');
        } else {
          this.showError('Invalid backup file format');
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error importing data:', error);
      this.showError('Failed to import data');
    }
  }

  /**
   * Import quotes to storage
   */
  async importQuotes(quotes) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ quotes: quotes }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Reset all data to defaults
   */
  async resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults? This will clear all your preferences and favorites.')) {
      try {
        // Reset preferences
        this.preferences = {
          quoteCount: 1,
          enableQuotes: true,
          enableFavorites: false,
          enableNotifications: true,
          enableAutoRefresh: false,
          enableGoogleQuotes: true,
          enableBingQuotes: false,
          enableDuckDuckGoQuotes: false,
          favorites: [],
          installDate: Date.now()
        };
        
        await this.savePreferences();
        await this.loadStatistics();
        this.updateUI();
        this.showSuccess('Settings reset to defaults!');
      } catch (error) {
        console.error('Error resetting data:', error);
        this.showError('Failed to reset settings');
      }
    }
  }

  /**
   * Open privacy policy
   */
  openPrivacyPolicy() {
    chrome.tabs.create({ url: 'Privacy Policy' });
  }

  /**
   * Open support page
   */
  openSupport() {
    chrome.tabs.create({ url: 'https://github.com/yourusername/bible-quotes-extension/issues' });
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Show message to user
   */
  showMessage(message, type) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
    `;

    document.body.appendChild(messageDiv);

    // Remove message after 3 seconds
    setTimeout(() => {
      messageDiv.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize the options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BibleQuotesOptions();
});

// Add CSS animations for messages
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style); 