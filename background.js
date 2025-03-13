fetch(chrome.runtime.getURL('quotes.json'))
  .then(response => response.json())
  .then(data => {
    const quotes = [];
    data.books.forEach(book => {
      book.chapters.forEach(chapter => {
        chapter.verses.forEach(verse => {
          quotes.push(`${verse.text} - ${verse.reference}`);
        });
      });
    });
    chrome.storage.local.set({ quotes: quotes }, () => {
      console.log('Quotes loaded:', quotes);
    });
  })
  .catch(error => console.error('Error loading quotes:', error));