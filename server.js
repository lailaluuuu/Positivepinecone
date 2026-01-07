/* One-Line Journal — Backend Server
   - Private database storage (SQLite)
   - API for saving, retrieving, searching entries
   - Privacy control: entries can be hidden from display
   - Auto-delete from display after viewing
*/

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'journal.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      isPrivate INTEGER DEFAULT 0,
      isDeleted INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      tags TEXT
    )
  `, (err) => {
    if (err) console.error('Table creation error:', err);
    else console.log('Entries table ready');
  });
});

// Helper: Run database query and return Promise
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// ==================== API Endpoints ====================

// Save/Update entry
app.post('/api/entries', async (req, res) => {
  try {
    const { date, content, isPrivate = false, tags = '' } = req.body;
    
    if (!date || !content) {
      return res.status(400).json({ error: 'Date and content required' });
    }

    const existing = await dbGet('SELECT id FROM entries WHERE date = ?', [date]);
    
    if (existing) {
      await dbRun(
        'UPDATE entries SET content = ?, isPrivate = ?, tags = ?, isDeleted = 0 WHERE date = ?',
        [content, isPrivate ? 1 : 0, tags, date]
      );
    } else {
      await dbRun(
        'INSERT INTO entries (date, content, isPrivate, tags) VALUES (?, ?, ?, ?)',
        [date, content, isPrivate ? 1 : 0, tags]
      );
    }

    res.json({ success: true, message: 'Entry saved' });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

// Get entry by date
app.get('/api/entries/:date', async (req, res) => {
  try {
    const entry = await dbGet(
      'SELECT * FROM entries WHERE date = ? AND isDeleted = 0',
      [req.params.date]
    );
    res.json(entry || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve entry' });
  }
});

// Get all PUBLIC entries (not private, not deleted)
app.get('/api/entries/public/all', async (req, res) => {
  try {
    const entries = await dbAll(
      'SELECT * FROM entries WHERE isPrivate = 0 AND isDeleted = 0 ORDER BY date DESC'
    );
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve entries' });
  }
});

// Get all entries (including private) for authorized access
app.get('/api/entries/all', async (req, res) => {
  try {
    const entries = await dbAll(
      'SELECT * FROM entries WHERE isDeleted = 0 ORDER BY date DESC'
    );
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve entries' });
  }
});

// Search entries (searches in content and tags)
app.get('/api/search', async (req, res) => {
  try {
    const { q, includePrivate = false } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const searchTerm = `%${q}%`;
    const privateFilter = includePrivate ? '' : 'AND isPrivate = 0';
    
    const results = await dbAll(
      `SELECT * FROM entries 
       WHERE isDeleted = 0 
       AND (content LIKE ? OR tags LIKE ?) 
       ${privateFilter}
       ORDER BY date DESC`,
      [searchTerm, searchTerm]
    );
    
    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Mark entry as deleted from display (but keep in database for search)
app.post('/api/entries/:id/delete-from-display', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('UPDATE entries SET isDeleted = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Entry removed from display' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry from display' });
  }
});

// Toggle privacy setting
app.post('/api/entries/:id/toggle-privacy', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await dbGet('SELECT isPrivate FROM entries WHERE id = ?', [id]);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const newPrivacy = entry.isPrivate ? 0 : 1;
    await dbRun('UPDATE entries SET isPrivate = ? WHERE id = ?', [newPrivacy, id]);
    res.json({ success: true, isPrivate: newPrivacy === 1 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle privacy' });
  }
});

// Export all data as JSON (backup)
app.get('/api/export', async (req, res) => {
  try {
    const entries = await dbAll('SELECT * FROM entries ORDER BY date DESC');
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Journal server running at http://localhost:${PORT}`);
});
