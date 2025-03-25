// Function to get random quotes from storage
function getRandomQuotes(count) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('quotes', (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const quotes = result.quotes;
        if (quotes && quotes.length > 0) {
          const randomQuotes = [];
          for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            randomQuotes.push(quotes[randomIndex]);
          }
          resolve(randomQuotes);
        } else {
          reject('No quotes found');
        }
      }
    });
  });
}

// Function to inject the quotes into the Google search page
function injectQuotes(quotes) {
  console.log('Injecting quotes:', quotes);
  const quotesContainer = document.createElement('div');
  quotesContainer.style.width = '100%';
  quotesContainer.style.padding = '15px';
  quotesContainer.style.marginBottom = '20px';
  quotesContainer.style.textAlign = 'center';
  quotesContainer.style.backgroundColor = '#fff3cd';
  quotesContainer.style.color = '#856404';

  quotes.forEach(quote => {
    const quoteElement = document.createElement('p'); // Use <p> for each quote
    const [text, reference] = quote.split(' - '); // Split the quote into text and reference
    // Ensure the reference is bold
    quoteElement.innerHTML = `${text} - <strong>${reference}</strong>`;
    quoteElement.style.margin = '10px 0'; // Add spacing between paragraphs
    quotesContainer.appendChild(quoteElement);
  });

  // Apply styles for Dark mode
  const darkModeStyles = `
    background-color: #333;
    color: #fff;
  `;

  // Use media query to apply styles based on the user's preferred color scheme
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @media (prefers-color-scheme: dark) {
      div.quote-element {
        ${darkModeStyles}
      }
    }
  `;
  document.head.appendChild(styleElement);

  // Add a class to the quotes container for styling
  quotesContainer.classList.add('quote-element');

  // Insert the quotes container before the search results container
  const searchResultsContainer = document.getElementById('search');
  if (searchResultsContainer) {
    searchResultsContainer.prepend(quotesContainer);
  } else {
    console.error('Search results container not found');
  }
}

// Get the user's preference for the number of quotes and inject them into the page
chrome.storage.sync.get(['quoteCount', 'enableQuotes'], (result) => {
  console.log('User preferences:', result);
  if (result.enableQuotes !== false) { // Default to true if not set
    const quoteCount = result.quoteCount || 1; // Default to 1 if not set
    getRandomQuotes(quoteCount)
      .then((quotes) => {
        injectQuotes(quotes);
      })
      .catch((error) => {
        console.error('Error getting quotes:', error);
      });
  } else {
    console.log('Quote generation is disabled.');
  }
});