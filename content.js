/**
 * Bible Quotes Chrome Extension - Content Script
 * Enhanced implementation for injecting quotes into Google search results
 */

class BibleQuotesContent {
  constructor() {
    this.quotes = [];
    this.preferences = {};
    this.isInitialized = false;
    this.init();
  }

  /**
   * Initialize the content script
   */
  async init() {
    try {
      await this.loadPreferences();
      if (this.preferences.enableQuotes) {
        await this.loadQuotes();
        this.injectQuotes();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Bible Quotes Content Script initialization error:', error);
    }
  }

  /**
   * Load user preferences from Chrome storage
   */
  async loadPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        quoteCount: 1,
        enableQuotes: true
      }, (result) => {
        this.preferences = result;
        resolve(result);
      });
    });
  }

  /**
   * Load quotes from Chrome storage
   */
  async loadQuotes() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get('quotes', (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          this.quotes = result.quotes || [];
          resolve(this.quotes);
        }
      });
    });
  }

  /**
   * Get random quotes from the loaded data
   */
  getRandomQuotes(count = 1) {
    if (!this.quotes || this.quotes.length === 0) {
      return ['No quotes available - John 3:16'];
    }

    const randomQuotes = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < Math.min(count, this.quotes.length); i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * this.quotes.length);
      } while (usedIndices.has(randomIndex));
      
      usedIndices.add(randomIndex);
      randomQuotes.push(this.quotes[randomIndex]);
    }

    return randomQuotes;
  }

  /**
   * Create and inject quotes into the Google search page
   */
  injectQuotes() {
    const quotes = this.getRandomQuotes(this.preferences.quoteCount);
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
    // Try multiple selectors for different Google layouts
    const selectors = [
      '#search',
      '#main',
      '#center_col',
      '.main',
      '[data-ved]',
      '.g'
    ];

    for (const selector of selectors) {
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
      <span class="bible-quotes-title">Daily Bible Quote</span>
      <button class="bible-quotes-close" aria-label="Close quotes">×</button>
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
    
    const [text, reference] = quoteString.split(' - ');
    
    const textElement = document.createElement('div');
    textElement.className = 'bible-quote-text';
    textElement.textContent = text;
    
    const referenceElement = document.createElement('div');
    referenceElement.className = 'bible-quote-reference';
    referenceElement.textContent = reference;
    
    quoteDiv.appendChild(textElement);
    quoteDiv.appendChild(referenceElement);
    
    return quoteDiv;
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
        padding: 15px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        border-left: 4px solid #667eea;
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
  }

  /**
   * Listen for preference changes
   */
  setupPreferenceListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.enableQuotes) {
        const newValue = changes.enableQuotes.newValue;
        if (newValue) {
          this.init();
        } else {
          this.removeQuotes();
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
}

// Initialize the content script
const bibleQuotes = new BibleQuotesContent();

// Setup preference listener
bibleQuotes.setupPreferenceListener();