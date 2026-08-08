/**
 * Bible Quotes Chrome Extension - Custom i18n Helper
 * Loads translation bundles and applies text to the UI.
 */

class I18nHelper {
  static initialized = false;
  static locale = 'en';
  static messages = {};

  static async init(preferredLocale = null, force = false) {
    const locale = this.normalizeLocale(preferredLocale || await this.getPreferredLocale());

    if (!force && this.initialized && this.locale === locale) {
      return;
    }

    this.locale = locale;
    await this.loadMessages(this.locale);
    this.initialized = true;
  }

  static async getPreferredLocale() {
    const storedLocale = await this.getStoredLocale();
    if (storedLocale) {
      return storedLocale;
    }

    return this.getSystemLocale();
  }

  static getSystemLocale() {
    if (chrome && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
      const locale = chrome.i18n.getUILanguage().toLowerCase();
      if (locale.startsWith('en')) {
        return 'es';
      }
      if (locale.startsWith('es')) {
        return 'es';
      }
    }
    return 'es';
  }

  static async getStoredLocale() {
    if (!chrome?.storage?.sync) {
      return null;
    }

    return new Promise((resolve) => {
      chrome.storage.sync.get({ language: null }, (result) => {
        if (chrome.runtime?.lastError) {
          resolve(null);
          return;
        }

        resolve(this.normalizeLocale(result.language));
      });
    });
  }

  static normalizeLocale(locale) {
    if (!locale || typeof locale !== 'string') {
      return null;
    }

    const normalized = locale.toLowerCase();
    if (normalized.startsWith('es')) {
      return 'es';
    }

    if (normalized.startsWith('en')) {
      return 'en';
    }

    return null;
  }

  static async setLocale(locale, root = document) {
    await this.init(locale, true);
    this.translateDocument(root);
  }

  static async loadMessages(locale) {
    const fileName = `locales/messages_${locale}.json`;
    try {
      const response = await fetch(chrome.runtime.getURL(fileName));
      if (!response.ok) {
        throw new Error(`Failed to load locale file ${fileName}`);
      }
      this.messages = await response.json();
    } catch (error) {
      console.error('I18nHelper loadMessages error:', error);
      if (locale !== 'en') {
        const fallbackResponse = await fetch(chrome.runtime.getURL('locales/messages_en.json'));
        this.messages = await fallbackResponse.json();
      } else {
        this.messages = {};
      }
    }
  }

  static t(key) {
    return this.messages[key] || key;
  }

  static translateDocument(root = document) {
    const elements = root.querySelectorAll('[data-i18n]');
    elements.forEach((element) => {
      const key = element.dataset.i18n;
      if (!key) return;
      const text = this.t(key);
      if (element.dataset.i18nAttr) {
        const attr = element.dataset.i18nAttr;
        element.setAttribute(attr, text);
      } else {
        element.textContent = text;
      }
    });
  }
}
