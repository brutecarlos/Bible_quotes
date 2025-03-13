// Function to get a random quote from storage
function getRandomQuote() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('quotes', (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const quotes = result.quotes;
        if (quotes && quotes.length > 0) {
          const randomIndex = Math.floor(Math.random() * quotes.length);
          resolve(quotes[randomIndex]);
        } else {
          reject('No quotes found');
        }
      }
    });
  });
}

// Function to inject the quote into the Google search page
function injectQuote(quote) {
  console.log('Injecting quote:', quote);
  const quoteElement = document.createElement('div');
  quoteElement.style.width = '100%';
  quoteElement.style.padding = '15px';
  quoteElement.style.marginBottom = '20px';
  quoteElement.style.textAlign = 'center';
  quoteElement.style.backgroundColor = '#fff3cd';
  quoteElement.style.color = '#856404';
  quoteElement.textContent = quote;

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

  // Add a class to the quote element for styling
  quoteElement.classList.add('quote-element');

  // Insert the quote element before the search results container
  const searchResultsContainer = document.getElementById('search');
  if (searchResultsContainer) {
    searchResultsContainer.prepend(quoteElement);
  } else {
    console.error('Search results container not found');
  }
}

// Get a random quote and inject it into the page
getRandomQuote()
  .then((quote) => {
    injectQuote(quote);
  })
  .catch((error) => {
    console.error('Error getting quote:', error);
  });