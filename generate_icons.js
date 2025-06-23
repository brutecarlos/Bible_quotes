const fs = require('fs');
const { createCanvas } = require('canvas');

// Check if canvas is available, if not, provide instructions
try {
    require('canvas');
} catch (error) {
    console.log('Canvas package not found. Please install it first:');
    console.log('npm install canvas');
    console.log('\nOr use the HTML file method instead.');
    process.exit(1);
}

// Icon sizes needed for Chrome extension
const sizes = [16, 32, 48, 128];

// Function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Function to draw the Bible Quotes icon
function drawIcon(canvas, size) {
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    // Draw rounded rectangle background
    ctx.fillStyle = gradient;
    roundRect(ctx, size * 0.1, size * 0.1, size * 0.8, size * 0.8, size * 0.15);
    ctx.fill();
    
    // Draw book
    const bookWidth = size * 0.6;
    const bookHeight = size * 0.4;
    const bookX = (size - bookWidth) / 2;
    const bookY = size * 0.25;
    
    // Book shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    roundRect(ctx, bookX + 2, bookY + 2, bookWidth, bookHeight, size * 0.05);
    ctx.fill();
    
    // Book cover
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bookX, bookY, bookWidth, bookHeight, size * 0.05);
    ctx.fill();
    
    // Book pages
    ctx.fillStyle = '#f8f9fa';
    roundRect(ctx, bookX + size * 0.02, bookY + size * 0.02, bookWidth - size * 0.04, bookHeight - size * 0.04, size * 0.03);
    ctx.fill();
    
    // Cross on book
    ctx.fillStyle = '#667eea';
    const crossSize = size * 0.15;
    const crossX = size / 2 - crossSize / 2;
    const crossY = size * 0.35;
    
    // Vertical part of cross
    ctx.fillRect(crossX + crossSize * 0.4, crossY, crossSize * 0.2, crossSize);
    
    // Horizontal part of cross
    ctx.fillRect(crossX, crossY + crossSize * 0.4, crossSize, crossSize * 0.2);
    
    // Add some text lines to represent pages
    ctx.fillStyle = '#dee2e6';
    for (let i = 0; i < 3; i++) {
        const lineY = bookY + size * 0.15 + i * size * 0.08;
        ctx.fillRect(bookX + size * 0.08, lineY, bookWidth - size * 0.16, size * 0.02);
    }
}

// Generate icons
function generateIcons() {
    console.log('🎨 Generating Bible Quotes extension icons...');
    
    // Ensure icons directory exists
    if (!fs.existsSync('icons')) {
        fs.mkdirSync('icons');
    }
    
    sizes.forEach(size => {
        const canvas = createCanvas(size, size);
        drawIcon(canvas, size);
        
        const buffer = canvas.toBuffer('image/png');
        const filename = `icons/icon${size}.png`;
        
        fs.writeFileSync(filename, buffer);
        console.log(`✅ Generated ${filename} (${size}x${size})`);
    });
    
    console.log('\n🎉 All icons generated successfully!');
    console.log('📁 Icons saved in the icons/ folder');
    console.log('🔄 Please reload your extension in Chrome to see the new icons');
}

// Run the generation
generateIcons(); 