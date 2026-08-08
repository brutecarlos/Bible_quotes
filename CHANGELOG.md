# Changelog

All notable changes to this project are documented in this file.

## 3.0.0 - 2026-08-08

### Added
- Full English and Spanish localization for the popup, options page, and injected search quote UI.
- Spanish quote dataset in `quotes_es.json`.
- Shared localization helper in `i18n.js`.
- New shared modules for constants, storage, preferences, and utilities.
- In-search favorites controls with inline star toggles and first-time guidance.

### Changed
- Menu text now updates from the saved language preference instead of only the browser locale.
- Quote loading now respects the selected language and refreshes cached quotes when the locale changes.
- Popup, options page, and content script messaging were refactored to use translated message bundles.
- Favorites interactions on injected search quotes are more visible and easier to use.

### Improved
- Better consistency between popup, options page, and injected search UI.
- Clearer onboarding for favorites on search pages.
- More maintainable extension structure for future releases.

## 2.0.0

### Added
- Modern popup UI and responsive styling.
- Favorites system and sharing support.
- Options page with statistics and data management.
- Search engine integrations for Google, Bing, and DuckDuckGo.

## 1.1.2

### Added
- Basic quote display functionality.
- Google search integration.
- Simple settings management.