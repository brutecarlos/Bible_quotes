let quotesData = {}; // JSON data will be loaded here

// Loads JSON data at startup
async function loadQuotes() {
    try {
        const response = await fetch('quotes.json'); 
        if (!response.ok) throw new Error("Could not load the JSON file");

        quotesData = await response.json();
        displayQuote();
    } catch (error) {
        console.error("Error loading quotes:", error);
        document.getElementById('quote').innerHTML = "Could not load quotes.";
    }
}

// Get a random quote
function getRandomQuote() {
    let allQuotes = [];

    if (!quotesData.books || !Array.isArray(quotesData.books)) return { reference: "Error", text: "No quotes available." };

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

    if (allQuotes.length === 0) return { reference: "Error", text: "No quotes available." };

    const randomIndex = Math.floor(Math.random() * allQuotes.length);
    return allQuotes[randomIndex];
}

// Display the quote in the extension
function displayQuote() {
    const quote = getRandomQuote();
    document.getElementById('quote').innerHTML = `<strong>${quote.reference}:</strong> ${quote.text}`;
}

// Load the quotes when the page loads
document.addEventListener('DOMContentLoaded', loadQuotes);

// Button to generate a new quote
document.getElementById('newQuoteBtn').addEventListener('click', displayQuote);
