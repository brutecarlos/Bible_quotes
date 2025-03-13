let quotesData = {}; // Se cargará el JSON aquí

// Cargar JSON al iniciar
async function loadQuotes() {
    try {
        const response = await fetch('quotes.json'); // Asegúrate de que el path sea correcto
        if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");

        quotesData = await response.json();
        displayQuote(); // Mostrar una cita después de cargar el JSON
    } catch (error) {
        console.error("Error cargando las citas:", error);
        document.getElementById('quote').innerHTML = "No se pudieron cargar las citas.";
    }
}

// Obtener una cita aleatoria
function getRandomQuote() {
    let allQuotes = [];

    if (!quotesData.books || !Array.isArray(quotesData.books)) return { reference: "Error", text: "No hay citas disponibles." };

    quotesData.books.forEach(book => {
        book.chapters.forEach(chapter => {
            chapter.verses.forEach(verse => {
                if (verse.text) { // Asegurar que tenga texto
                    allQuotes.push({
                        reference: verse.reference,
                        text: verse.text
                    });
                }
            });
        });
    });

    if (allQuotes.length === 0) return { reference: "Error", text: "No hay citas disponibles." };

    const randomIndex = Math.floor(Math.random() * allQuotes.length);
    return allQuotes[randomIndex];
}

// Mostrar la cita en la extensión
function displayQuote() {
    const quote = getRandomQuote();
    document.getElementById('quote').innerHTML = `<strong>${quote.reference}:</strong> ${quote.text}`;
}

// Cargar las citas cuando la página se cargue
document.addEventListener('DOMContentLoaded', loadQuotes);

// Botón para generar una nueva cita
document.getElementById('newQuoteBtn').addEventListener('click', displayQuote);
