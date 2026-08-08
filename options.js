/**
 * Bible Quotes Chrome Extension - Options Page Script
 * Handles all options page functionality including settings, statistics, and data management
 */

class BibleQuotesOptions {
  constructor() {
    this.preferences = {};
    this.stats = {};
    this.cloudSync = {
      status: 'idle',
      lastSync: null
    };
    this.init();
  }

  /**
   * Initialize the options page
   */
  async init() {
    try {
      await this.loadPreferences();
      await I18nHelper.init(this.preferences.language || 'en');
      I18nHelper.translateDocument();
      await this.loadStatistics();
      await this.loadCloudSyncStatus();
      this.setupEventListeners();
      this.updateUI();
      console.log('Bible Quotes Options page initialized');
    } catch (error) {
      console.error('Error initializing options page:', error);
      this.showError(I18nHelper.t('options.errorLoadPreferences'));
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
        enableLocalAnalytics: true,
        language: 'en',
        favorites: [],
        favoritesLastSync: null,
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
        favoriteRatio: totalQuotes > 0 ? (favoritesCount / totalQuotes) * 100 : 0,
        topBook: this.getTopBook(this.preferences.favorites || []),
        topTheme: this.getTopTheme(this.preferences.favorites || []),
        favoritesPerDay: daysInstalled > 0 ? (favoritesCount / daysInstalled) : favoritesCount,
        version: '3.0.0'
      };

      // Load analytics events and compute additional aggregates
      try {
        const events = await StorageHelper.getAnalyticsEvents();
        // Top favorited quote (by reference or text)
        const topFav = this._computeTopEventQuote(events, 'fav');
        const topShared = this._computeTopEventQuote(events, 'share');

        this.stats.topFavorited = topFav || '-';
        this.stats.topShared = topShared || '-';

        // Theme distribution from 'fav' events
        const themeDist = this._computeThemeDistributionFromEvents(events);
        this.stats.themeDistribution = themeDist;

        // Favorites trend (last 30 days)
        this.stats.favoritesTrend = this._computeFavoritesTrend(events, 30);
        // Counts and activity
        this.stats.countsByType = this._computeCountsByType(events);
        this.stats.mostActiveHour = this._computeMostActiveHour(events);
        this.stats.mostActiveDay = this._computeMostActiveDay(events);
      } catch (err) {
        console.warn('Failed to load analytics events', err);
        this.stats.topFavorited = '-';
        this.stats.topShared = '-';
        this.stats.themeDistribution = {};
        this.stats.favoritesTrend = [];
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      this.stats = {
        totalQuotes: 0,
        favoritesCount: 0,
        daysInstalled: 0,
        favoriteRatio: 0,
        topBook: '-',
        topTheme: '-',
        favoritesPerDay: 0,
        version: '3.0.0'
      };
    }
  }

  async _clearAnalyticsData() {
    try {
      await StorageHelper.setLocal({ [ANALYTICS_CONFIG.EVENTS_KEY]: [] });
    } catch (err) {
      console.warn('Failed to clear analytics events', err);
    }
  }

