const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { LibraryDatabase } = require('./database.js');

function createServer(dbPath) {
  const app = express();
  const db = new LibraryDatabase(dbPath);

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Serve static files
  app.use(express.static(path.join(__dirname)));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Bibliotheca-Automata Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Get full state
  app.get('/api/state', (req, res) => {
    try {
      const state = db.getState();
      res.json(state);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save/sync full state
  app.post('/api/state', (req, res) => {
    try {
      db.saveState(req.body);
      res.json({ success: true, message: 'State saved successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get books
  app.get('/api/books', (req, res) => {
    try {
      const state = db.getState();
      let books = state.books;
      const q = (req.query.q || '').trim().toLowerCase();
      if (q) {
        books = books.filter(b =>
          b.id.toLowerCase() === q ||
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
        );
      }
      const sort = req.query.sort;
      if (sort === 'author') {
        books.sort((a, b) => a.author.localeCompare(b.author));
      } else if (sort === 'year') {
        books.sort((a, b) => a.year - b.year);
      } else if (sort === 'title') {
        books.sort((a, b) => a.title.localeCompare(b.title));
      }
      res.json(books);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add book
  app.post('/api/books', (req, res) => {
    try {
      const { title, author, year, copies } = req.body;
      const book = db.addBook({ title, author, year, copies });
      res.status(201).json(book);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete book
  app.delete('/api/books/:id', (req, res) => {
    try {
      const result = db.deleteBook(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get members
  app.get('/api/members', (req, res) => {
    try {
      const state = db.getState();
      res.json(state.members);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add member
  app.post('/api/members', (req, res) => {
    try {
      const { name } = req.body;
      const member = db.addMember({ name });
      res.status(201).json(member);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get active loans
  app.get('/api/loans', (req, res) => {
    try {
      const state = db.getState();
      res.json(state.loans);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Issue book
  app.post('/api/issue', (req, res) => {
    try {
      const { bookId, memberId } = req.body;
      if (!bookId || !memberId) {
        return res.status(400).json({ error: 'Book ID and Member ID are required.' });
      }
      const result = db.issueBook(bookId, memberId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Return book
  app.post('/api/return', (req, res) => {
    try {
      const { bookId, memberId } = req.body;
      if (!bookId || !memberId) {
        return res.status(400).json({ error: 'Book ID and Member ID are required.' });
      }
      const result = db.returnBook(bookId, memberId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Date controls
  app.post('/api/date/advance', (req, res) => {
    try {
      const days = Number(req.body.days) || 7;
      const off = db.advanceDate(days);
      res.json({ success: true, off, message: `Advanced by ${days} days` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/date/reset', (req, res) => {
    try {
      const off = db.resetDate();
      res.json({ success: true, off, message: 'Date reset to today' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Undo snapshot endpoints
  app.post('/api/undo/push', (req, res) => {
    try {
      const { state } = req.body;
      if (!state) return res.status(400).json({ error: 'State snapshot required' });
      db.pushUndo(typeof state === 'string' ? state : JSON.stringify(state));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/undo/pop', (req, res) => {
    try {
      const snapshot = db.popUndo();
      if (!snapshot) return res.json({ snapshot: null });
      res.json({ snapshot: JSON.parse(snapshot) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset database to initial seed
  app.post('/api/reset', (req, res) => {
    try {
      db.resetAll();
      res.json({ success: true, state: db.getState() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Export full JSON
  app.get('/api/export', (req, res) => {
    try {
      const state = db.getState();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="library-state.json"');
      res.send(JSON.stringify(state, null, 2));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Import full JSON
  app.post('/api/import', (req, res) => {
    try {
      const state = req.body;
      db.saveState(state);
      res.json({ success: true, message: 'Database imported successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return { app, db };
}

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const { app } = createServer();
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  Smart Library Management System Backend`);
    console.log(`  Server running at http://localhost:${PORT}`);
    console.log(`  Database path: ./data/library.db`);
    console.log(`===============================================`);
  });
}

module.exports = { createServer };

