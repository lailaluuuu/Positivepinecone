# One-Line Journal v2 — Private Local Storage Edition

A private one-line journal stored in your browser. Save your thoughts daily, keep some private, and search across everything. **No server required—all data stays on your computer.**

## Key Features

✨ **Private Browser Storage** - Uses your browser's localStorage (never leaves your machine)
🔒 **Privacy Controls** - Mark entries as private (hidden from display, still searchable)
🗑️ **Smart Deletion** - Remove entries from display but keep them searchable
🔍 **Full-Text Search** - Search across all entries by content or #tags
💾 **Export/Import** - Backup and restore your entries as JSON files
🎨 **Themes** - Dark, Light, and Gold themes with persistent storage

## Setup

No installation needed! Just open `index.html` in your web browser.

### Quick Start

1. Open `index.html` in your browser
2. Type your daily thought
3. Click "Save" or press Ctrl+Enter
4. Done! Your entry is saved locally

## How It Works

### Storage
- **Browser localStorage** - Entries stored securely in your browser
- **Completely private** - Data never leaves your computer
- **Persistent** - Survives browser restarts
- **No internet required** - Works fully offline

### Privacy Features

**Keep Private** - Check "Keep this private" when saving to hide entries from display
- Hidden from the public history view
- Still fully searchable via the search box
- Marked with a 🔒 badge in search results

**Remove from Display** - Click "Remove from display" on any entry
- Entry is hidden from history/search results
- Entry remains in localStorage
- Can be searched for if you know the exact terms

### Search
- **By content**: Type any word to search entry text
- **By tag**: Type `#work`, `#mead`, etc. to filter by hashtags
- **Searchable**: Private entries are searchable when using the search box

### Export/Import
- Click "Export journal" to download all entries as a JSON file (backup)
- Use the import feature (via browser console) to restore from backup
- Great for switching computers or adding to cloud storage manually

## File Structure

```
.
├── index.html          # Frontend UI
├── app.js              # Frontend logic (localStorage based)
├── styles.css          # Styling
└── README.md           # This file
```

## Privacy Note

✅ **Your data stays with you**
- All entries stored in browser localStorage (on your computer)
- No cloud storage or external servers
- No tracking or analytics
- All searches happen locally in your browser
- Export anytime for backup to another location

## Troubleshooting

### Where is my data stored?
Browser localStorage is stored locally on your machine. Location varies by browser:
- **Chrome/Brave**: `~/AppData/Local/Google/Chrome/User Data/Default/Local Storage/`
- **Firefox**: `~/AppData/Roaming/Mozilla/Firefox/Profiles/*/storage/default/`
- **Edge**: `~/AppData/Local/Microsoft/Edge/User Data/Default/Local Storage/`

The app saves with the key: `oneLineJournal.entries.v2`

### How do I backup my data?
Click "Export journal" to download all entries as a JSON file. Keep this file somewhere safe (OneDrive, Google Drive, etc.).

### How do I restore from backup?
Save your backup JSON file locally, then use the import feature to restore entries.

### Browser storage limits
Most browsers allow 5-10MB of localStorage. For a daily journal, this is plenty (you'd need thousands of entries to hit the limit).

## Tips

- Use **hashtags** like `#work`, `#personal`, `#health` to organize
- Search is case-insensitive: `#WORK` finds `#work`
- Use "Keep this private" for sensitive thoughts—they won't show in history
- Export regularly as backup
- Ctrl+Enter (or Cmd+Enter on Mac) to save quickly

