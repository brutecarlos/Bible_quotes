let quotesData = {}; // JSON data will be loaded here

// Loads JSON data at startup
async function loadQuotes() {
    try {
        const response = await fetch('quotes.json'); 
        if (!response.ok) throw new Error("Could not load the JSON file");

        quotesData = await response.json();
        displayQuotes();
    } catch (error) {
        console.error("Error loading quotes:", error);
        document.getElementById('quote').innerHTML = "Could not load quotes.";
    }
}

// Get random quotes
function getRandomQuotes(count) {
    let allQuotes = [];

    if (!quotesData.books || !Array.isArray(quotesData.books)) return [{ reference: "Error", text: "No quotes available." }];

    quotesData.books.forEach(book => {
        book.chapters.forEach(chapter => {
            chapter.verses.forEach(verse => {
                if (verse.text) { // Ensure it has text
                    allQuotes.push({
                        reference: verse.reference,
                        text: verse.text
                    });
                }
            });
        });
    });

    if (allQuotes.length === 0) return [{ reference: "Error", text: "No quotes available." }];

    const randomQuotes = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * allQuotes.length);
        randomQuotes.push(allQuotes[randomIndex]);
    }
    return randomQuotes;
}

// Display the quotes in the extension
function displayQuotes() {
    const quoteCount = parseInt(document.getElementById('quoteCount').value, 10);
    const quotes = getRandomQuotes(quoteCount);
    const quoteContainer = document.getElementById('quote');
    quoteContainer.innerHTML = '';
    quotes.forEach(quote => {
        const quoteElement = document.createElement('div');
        // Format the quote with the reference at the end in bold
        quoteElement.innerHTML = `${quote.text} - <strong>${quote.reference}</strong>`;
        quoteContainer.appendChild(quoteElement);
    });
}

// Load the quotes when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    chrome.storage.sync.get(['quoteCount', 'enableQuotes'], (result) => {
        document.getElementById('quoteCount').value = result.quoteCount || 1;
        document.getElementById('enableQuotes').checked = result.enableQuotes !== false;
    });
});

// Button to generate new quotes
document.getElementById('newQuoteBtn').addEventListener('click', displayQuotes);

// Save the user's preference for the number of quotes
document.getElementById('quoteCount').addEventListener('change', () => {
    const quoteCount = parseInt(document.getElementById('quoteCount').value, 10);
    chrome.storage.sync.set({ quoteCount: quoteCount });
    displayQuotes();
});

// Save the user's preference for enabling or disabling quote generation
document.getElementById('enableQuotes').addEventListener('change', () => {
    const enableQuotes = document.getElementById('enableQuotes').checked;
    chrome.storage.sync.set({ enableQuotes: enableQuotes });
});
