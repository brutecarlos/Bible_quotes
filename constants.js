/**
 * Bible Quotes Chrome Extension - Constants
 * Centralized configuration and magic strings
 */

const STORAGE_KEYS = {
  QUOTES: 'quotes',
  LAST_UPDATED: 'lastUpdated',
  VERSION: 'version',
  FAVORITES: 'favorites',
  QUOTE_COUNT: 'quoteCount',
  ENABLE_QUOTES: 'enableQuotes',
  ENABLE_FAVORITES: 'enableFavorites',
  ENABLE_NOTIFICATIONS: 'enableNotifications',
  ENABLE_AUTO_REFRESH: 'enableAutoRefresh',
  ENABLE_GOOGLE_QUOTES: 'enableGoogleQuotes',
  ENABLE_BING_QUOTES: 'enableBingQuotes',
  ENABLE_DUCKDUCKGO_QUOTES: 'enableDuckDuckGoQuotes',
  INSTALL_DATE: 'installDate',
  LANGUAGE: 'language',
  QUOTE_LANGUAGE: 'quoteLanguage',
  THEME: 'theme'
};

const DEFAULT_PREFERENCES = {
  [STORAGE_KEYS.QUOTE_COUNT]: 1,
  [STORAGE_KEYS.ENABLE_QUOTES]: true,
  [STORAGE_KEYS.ENABLE_FAVORITES]: false,
  [STORAGE_KEYS.ENABLE_NOTIFICATIONS]: true,
  [STORAGE_KEYS.ENABLE_AUTO_REFRESH]: false,
  [STORAGE_KEYS.ENABLE_GOOGLE_QUOTES]: true,
  [STORAGE_KEYS.ENABLE_BING_QUOTES]: false,
  [STORAGE_KEYS.ENABLE_DUCKDUCKGO_QUOTES]: false,
  [STORAGE_KEYS.FAVORITES]: [],
  [STORAGE_KEYS.INSTALL_DATE]: Date.now(),
  [STORAGE_KEYS.LANGUAGE]: 'en',
  [STORAGE_KEYS.THEME]: 'auto'
};

const EXTENSION_CONFIG = {
  VERSION: '2.0.0',
  NOTIFICATION_ICON: 'icons/icon48.png',
  POPUP_WIDTH: 350,
  POPUP_MIN_HEIGHT: 400,
  MESSAGE_TIMEOUT: 5000,
  SUCCESS_TIMEOUT: 3000,
  ERROR_TIMEOUT: 5000,
  DEBOUNCE_DELAY: 300,
  MAX_QUOTE_COUNT: 10,
  MIN_QUOTE_COUNT: 1,
  CLEANUP_THRESHOLD_DAYS: 30,
  CONTENT_SCRIPT_SELECTORS: [
    '#search',
    '#main',
    '#center_col',
    '.main',
    '[data-ved]',
    '.g'
  ]
};

const MESSAGE_ACTIONS = {
  GET_QUOTES: 'getQuotes',
  REFRESH_QUOTES: 'refreshQuotes',
  GET_STATS: 'getStats',
  ADD_FAVORITE: 'addFavorite',
  REMOVE_FAVORITE: 'removeFavorite',
  GET_PREFERENCES: 'getPreferences'
};

const NOTIFICATION_MESSAGES = {
  INSTALLED: {
    title: 'Bible Quotes Extension Installed!',
    message: 'Click the extension icon to get started with daily Bible quotes.'
  },
  UPDATED: {
    title: 'Bible Quotes Extension Updated!',
    message: 'New features and improvements are now available.'
  },
  QUOTE_ADDED: 'Added to favorites!',
  QUOTE_COPIED: 'Quote copied to clipboard!',
  SETTINGS_SAVED: 'Settings saved successfully!'
};

const ERROR_MESSAGES = {
  INIT_FAILED: 'Failed to initialize the extension',
  LOAD_QUOTES_FAILED: 'Could not load quotes. Please check your internet connection.',
  SHARE_FAILED: 'Failed to share quote',
  NO_QUOTE: 'No quote available',
  INVALID_DATA: 'Invalid quotes data structure',
  STORAGE_ERROR: 'Failed to access storage'
};
