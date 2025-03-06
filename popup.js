// Suponiendo que ya tienes el JSON con las citas
const quotesData = {
  "books": [
      {
          "book": "Matthew",
          "chapters": [
              {
                  "chapter": 1,
                  "reference": "Matthew 1",
                  "verses": [
                      {
                          "reference": "Matthew 1:1",
                          "text": "The book of the generation of Jesus Christ, the son of David, the son of Abraham.",
                          "verse": 1
                      },
                      {
                          "reference": "Matthew 1:2",
                          "text": "Abraham begat Isaac; and Isaac begat Jacob; and Jacob begat Judas and his brethren.",
                          "verse": 2
                      }
                  ]
              },
              {
                  "chapter": 2,
                  "reference": "Matthew 2",
                  "verses": [
                      {
                          "reference": "Matthew 2:1",
                          "text": "Now when Jesus was born in Bethlehem of Judaea in the days of Herod the king, behold, there came wise men from the east to Jerusalem.",
                          "verse": 1
                      }
                  ]
              }
          ]
      },
      {
          "book": "John",
          "chapters": [
              {
                  "chapter": 3,
                  "reference": "John 3",
                  "verses": [
                      {
                          "reference": "John 3:16",
                          "text": "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
                          "verse": 16
                      }
                  ]
              }
          ]
      }
  ]
};

// Función para obtener una cita aleatoria
function getRandomQuote() {
  // Aplanar todas las citas en un solo arreglo
  let allQuotes = [];
  quotesData.books.forEach(book => {
      book.chapters.forEach(chapter => {
          chapter.verses.forEach(verse => {
              allQuotes.push({
                  book: book.book,
                  chapter: chapter.reference,
                  reference: verse.reference,
                  text: verse.text
              });
          });
      });
  });

  // Elegir una cita aleatoria
  const randomIndex = Math.floor(Math.random() * allQuotes.length);
  return allQuotes[randomIndex];
}

// Función para mostrar la cita del día
function displayQuote() {
  const quote = getRandomQuote();
  const quoteDiv = document.getElementById('quote');
  quoteDiv.innerHTML = `<strong>${quote.reference}:</strong> ${quote.text}`;
}

// Mostrar cita al cargar
document.addEventListener('DOMContentLoaded', displayQuote);

// Botón para cambiar cita manualmente (si lo deseas)
document.getElementById('newQuoteBtn').addEventListener('click', displayQuote);
