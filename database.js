const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DEFAULT_DB_PATH = path.join(__dirname, 'data', 'library.db');

class LibraryDatabase {
  constructor(dbPath = DEFAULT_DB_PATH) {
    this.dbPath = dbPath;
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.initTables();
    this.ensureInitialData();
  }

  initTables() {
    this.db.exec(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        val TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        year INTEGER NOT NULL,
        copies INTEGER NOT NULL,
        avail INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        out_day INTEGER NOT NULL,
        due_day INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS waitlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        pos INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS undo_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
  }

  pad(prefix, num) {
    return prefix + String(num).padStart(3, '0');
  }

  getMeta(key, defaultVal = null) {
    const row = this.db.prepare('SELECT val FROM meta WHERE key = ?').get(key);
    return row ? row.val : defaultVal;
  }

  setMeta(key, val) {
    this.db.prepare('INSERT OR REPLACE INTO meta (key, val) VALUES (?, ?)').run(key, String(val));
  }

  getToday() {
    const off = parseInt(this.getMeta('off', '0'), 10) || 0;
    return Math.floor(Date.now() / 864e5) + off;
  }

  ensureInitialData() {
    const bookCount = this.db.prepare('SELECT COUNT(*) as c FROM books').get().c;
    if (bookCount > 0) return;

    // Seed data per SPEC
    const initialBooks = [
      ['Introduction to Algorithms', 'Cormen', 2009, 2],
      ['Data Structures Using C', 'Reema Thareja', 2014, 3],
      ['Let Us C', 'Yashavant Kanetkar', 2016, 2],
      ['Operating System Concepts', 'Silberschatz', 2018, 1],
      ['Database System Concepts', 'Korth', 2019, 2],
      ['Computer Networks', 'Tanenbaum', 2011, 1]
    ];

    const initialMembers = [
      { id: 'M001', name: 'Aarav Sharma' },
      { id: 'M002', name: 'Riya Singh' },
      { id: 'M003', name: 'Kabir Verma' }
    ];

    this.db.exec('BEGIN TRANSACTION');
    try {
      const insBook = this.db.prepare(
        'INSERT INTO books (id, title, author, year, copies, avail) VALUES (?, ?, ?, ?, ?, ?)'
      );
      initialBooks.forEach((b, i) => {
        const id = this.pad('B', i + 1);
        insBook.run(id, b[0], b[1], b[2], b[3], b[3]);
      });

      const insMember = this.db.prepare('INSERT INTO members (id, name) VALUES (?, ?)');
      initialMembers.forEach(m => {
        insMember.run(m.id, m.name);
      });

      this.setMeta('off', '0');
      this.setMeta('nb', String(initialBooks.length + 1));
      this.setMeta('nm', String(initialMembers.length + 1));
      this.setMeta('bulkSeeded', 'false');

      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  getState() {
    const off = parseInt(this.getMeta('off', '0'), 10) || 0;
    const nb = parseInt(this.getMeta('nb', '7'), 10) || 7;
    const nm = parseInt(this.getMeta('nm', '4'), 10) || 4;
    const bulkSeeded = this.getMeta('bulkSeeded', 'false') === 'true';

    const books = this.db.prepare('SELECT id, title, author, year, copies, avail FROM books ORDER BY id').all();
    const members = this.db.prepare('SELECT id, name FROM members ORDER BY id').all();
    const loanRows = this.db.prepare('SELECT book_id as b, member_id as m, out_day as out, due_day as due FROM loans').all();

    const waitRows = this.db.prepare('SELECT book_id, member_id FROM waitlists ORDER BY book_id, pos ASC').all();
    const waits = {};
    for (const row of waitRows) {
      if (!waits[row.book_id]) waits[row.book_id] = [];
      waits[row.book_id].push(row.member_id);
    }

    const logRows = this.db.prepare('SELECT message FROM logs ORDER BY id DESC LIMIT 12').all();
    const log = logRows.map(r => r.message);

    return {
      off,
      nb,
      nm,
      bulkSeeded,
      books,
      members,
      loans: loanRows,
      waits,
      log
    };
  }

  saveState(state) {
    if (!state || typeof state !== 'object') {
      throw new Error('Invalid state object');
    }

    this.db.exec('BEGIN TRANSACTION');
    try {
      if (state.off !== undefined) this.setMeta('off', String(state.off));
      if (state.nb !== undefined) this.setMeta('nb', String(state.nb));
      if (state.nm !== undefined) this.setMeta('nm', String(state.nm));
      if (state.bulkSeeded !== undefined) this.setMeta('bulkSeeded', state.bulkSeeded ? 'true' : 'false');

      if (Array.isArray(state.books)) {
        this.db.exec('DELETE FROM books');
        const insBook = this.db.prepare(
          'INSERT INTO books (id, title, author, year, copies, avail) VALUES (?, ?, ?, ?, ?, ?)'
        );
        for (const b of state.books) {
          insBook.run(b.id, b.title, b.author, Number(b.year), Number(b.copies), Number(b.avail));
        }
      }

      if (Array.isArray(state.members)) {
        this.db.exec('DELETE FROM members');
        const insMember = this.db.prepare('INSERT INTO members (id, name) VALUES (?, ?)');
        for (const m of state.members) {
          insMember.run(m.id, m.name);
        }
      }

      if (Array.isArray(state.loans)) {
        this.db.exec('DELETE FROM loans');
        const insLoan = this.db.prepare(
          'INSERT INTO loans (book_id, member_id, out_day, due_day) VALUES (?, ?, ?, ?)'
        );
        for (const l of state.loans) {
          insLoan.run(l.b, l.m, Number(l.out), Number(l.due));
        }
      }

      if (state.waits && typeof state.waits === 'object') {
        this.db.exec('DELETE FROM waitlists');
        const insWait = this.db.prepare(
          'INSERT INTO waitlists (book_id, member_id, pos) VALUES (?, ?, ?)'
        );
        for (const bookId in state.waits) {
          const list = state.waits[bookId];
          if (Array.isArray(list)) {
            list.forEach((memberId, pos) => {
              insWait.run(bookId, memberId, pos + 1);
            });
          }
        }
      }

      if (Array.isArray(state.log)) {
        this.db.exec('DELETE FROM logs');
        const insLog = this.db.prepare('INSERT INTO logs (message, created_at) VALUES (?, ?)');
        const now = Date.now();
        // Insert in chronological order
        const slice = state.log.slice(0, 12).reverse();
        slice.forEach((msg, idx) => {
          insLog.run(msg, now + idx);
        });
      }

      this.db.exec('COMMIT');
      return true;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  addBook({ title, author, year, copies }) {
    if (!title || !author) {
      throw new Error('Title and author are required');
    }
    const y = Number(year);
    const c = Number(copies);
    if (!(y >= 1000 && y <= 2100 && c >= 1)) {
      throw new Error('Invalid year (1000-2100) or copy count (>= 1)');
    }

    let nb = parseInt(this.getMeta('nb', '7'), 10) || 7;
    const id = this.pad('B', nb++);
    this.setMeta('nb', String(nb));

    this.db.prepare(
      'INSERT INTO books (id, title, author, year, copies, avail) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, title.trim(), author.trim(), y, c, c);

    this.addLog(`Added ${title} (${id})`);
    return { id, title: title.trim(), author: author.trim(), year: y, copies: c, avail: c };
  }

  deleteBook(id) {
    const book = this.db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    if (!book) {
      throw new Error(`Book not found: ${id}`);
    }

    const waitCount = this.db.prepare('SELECT COUNT(*) as c FROM waitlists WHERE book_id = ?').get(id).c;
    if (book.avail < book.copies || waitCount > 0) {
      throw new Error('Cannot delete: copies are issued or people are waiting.');
    }

    this.db.exec('BEGIN TRANSACTION');
    try {
      this.db.prepare('DELETE FROM books WHERE id = ?').run(id);
      this.db.prepare('DELETE FROM waitlists WHERE book_id = ?').run(id);
      this.addLog(`Deleted ${book.title}`);
      this.db.exec('COMMIT');
      return { success: true, id, title: book.title };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  addMember({ name }) {
    if (!name || !name.trim()) {
      throw new Error('Member name is required');
    }
    const trimmed = name.trim();
    let nm = parseInt(this.getMeta('nm', '4'), 10) || 4;
    const id = this.pad('M', nm++);
    this.setMeta('nm', String(nm));

    this.db.prepare('INSERT INTO members (id, name) VALUES (?, ?)').run(id, trimmed);
    this.addLog(`New member ${trimmed} (${id})`);
    return { id, name: trimmed };
  }

  issueBook(bookId, memberId) {
    const book = this.db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    if (!book) throw new Error(`Book not found: ${bookId}`);

    const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    if (!member) throw new Error(`Member not found: ${memberId}`);

    const existingLoan = this.db.prepare(
      'SELECT id FROM loans WHERE book_id = ? AND member_id = ?'
    ).get(bookId, memberId);
    if (existingLoan) throw new Error('This member already holds this book.');

    const existingWait = this.db.prepare(
      'SELECT id FROM waitlists WHERE book_id = ? AND member_id = ?'
    ).get(bookId, memberId);
    if (existingWait) throw new Error('This member is already on the waitlist.');

    const memberLoanCount = this.db.prepare(
      'SELECT COUNT(*) as c FROM loans WHERE member_id = ?'
    ).get(memberId).c;

    const today = this.getToday();
    const LOAN_PERIOD = 14;
    const MAX_LOANS = 3;

    if (book.avail > 0) {
      if (memberLoanCount >= MAX_LOANS) {
        throw new Error(`Limit reached: a member can hold ${MAX_LOANS} books.`);
      }

      this.db.exec('BEGIN TRANSACTION');
      try {
        this.db.prepare('UPDATE books SET avail = avail - 1 WHERE id = ?').run(bookId);
        const due = today + LOAN_PERIOD;
        this.db.prepare(
          'INSERT INTO loans (book_id, member_id, out_day, due_day) VALUES (?, ?, ?, ?)'
        ).run(bookId, memberId, today, due);
        this.addLog(`${book.title} issued to ${member.name}`);
        this.db.exec('COMMIT');

        return {
          status: 'issued',
          bookId,
          memberId,
          out: today,
          due,
          message: `Issued. Due on ${new Date(due * 864e5).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}`
        };
      } catch (err) {
        this.db.exec('ROLLBACK');
        throw err;
      }
    } else {
      // Add to waitlist
      const currentPos = this.db.prepare(
        'SELECT COUNT(*) as c FROM waitlists WHERE book_id = ?'
      ).get(bookId).c + 1;

      this.db.prepare(
        'INSERT INTO waitlists (book_id, member_id, pos) VALUES (?, ?, ?)'
      ).run(bookId, memberId, currentPos);

      this.addLog(`${member.name} waitlisted for ${book.title}`);
      return {
        status: 'waitlisted',
        bookId,
        memberId,
        position: currentPos,
        message: `No copies free. Added to waitlist at position ${currentPos}`
      };
    }
  }

  returnBook(bookId, memberId) {
    const book = this.db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    if (!book) throw new Error(`Book not found: ${bookId}`);

    const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    if (!member) throw new Error(`Member not found: ${memberId}`);

    const loan = this.db.prepare(
      'SELECT * FROM loans WHERE book_id = ? AND member_id = ?'
    ).get(bookId, memberId);
    if (!loan) throw new Error('This member does not hold that book.');

    const today = this.getToday();
    const daysLate = Math.max(0, today - loan.due_day);
    const fine = daysLate * 2;
    const LOAN_PERIOD = 14;
    const MAX_LOANS = 3;

    this.db.exec('BEGIN TRANSACTION');
    try {
      this.db.prepare('DELETE FROM loans WHERE id = ?').run(loan.id);
      let avail = book.avail + 1;
      this.db.prepare('UPDATE books SET avail = ? WHERE id = ?').run(avail, bookId);

      this.addLog(`${book.title} returned by ${member.name}${fine ? ` (fine Rs ${fine})` : ''}`);

      let autoIssuedTo = null;
      // Check waitlist
      const waitlist = this.db.prepare(
        'SELECT id, member_id FROM waitlists WHERE book_id = ? ORDER BY pos ASC'
      ).all(bookId);

      for (const w of waitlist) {
        this.db.prepare('DELETE FROM waitlists WHERE id = ?').run(w.id);

        const mCount = this.db.prepare('SELECT COUNT(*) as c FROM loans WHERE member_id = ?').get(w.member_id).c;
        const alreadyHolds = this.db.prepare(
          'SELECT id FROM loans WHERE book_id = ? AND member_id = ?'
        ).get(bookId, w.member_id);

        if (mCount < MAX_LOANS && !alreadyHolds) {
          avail--;
          this.db.prepare('UPDATE books SET avail = ? WHERE id = ?').run(avail, bookId);
          const nextDue = today + LOAN_PERIOD;
          this.db.prepare(
            'INSERT INTO loans (book_id, member_id, out_day, due_day) VALUES (?, ?, ?, ?)'
          ).run(bookId, w.member_id, today, nextDue);

          const nextMem = this.db.prepare('SELECT name FROM members WHERE id = ?').get(w.member_id);
          const nextName = nextMem ? nextMem.name : w.member_id;
          this.addLog(`${book.title} auto-issued to ${nextName}`);
          autoIssuedTo = { id: w.member_id, name: nextName, due: nextDue };
          break;
        }
      }

      // Re-number remaining waitlist positions
      const remainingWaits = this.db.prepare(
        'SELECT id FROM waitlists WHERE book_id = ? ORDER BY pos ASC'
      ).all(bookId);
      remainingWaits.forEach((rw, idx) => {
        this.db.prepare('UPDATE waitlists SET pos = ? WHERE id = ?').run(idx + 1, rw.id);
      });

      this.db.exec('COMMIT');

      let message = `Returned.${fine ? ` Fine due: Rs ${fine}.` : ' No fine.'}`;
      if (autoIssuedTo) {
        message += ` Auto-issued to ${autoIssuedTo.name} from the waitlist.`;
      }

      return {
        success: true,
        daysLate,
        fine,
        autoIssuedTo,
        message
      };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  addLog(message) {
    this.db.prepare('INSERT INTO logs (message, created_at) VALUES (?, ?)').run(message, Date.now());
  }

  advanceDate(days = 7) {
    const cur = parseInt(this.getMeta('off', '0'), 10) || 0;
    const next = cur + days;
    this.setMeta('off', String(next));
    return next;
  }

  resetDate() {
    this.setMeta('off', '0');
    return 0;
  }

  resetAll() {
    this.db.exec('BEGIN TRANSACTION');
    try {
      this.db.exec(`
        DELETE FROM loans;
        DELETE FROM waitlists;
        DELETE FROM logs;
        DELETE FROM undo_history;
        DELETE FROM books;
        DELETE FROM members;
        DELETE FROM meta;
      `);
      this.db.exec('COMMIT');
      this.ensureInitialData();
      return true;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  pushUndo(stateJson) {
    this.db.prepare('INSERT INTO undo_history (state_json, created_at) VALUES (?, ?)').run(
      stateJson,
      Date.now()
    );
    // Keep max 25
    const count = this.db.prepare('SELECT COUNT(*) as c FROM undo_history').get().c;
    if (count > 25) {
      const oldest = this.db.prepare('SELECT id FROM undo_history ORDER BY id ASC LIMIT ?').all(count - 25);
      for (const row of oldest) {
        this.db.prepare('DELETE FROM undo_history WHERE id = ?').run(row.id);
      }
    }
  }

  popUndo() {
    const last = this.db.prepare('SELECT id, state_json FROM undo_history ORDER BY id DESC LIMIT 1').get();
    if (!last) return null;
    this.db.prepare('DELETE FROM undo_history WHERE id = ?').run(last.id);
    return last.state_json;
  }
}

module.exports = { LibraryDatabase };