  _computeCountsByType(events = []) {
    return events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {});
  }

  _computeMostActiveHour(events = []) {
    const hours = new Array(24).fill(0);
    events.forEach(e => {
      const d = new Date(e.ts || 0);
      const h = d.getHours();
      hours[h]++;
    });
    let max = 0; let idx = 0;
    hours.forEach((c, i) => { if (c > max) { max = c; idx = i; } });
    return `${idx}:00 - ${idx}:59`;
  }

  _computeMostActiveDay(events = []) {
    const counts = {};
    events.forEach(e => {
      const d = new Date(e.ts || 0);
      const key = d.toISOString().slice(0,10);
      counts[key] = (counts[key] || 0) + 1;
    });
    let top = null; let max = 0;
    Object.keys(counts).forEach(k => { if (counts[k] > max) { max = counts[k]; top = k; } });
    return top || '-';
  }

  getTopBook(favorites) {
    if (!Array.isArray(favorites) || favorites.length === 0) {
      return '-';
    }

    const counts = new Map();
    favorites.forEach((quote) => {
      const parsed = QuoteUtils.parseQuote(quote);
      const book = QuoteUtils.extractBookName(parsed.reference);
      counts.set(book, (counts.get(book) || 0) + 1);
    });

    let topBook = '-';
    let topCount = 0;
    counts.forEach((count, book) => {
      if (count > topCount) {
        topBook = book;
        topCount = count;
      }
    });

    return topBook;
  }

  getTopTheme(favorites) {
    if (!Array.isArray(favorites) || favorites.length === 0) {
      return '-';
    }

    const counts = new Map();
    favorites.forEach((quote) => {
      const parsed = QuoteUtils.parseQuote(quote);
      const themes = QuoteUtils.detectThemes(parsed.text);
      themes.forEach((theme) => {
        counts.set(theme, (counts.get(theme) || 0) + 1);
      });
    });

    if (counts.size === 0) {
      return '-';
    }

    let topTheme = '-';
    let topCount = 0;
    counts.forEach((count, theme) => {
      if (count > topCount) {
        topTheme = theme;
        topCount = count;
      }
    });

    return topTheme;
  }

  async loadCloudSyncStatus() {
    this.cloudSync.lastSync = this.preferences.favoritesLastSync || null;

    return new Promise((resolve) => {
      if (!chrome?.storage?.sync?.getBytesInUse) {
        this.cloudSync.status = 'unavailable';
        resolve();
        return;
      }

      chrome.storage.sync.getBytesInUse(null, (bytesUsed) => {
        if (chrome.runtime.lastError) {
          this.cloudSync.status = 'error';
          resolve();
          return;
        }

        this.cloudSync.status = bytesUsed > 0 ? 'active' : 'idle';
        resolve();
      });
    });
  }

  renderCloudSyncUI() {
    const statusEl = document.getElementById('cloudSyncStatus');
    const lastEl = document.getElementById('cloudSyncLast');
    if (!statusEl || !lastEl) {
      return;
    }

    const keyByStatus = {
      active: 'options.cloudSyncStatusActive',
      idle: 'options.cloudSyncStatusIdle',
      syncing: 'options.cloudSyncStatusSyncing',
      error: 'options.cloudSyncStatusError',
      unavailable: 'options.cloudSyncStatusUnavailable'
    };

    statusEl.textContent = I18nHelper.t(keyByStatus[this.cloudSync.status] || keyByStatus.idle);

    if (this.cloudSync.lastSync) {
      const formatted = QuoteUtils.formatDate(this.cloudSync.lastSync);
      lastEl.textContent = `${I18nHelper.t('options.cloudSyncLastPrefix')} ${formatted}`;
    } else {
      lastEl.textContent = I18nHelper.t('options.cloudSyncNever');
    }
  }

  renderAnalyticsInsights() {
    const insightsEl = document.getElementById('analyticsInsights');
    if (!insightsEl) return;

    insightsEl.innerHTML = '';

    const insights = [];
    insights.push(`${I18nHelper.t('options.insightFavoriteCount')}: ${this.stats.favoritesCount}`);
    insights.push(`${I18nHelper.t('options.insightCoverage')}: ${this.stats.favoriteRatio.toFixed(1)}%`);

    if (this.stats.topBook !== '-') {
      insights.push(`${I18nHelper.t('options.insightTopBook')}: ${this.stats.topBook}`);
    }

    if (this.stats.topTheme !== '-') {
      insights.push(`${I18nHelper.t('options.insightTopTheme')}: ${I18nHelper.t(`options.theme.${this.stats.topTheme}`)}`);
    }

    insights.push(`${I18nHelper.t('options.insightFavoritesPerDay')}: ${this.stats.favoritesPerDay.toFixed(2)}`);

    if (this.stats.topFavorited && this.stats.topFavorited !== '-') {
      insights.push(`${I18nHelper.t('options.insightTopFavorited')}: ${this.stats.topFavorited}`);
    }

    if (this.stats.topShared && this.stats.topShared !== '-') {
      insights.push(`${I18nHelper.t('options.insightTopShared')}: ${this.stats.topShared}`);
    }

    insights.forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      insightsEl.appendChild(li);
    });

    // Optionally render a tiny sparkline for favoritesTrend
    if (Array.isArray(this.stats.favoritesTrend) && this.stats.favoritesTrend.length > 0) {
      const spark = document.createElement('canvas');
      spark.width = 200;
      spark.height = 40;
      const ctx = spark.getContext('2d');
      // Simple line spark
      const vals = this.stats.favoritesTrend;
      const max = Math.max(...vals, 1);
      ctx.strokeStyle = '#4b6ef6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      vals.forEach((v, i) => {
        const x = (i / (vals.length - 1)) * spark.width;
        const y = spark.height - (v / max) * (spark.height - 4) - 2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      const wrapper = document.createElement('div');
      wrapper.style.marginTop = '8px';
      wrapper.appendChild(spark);
      insightsEl.appendChild(wrapper);
    }
  }

  _computeTopEventQuote(events = [], type = 'fav') {
    const counts = new Map();
    events.filter(e => e.type === type).forEach(e => {
      const key = e.reference || e.quote || '(unknown)';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    let top = null; let topCount = 0;
    counts.forEach((c, k) => { if (c > topCount) { top = k; topCount = c; } });
    return top;
  }

  _computeThemeDistributionFromEvents(events = []) {
    const counts = {};
    events.filter(e => e.type === 'fav').forEach(e => {
      try {
        const parsed = QuoteUtils.parseQuote(e.quote || '');
        const themes = QuoteUtils.detectThemes(parsed.text || '');
        themes.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
      } catch (err) { }
    });
    return counts;
  }

  _computeFavoritesTrend(events = [], days = 30) {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const buckets = new Array(days).fill(0);
    events.filter(e => e.type === 'fav').forEach(e => {
      const age = now - (e.ts || 0);
      const idx = Math.floor(age / dayMs);
      if (idx >= 0 && idx < days) {
        // recent days: idx=0 means today; we want reversed order
        buckets[days - 1 - idx] += 1;
      }
    });
    return buckets;
  }

  async syncFavoritesNow() {
    try {
      this.cloudSync.status = 'syncing';
      this.renderCloudSyncUI();

      const now = Date.now();
      this.preferences.favoritesLastSync = now;

      await new Promise((resolve, reject) => {
        chrome.storage.sync.set({
          favorites: this.preferences.favorites || [],
          favoritesLastSync: now
        }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve();
        });
      });

      this.cloudSync.status = 'active';
      this.cloudSync.lastSync = now;
      this.renderCloudSyncUI();
      this.showSuccess(I18nHelper.t('options.cloudSyncSuccess'));
    } catch (error) {
      console.error('Cloud sync failed:', error);
      this.cloudSync.status = 'error';
      this.renderCloudSyncUI();
      this.showError(I18nHelper.t('options.cloudSyncFailed'));
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
    document.getElementById('quoteLanguage').value = this.preferences.language || 'en';
    const analyticsChk = document.getElementById('enableLocalAnalytics');
    if (analyticsChk) analyticsChk.checked = (this.preferences.enableLocalAnalytics !== false);

    // Update statistics
    document.getElementById('totalQuotes').textContent = this.stats.totalQuotes.toLocaleString();
    document.getElementById('favoriteCount').textContent = this.stats.favoritesCount;
    document.getElementById('daysInstalled').textContent = this.stats.daysInstalled;
    document.getElementById('version').textContent = this.stats.version;

    const ratioEl = document.getElementById('favoriteRatio');
    if (ratioEl) ratioEl.textContent = `${this.stats.favoriteRatio.toFixed(1)}%`;

    const topBookEl = document.getElementById('topBook');
    if (topBookEl) topBookEl.textContent = this.stats.topBook;

    const topThemeEl = document.getElementById('topTheme');
    if (topThemeEl) {
      topThemeEl.textContent = this.stats.topTheme === '-' ? '-' : I18nHelper.t(`options.theme.${this.stats.topTheme}`);
    }

    const favoritesPerDayEl = document.getElementById('favoritesPerDay');
    if (favoritesPerDayEl) favoritesPerDayEl.textContent = this.stats.favoritesPerDay.toFixed(2);

    this.renderCloudSyncUI();
    this.renderAnalyticsInsights();
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

    const analyticsEl = document.getElementById('enableLocalAnalytics');
    if (analyticsEl) {
      analyticsEl.addEventListener('change', (e) => {
        this.preferences.enableLocalAnalytics = e.target.checked;
        // persist to sync storage
        chrome.storage.sync.set({ enableLocalAnalytics: e.target.checked }, async () => {
          // If user disabled local analytics, clear stored events
          if (!e.target.checked) {
            try { await StorageHelper.setLocal({ [ANALYTICS_CONFIG.EVENTS_KEY]: [] }); } catch(err) { }
          }
        });
      });
    }

    document.getElementById('quoteLanguage').addEventListener('change', async (e) => {
      this.preferences.language = e.target.value;
      await this.savePreferences(false);
      await I18nHelper.setLocale(this.preferences.language);
      this.updateUI();
      await StorageHelper.removeLocal([STORAGE_KEYS.QUOTES, STORAGE_KEYS.QUOTE_LANGUAGE]);
      this.showSuccess(I18nHelper.t('options.notificationQuoteLanguageUpdated'));
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

    const syncNowBtn = document.getElementById('syncFavoritesNow');
    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', async () => {
        await this.syncFavoritesNow();
      });
    }

    const clearAnalyticsBtn = document.getElementById('clearAnalytics');
    if (clearAnalyticsBtn) {
      clearAnalyticsBtn.addEventListener('click', async () => {
        if (!confirm(I18nHelper.t('options.clearAnalyticsConfirm'))) return;
        await this._clearAnalyticsData();
        await this.loadStatistics();
        this.updateUI();
        this.showSuccess(I18nHelper.t('options.analyticsCleared'));
      });
    }

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
  async savePreferences(showSuccessMessage = true, touchFavoritesSync = false) {
    if (touchFavoritesSync) {
      this.preferences.favoritesLastSync = Date.now();
      this.cloudSync.lastSync = this.preferences.favoritesLastSync;
    }

    return new Promise((resolve) => {
      chrome.storage.sync.set(this.preferences, () => {
        if (showSuccessMessage) {
          this.showSuccess(I18nHelper.t('options.notificationSettingsSaved'));
        }
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
      this.showSuccess(I18nHelper.t('options.notificationExportSuccess'));
    } catch (error) {
      console.error('Error exporting favorites:', error);
      this.showError(I18nHelper.t('options.errorExportFailed'));
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
          await this.savePreferences(true, true);
          await this.loadStatistics();
          await this.loadCloudSyncStatus();
          this.updateUI();
          this.showSuccess(I18nHelper.t('options.notificationImportSuccess'));
        } else {
          this.showError(I18nHelper.t('options.errorInvalidFile'));
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error importing favorites:', error);
      this.showError(I18nHelper.t('options.errorImportFailed'));
    }
  }

  /**
   * Clear all favorites
   */
  async clearFavorites() {
    if (confirm(I18nHelper.t('options.confirmClearFavorites'))) {
      this.preferences.favorites = [];
      await this.savePreferences(true, true);
      await this.loadStatistics();
      await this.loadCloudSyncStatus();
      this.updateUI();
      this.showSuccess(I18nHelper.t('options.favoritesCleared'));
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
        version: '3.0.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bible-quotes-backup.json';
      link.click();
      
      URL.revokeObjectURL(url);
      this.showSuccess(I18nHelper.t('options.notificationDataExportSuccess'));
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showError(I18nHelper.t('options.errorExportDataFailed'));
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
          this.showSuccess(I18nHelper.t('options.notificationDataImportSuccess'));
        } else {
          this.showError(I18nHelper.t('options.errorInvalidFile'));
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error importing data:', error);
      this.showError(I18nHelper.t('options.errorImportDataFailed'));
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
    if (confirm(I18nHelper.t('options.confirmReset'))) {
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
          favoritesLastSync: null,
          installDate: Date.now()
        };
        
        await this.savePreferences(true, true);
        await this.loadStatistics();
        await this.loadCloudSyncStatus();
        this.updateUI();
        this.showSuccess(I18nHelper.t('options.notificationResetSuccess'));
      } catch (error) {
        console.error('Error resetting data:', error);
        this.showError(I18nHelper.t('options.errorResetFailed'));
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
