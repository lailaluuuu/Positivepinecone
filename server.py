"""
One-Line Journal — Flask Backend Server
- Private database storage (SQLite)
- API for saving, retrieving, searching entries
- Privacy control: entries can be hidden from display
- Auto-delete from display after viewing
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database setup
script_dir = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(script_dir, 'journal.db')
PORT = 3000

print(f"Database path: {DB_PATH}")
print(f"Script directory: {script_dir}")

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE NOT NULL,
            content TEXT NOT NULL,
            isPrivate INTEGER DEFAULT 0,
            isDeleted INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            tags TEXT
        )
    ''')
    conn.commit()
    conn.close()

# Initialize on startup
init_db()

# ==================== API Endpoints ====================

@app.route('/api/entries', methods=['POST'])
def save_entry():
    """Save/update entry"""
    try:
        data = request.json
        date = data.get('date')
        content = data.get('content')
        is_private = data.get('isPrivate', False)
        tags = data.get('tags', '')
        
        if not date or not content:
            return jsonify({'error': 'Date and content required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if entry exists
        cursor.execute('SELECT id FROM entries WHERE date = ?', (date,))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute(
                'UPDATE entries SET content = ?, isPrivate = ?, tags = ?, isDeleted = 0 WHERE date = ?',
                (content, 1 if is_private else 0, tags, date)
            )
        else:
            cursor.execute(
                'INSERT INTO entries (date, content, isPrivate, tags) VALUES (?, ?, ?, ?)',
                (date, content, 1 if is_private else 0, tags)
            )
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Entry saved'})
    except Exception as e:
        print(f"Save error: {e}")
        return jsonify({'error': 'Failed to save entry'}), 500

@app.route('/api/entries/<date>', methods=['GET'])
def get_entry(date):
    """Get entry by date"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM entries WHERE date = ? AND isDeleted = 0', (date,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return jsonify(dict(row))
        return jsonify(None)
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve entry'}), 500

@app.route('/api/entries/public/all', methods=['GET'])
def get_public_entries():
    """Get all PUBLIC entries (not private, not deleted)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM entries WHERE isPrivate = 0 AND isDeleted = 0 ORDER BY date DESC'
        )
        rows = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(row) for row in rows])
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve entries'}), 500

@app.route('/api/entries/all', methods=['GET'])
def get_all_entries():
    """Get all entries (including private) for authorized access"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM entries WHERE isDeleted = 0 ORDER BY date DESC')
        rows = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(row) for row in rows])
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve entries'}), 500

@app.route('/api/search', methods=['GET'])
def search_entries():
    """Search entries (searches in content and tags)"""
    try:
        query = request.args.get('q', '').strip()
        include_private = request.args.get('includePrivate', 'false').lower() == 'true'
        
        if not query:
            return jsonify({'error': 'Search query required'}), 400
        
        search_term = f"%{query}%"
        conn = get_db()
        cursor = conn.cursor()
        
        if include_private:
            cursor.execute(
                'SELECT * FROM entries WHERE isDeleted = 0 AND (content LIKE ? OR tags LIKE ?) ORDER BY date DESC',
                (search_term, search_term)
            )
        else:
            cursor.execute(
                'SELECT * FROM entries WHERE isDeleted = 0 AND isPrivate = 0 AND (content LIKE ? OR tags LIKE ?) ORDER BY date DESC',
                (search_term, search_term)
            )
        
        rows = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(row) for row in rows])
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({'error': 'Search failed'}), 500

@app.route('/api/entries/<int:entry_id>/delete-from-display', methods=['POST'])
def delete_from_display(entry_id):
    """Mark entry as deleted from display (but keep in database for search)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE entries SET isDeleted = 1 WHERE id = ?', (entry_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Entry removed from display'})
    except Exception as e:
        return jsonify({'error': 'Failed to delete entry from display'}), 500

@app.route('/api/entries/<int:entry_id>/toggle-privacy', methods=['POST'])
def toggle_privacy(entry_id):
    """Toggle privacy setting"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT isPrivate FROM entries WHERE id = ?', (entry_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return jsonify({'error': 'Entry not found'}), 404
        
        new_privacy = 1 - row['isPrivate']
        cursor.execute('UPDATE entries SET isPrivate = ? WHERE id = ?', (new_privacy, entry_id))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'isPrivate': new_privacy == 1})
    except Exception as e:
        return jsonify({'error': 'Failed to toggle privacy'}), 500

@app.route('/api/export', methods=['GET'])
def export_data():
    """Export all data as JSON (backup)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM entries ORDER BY date DESC')
        rows = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(row) for row in rows])
    except Exception as e:
        return jsonify({'error': 'Export failed'}), 500

@app.route('/')
def index():
    """Serve index.html"""
    return app.send_static_file('index.html')

if __name__ == '__main__':
    print(f"Journal server running at http://localhost:{PORT}")
    print(f"Database: {DB_PATH}")
    app.run(host='localhost', port=PORT, debug=False)
