/**
 * Bible Quotes Chrome Extension - Storage Helper
 * Abstracts Chrome Storage API with Promise wrappers and error handling
 */

class StorageHelper {
  /**
   * Get items from local storage
   * @param {string|string[]} keys - Storage key(s) to retrieve
   * @returns {Promise<Object>} Storage items
   */
  static async getLocal(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Set items in local storage
   * @param {Object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  static async setLocal(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get items from sync storage
   * @param {string|string[]|Object} keys - Storage key(s) or defaults object
   * @returns {Promise<Object>} Storage items
   */
  static async getSync(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Set items in sync storage
   * @param {Object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  static async setSync(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Remove items from local storage
   * @param {string|string[]} keys - Storage key(s) to remove
   * @returns {Promise<void>}
   */
  static async removeLocal(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Remove items from sync storage
   * @param {string|string[]} keys - Storage key(s) to remove
   * @returns {Promise<void>}
   */
  static async removeSync(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get quotes from storage
   * @returns {Promise<string[]>} Array of quote strings
   */
  static async getQuotes() {
    try {
      const result = await this.getLocal(STORAGE_KEYS.QUOTES);
      return result[STORAGE_KEYS.QUOTES] || [];
    } catch (error) {
      console.error('Error loading quotes:', error);
      return [];
    }
  }

  /**
   * Store quotes in local storage
   * @param {string[]} quotes - Array of quote strings
   * @returns {Promise<void>}
   */
  static async storeQuotes(quotes, locale = 'en') {
    return this.setLocal({
      [STORAGE_KEYS.QUOTES]: quotes,
      [STORAGE_KEYS.QUOTE_LANGUAGE]: locale,
      [STORAGE_KEYS.LAST_UPDATED]: Date.now(),
      [STORAGE_KEYS.VERSION]: EXTENSION_CONFIG.VERSION
    });
  }

  /**
   * Determine the preferred quote locale based on Chrome UI language
   * @returns {string} Locale code ('es' or 'en')
   */
  static getPreferredQuoteLocale() {
    if (chrome && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
      const locale = chrome.i18n.getUILanguage();
      if (locale && locale.toLowerCase().startsWith('es')) {
        return 'es';
      }
    }
    return 'en';
  }

  /**
   * Fetch the appropriate quotes file for the current locale
   * @param {string} [locale] - Optional locale override
   * @returns {Promise<Object>} Quotes data structure
   */
  static async fetchQuotesFile(locale = null) {
    const language = locale || this.getPreferredQuoteLocale();
    const fileName = `quotes_${language}.json`;
    const fallbackName = 'quotes_en.json';

    try {
      const response = await fetch(chrome.runtime.getURL(fileName));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      if (language === 'en') {
        throw error;
      }
      const fallbackResponse = await fetch(chrome.runtime.getURL(fallbackName));
      if (!fallbackResponse.ok) {
        throw new Error(`Fallback HTTP error! status: ${fallbackResponse.status}`);
      }
      return fallbackResponse.json();
    }
  }
}
