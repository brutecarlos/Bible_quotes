# Icons Directory

This directory should contain the extension icons in the following sizes:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon32.png` - 32x32 pixels (Windows taskbar)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Icon Requirements

- **Format**: PNG with transparency
- **Style**: Should match the extension's modern design theme
- **Colors**: Use the extension's gradient colors (#667eea to #764ba2)
- **Design**: Simple, recognizable Bible/book theme

## Placeholder Icons

Until custom icons are created, Chrome will use default extension icons.

## Creating Icons

You can create icons using:
- Adobe Illustrator
- Figma
- GIMP
- Inkscape
- Online icon generators

## Adding Icons to Manifest

Once icons are created, add them to `manifest.json`:

```json
{
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
``` 