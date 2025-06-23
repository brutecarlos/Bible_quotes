# 📖 Bible Quotes - Daily Inspiration

A beautiful Chrome extension that provides daily Bible quotes and inspiration. Features include favorites management, sharing capabilities, and beautiful quote displays on search engines.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-green.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)

## ✨ Features

### 🎯 Core Features
- **Daily Bible Quotes**: Get random Bible verses with beautiful formatting
- **Multiple Quote Display**: Choose to display 1-3 quotes at a time
- **Search Engine Integration**: See quotes on Google, Bing, and DuckDuckGo searches
- **Favorites System**: Save and manage your favorite quotes
- **Share Functionality**: Share quotes via native sharing or copy to clipboard

### 🎨 User Experience
- **Modern UI**: Beautiful, responsive design with gradient backgrounds
- **Dark Mode Support**: Automatic dark mode detection and styling
- **Loading States**: Smooth loading animations and error handling
- **Keyboard Shortcuts**: Quick access with `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac)
- **Accessibility**: Full ARIA support and keyboard navigation

### ⚙️ Advanced Features
- **Options Page**: Comprehensive settings and data management
- **Statistics Dashboard**: Track usage and favorite quotes
- **Data Export/Import**: Backup and restore your preferences and favorites
- **Multiple Search Engines**: Support for Google, Bing, and DuckDuckGo
- **Auto-refresh**: Optional automatic quote refresh every hour

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/bible-quotes)
2. Click "Add to Chrome"
3. Confirm the installation
4. Start enjoying daily Bible quotes!

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension is now installed and ready to use

## 📖 Usage

### Basic Usage
1. **Click the extension icon** in your Chrome toolbar
2. **View random Bible quotes** with beautiful formatting
3. **Click "New Quote"** to get a different quote
4. **Adjust settings** using the dropdown and checkboxes

### Advanced Features
1. **Favorites**: Enable favorites in settings, then click "⭐ Add to Favorites"
2. **Sharing**: Click "📤 Share Quote" to share via native sharing or copy to clipboard
3. **Search Engine Quotes**: Enable in settings to see quotes on Google/Bing searches
4. **Options Page**: Right-click the extension icon and select "Options" for advanced settings

### Keyboard Shortcuts
- `Ctrl+Shift+B` (Windows/Linux) or `Cmd+Shift+B` (Mac): Open Bible Quotes
- `R` key: Generate new quote (when popup is focused)

## ⚙️ Configuration

### Popup Settings
- **Number of Quotes**: Choose 1-3 quotes to display
- **Enable Search Quotes**: Show quotes on search engine results
- **Enable Favorites**: Turn on favorites functionality

### Options Page Settings
Access the options page by right-clicking the extension icon and selecting "Options".

#### General Settings
- Default quote count
- Notification preferences
- Auto-refresh settings

#### Search Engine Integration
- Enable/disable quotes for each search engine
- Google, Bing, and DuckDuckGo support

#### Favorites Management
- Export/import favorites
- Clear all favorites
- View favorite statistics

#### Data Management
- Export all extension data
- Import backup data
- Reset to default settings

## 🏗️ Architecture

### File Structure
```
Bible_quotes/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # Popup functionality
├── content.js            # Search engine integration
├── background.js         # Service worker
├── options.html          # Options page
├── options.js            # Options functionality
├── styles.css            # Shared styles
├── quotes.json           # Bible quotes data
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Technical Stack
- **Manifest V3**: Latest Chrome extension manifest
- **ES6+ JavaScript**: Modern JavaScript with classes and async/await
- **CSS3**: Advanced styling with gradients, animations, and responsive design
- **Chrome Storage API**: Sync and local storage for preferences and data
- **Service Workers**: Background processing and event handling

## 🔧 Development

### Prerequisites
- Google Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript
- Chrome extension development concepts

### Setup Development Environment
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bible-quotes-extension.git
   cd bible-quotes-extension
   ```

2. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

3. Make changes and reload the extension to see updates

### Building for Production
1. Create a `dist` folder with all necessary files
2. Ensure all icons are present in the `icons` folder
3. Test thoroughly on different Chrome versions
4. Package for Chrome Web Store submission

### Code Style
- Use ES6+ features (classes, async/await, arrow functions)
- Follow consistent naming conventions
- Add comprehensive error handling
- Include JSDoc comments for functions
- Use meaningful variable and function names

## 🧪 Testing

### Manual Testing Checklist
- [ ] Extension loads without errors
- [ ] Popup displays quotes correctly
- [ ] New quote button works
- [ ] Settings are saved and restored
- [ ] Search engine integration works
- [ ] Favorites functionality works
- [ ] Share functionality works
- [ ] Options page loads and functions
- [ ] Dark mode detection works
- [ ] Responsive design on different screen sizes

### Browser Compatibility
- Chrome 88+ (Manifest V3 requirement)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## 📦 Distribution

### Chrome Web Store
1. Create a developer account on the [Chrome Web Store](https://chrome.google.com/webstore/devconsole)
2. Package the extension as a ZIP file
3. Upload and fill in store listing details
4. Submit for review

### Privacy and Security
- No user data is collected or transmitted
- All data is stored locally in Chrome storage
- No external API calls or tracking
- Open source for transparency

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass
- Provide clear commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bible quotes data sourced from public domain translations
- Icons and design inspiration from various open-source projects
- Community feedback and suggestions for improvements

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/bible-quotes-extension/issues)
- **Email**: support@biblequotes.com
- **Documentation**: [Wiki](https://github.com/yourusername/bible-quotes-extension/wiki)

## 🔄 Changelog

### Version 2.0.0 (Current)
- Complete UI redesign with modern styling
- Added favorites functionality
- Implemented sharing capabilities
- Created comprehensive options page
- Added support for multiple search engines
- Improved error handling and loading states
- Added keyboard shortcuts
- Enhanced accessibility features

### Version 1.1.2 (Previous)
- Basic quote display functionality
- Google search integration
- Simple settings management

---

**Made with ❤️ for daily inspiration**

*"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16*
