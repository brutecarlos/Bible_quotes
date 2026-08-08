/**
 * Bible Quotes Chrome Extension - Preferences Manager
 * Singleton for centralized preferences state management
 */

class PreferencesManager {
  static instance = null;
  
  constructor() {
    if (PreferencesManager.instance) {
      return PreferencesManager.instance;
    }

    this.preferences = { ...DEFAULT_PREFERENCES };
    this.listeners = [];
    this.initialized = false;

    PreferencesManager.instance = this;
  }

  /**
   * Initialize preferences from storage
   * @returns {Promise<Object>} User preferences
   */
  async init() {
    if (this.initialized) {
      return this.preferences;
    }

    try {
      const result = await StorageHelper.getSync(DEFAULT_PREFERENCES);
      this.preferences = result;
      this.setupStorageListener();
      this.initialized = true;
      console.log('PreferencesManager initialized');
      return this.preferences;
    } catch (error) {
      console.error('Error initializing preferences:', error);
      throw error;
    }
  }

  /**
   * Get a preference value
   * @param {string} key - Preference key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Preference value
   */
  get(key, defaultValue = null) {
    return this.preferences.hasOwnProperty(key) ? this.preferences[key] : defaultValue;
  }

  /**
   * Set a preference value
   * @param {string} key - Preference key
   * @param {*} value - Value to set
   * @returns {Promise<void>}
   */
  async set(key, value) {
    this.preferences[key] = value;
    await StorageHelper.setSync({ [key]: value });
    this.notifyListeners(key, value);
  }

  /**
   * Set multiple preferences at once
   * @param {Object} updates - Object with key-value pairs
   * @returns {Promise<void>}
   */
  async setMultiple(updates) {
    Object.assign(this.preferences, updates);
    await StorageHelper.setSync(updates);
    Object.entries(updates).forEach(([key, value]) => {
      this.notifyListeners(key, value);
    });
  }

  /**
   * Get all preferences
   * @returns {Object} All preferences
   */
  getAll() {
    return { ...this.preferences };
  }

  /**
   * Reset to default preferences
   * @returns {Promise<void>}
   */
  async reset() {
    this.preferences = { ...DEFAULT_PREFERENCES };
    await StorageHelper.setSync(DEFAULT_PREFERENCES);
    this.notifyListeners('*', null);
  }

  /**
   * Subscribe to preference changes
   * @param {Function} callback - Callback function(key, newValue)
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of preference changes
   * @private
   */
  notifyListeners(key, value) {
    this.listeners.forEach(listener => {
      try {
        listener(key, value);
      } catch (error) {
        console.error('Error in preference listener:', error);
      }
    });
  }

  /**
   * Setup listener for external storage changes
   * @private
   */
  setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        Object.entries(changes).forEach(([key, change]) => {
          if (change.newValue !== undefined) {
            this.preferences[key] = change.newValue;
            this.notifyListeners(key, change.newValue);
          }
        });
      }
    });
  }

  /**
   * Get singleton instance
   * @returns {PreferencesManager}
   */
  static getInstance() {
    if (!PreferencesManager.instance) {
      PreferencesManager.instance = new PreferencesManager();
    }
    return PreferencesManager.instance;
  }
}
