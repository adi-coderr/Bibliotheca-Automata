/* ===== Data structures (written from scratch for the DS course) ===== */
class Node { constructor(v) { this.v = v; this.next = null; } }
class LinkedList {
  constructor() { this.head = null; this.size = 0; }
  add(v) {
    const n = new Node(v);
    if (!this.head) this.head = n;
    else { let c = this.head; while (c.next) c = c.next; c.next = n; }
    this.size++;
  }
  remove(fn) {
    let c = this.head, p = null;
    while (c) {
      if (fn(c.v)) {
        p ? (p.next = c.next) : (this.head = c.next);
        this.size--;
        return true;
      }
      p = c; c = c.next;
    }
    return false;
  }
  toArray() {
    const a = [];
    for (let c = this.head; c; c = c.next) a.push(c.v);
    return a;
  }
}
class Queue {
  constructor() { this.a = []; }
  enqueue(x) { this.a.push(x); }
  dequeue() { return this.a.shift(); }
  has(x) { return this.a.includes(x); }
  get size() { return this.a.length; }
}
class Stack {
  constructor() { this.a = []; }
  push(x) { this.a.push(x); if (this.a.length > 25) this.a.shift(); }
  pop() { return this.a.pop(); }
  get size() { return this.a.length; }
}
class HashTable {
  constructor(n = 11) { this.n = n; this.b = Array.from({ length: n }, () => []); }
  h(k) {
    let x = 0;
    const str = String(k);
    for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) % this.n;
    return x;
  }
  set(k, v) {
    const b = this.b[this.h(k)], e = b.find(p => p[0] === k);
    e ? (e[1] = v) : b.push([k, v]);
  }
  get(k) {
    const e = this.b[this.h(k)].find(p => p[0] === k);
    return e && e[1];
  }
  delete(k) {
    const b = this.b[this.h(k)];
    const i = b.findIndex(p => p[0] === k);
    if (i >= 0) b.splice(i, 1);
  }
  values() { return this.b.flatMap(b => b.map(p => p[1])); }
}
class BST {
  constructor() { this.root = null; }
  insert(v) {
    const k = v.title.toLowerCase() + '|' + v.id;
    const n = { k, v, l: null, r: null };
    if (!this.root) { this.root = n; return; }
    let c = this.root;
    for (;;) {
      if (k < c.k) {
        if (!c.l) { c.l = n; return; }
        c = c.l;
      } else {
        if (!c.r) { c.r = n; return; }
        c = c.r;
      }
    }
  }
  remove(v) { this.root = this._rm(this.root, v.title.toLowerCase() + '|' + v.id); }
  _rm(n, k) {
    if (!n) return null;
    if (k < n.k) n.l = this._rm(n.l, k);
    else if (k > n.k) n.r = this._rm(n.r, k);
    else {
      if (!n.l) return n.r;
      if (!n.r) return n.l;
      let m = n.r;
      while (m.l) m = m.l;
      n.k = m.k; n.v = m.v;
      n.r = this._rm(n.r, m.k);
    }
    return n;
  }
  inorder(n = this.root, o = []) {
    if (n) {
      this.inorder(n.l, o);
      o.push(n.v);
      this.inorder(n.r, o);
    }
    return o;
  }
  prefix(p, n = this.root, o = []) {
    if (!n) return o;
    const s = n.k.slice(0, p.length);
    if (p <= s) this.prefix(p, n.l, o);
    if (s === p) o.push(n.v);
    if (p >= s) this.prefix(p, n.r, o);
    return o;
  }
  draw(n = this.root, d = 0, maxDepth = 6) {
    if (!n || d > maxDepth) return '';
    return this.draw(n.r, d + 1, maxDepth) +
      '    '.repeat(d) + n.v.title + (d === maxDepth && (n.l || n.r) ? ' [..]' : '') + '\n' +
      this.draw(n.l, d + 1, maxDepth);
  }
}
class MinHeap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(x) {
    const a = this.a; a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].due <= a[i].due) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    if (!a.length) return;
    const t = a[0], x = a.pop();
    if (a.length) {
      a[0] = x;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l].due < a[m].due) m = l;
        if (r < a.length && a[r].due < a[m].due) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return t;
  }
  peek() { return this.a[0]; }
}
function msort(a, f) {
  if (a.length < 2) return a;
  const m = a.length >> 1;
  const l = msort(a.slice(0, m), f);
  const r = msort(a.slice(m), f);
  const o = [];
  let i = 0, j = 0;
  while (i < l.length && j < r.length) {
    o.push(f(l[i]) <= f(r[j]) ? l[i++] : r[j++]);
  }
  return o.concat(l.slice(i), r.slice(j));
}

/* ===== App state ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'slms-v2', LOAN = 14, FINE = 2, MAX = 3;
let S, H, T, Q, L, U = new Stack();
let backendOnline = false;
let syncTimer = null;

const today = () => Math.floor(Date.now() / 864e5) + S.off;
const fmt = d => new Date(d * 864e5).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const pad = (p, n) => p + String(n).padStart(3, '0');

function seed() {
  const B = [
    ['Introduction to Algorithms', 'Cormen', 2009, 2],
    ['Data Structures Using C', 'Reema Thareja', 2014, 3],
    ['Let Us C', 'Yashavant Kanetkar', 2016, 2],
    ['Operating System Concepts', 'Silberschatz', 2018, 1],
    ['Database System Concepts', 'Korth', 2019, 2],
    ['Computer Networks', 'Tanenbaum', 2011, 1]
  ];
  const books = B.map((b, i) => ({ id: pad('B', i + 1), title: b[0], author: b[1], year: b[2], copies: b[3], avail: b[3] }));
  const members = [
    { id: 'M001', name: 'Aarav Sharma' },
    { id: 'M002', name: 'Riya Singh' },
    { id: 'M003', name: 'Kabir Verma' }
  ];
  return { off: 0, nb: B.length + 1, nm: 4, bulkSeeded: false, books, members, loans: [], waits: {}, log: [] };
}

function expandSeedData() {
  if (S.bulkSeeded || (S.books && S.books.length >= 50)) return;

  const titles = [
    'Foundations of Computer Science', 'Practical Web Development', 'Modern Database Design',
    'Principles of Software Engineering', 'Algorithms in Everyday Systems', 'Introduction to Artificial Intelligence',
    'Data Analysis with Python', 'Computer Networks and Security', 'Operating Systems in Practice',
    'Fundamentals of Cloud Computing', 'Human Computer Interaction', 'Machine Learning Essentials',
    'Discrete Mathematics for Computing', 'Clean Code Practices', 'Digital Logic and Computer Architecture',
    'Information Systems Management', 'Applied Statistics for Research', 'Object Oriented Programming',
    'Theory of Computation', 'Modern Cryptography', 'Mobile Application Design',
    'Natural Language Processing', 'Computer Graphics Techniques', 'Internet of Things',
    'Software Testing Strategies', 'Distributed Systems', 'Ethical Hacking Fundamentals',
    'Data Visualization Methods', 'Project Management for Technology', 'Advanced JavaScript Programming'
  ];
  const authors = ['Anita Deshmukh', 'Rohan Mehta', 'Priya Nair', 'Vikram Joshi', 'Neha Kapoor', 'Arjun Malhotra', 'Kavita Rao', 'Sanjay Iyer', 'Meera Shah', 'Rahul Verma'];
  const firstNames = ['Aditya', 'Ananya', 'Aryan', 'Diya', 'Ishaan', 'Kavya', 'Manish', 'Pooja', 'Rohan', 'Sneha', 'Tanvi', 'Varun', 'Yash', 'Shreya', 'Ayush', 'Mehul', 'Simran', 'Harsh', 'Nandini', 'Kunal', 'Pranav', 'Divya', 'Ritika', 'Akash', 'Aniket', 'Sakshi', 'Gaurav', 'Tanya', 'Deepak', 'Isha'];
  const lastNames = ['Sharma', 'Verma', 'Singh', 'Patel', 'Gupta', 'Kumar', 'Mishra', 'Joshi', 'Mehta', 'Bhatia', 'Reddy', 'Choudhury', 'Nair', 'Kapoor', 'Malhotra', 'Saxena', 'Agarwal', 'Rao', 'Das', 'Pandey', 'Yadav', 'Tripathi', 'Chauhan', 'Thakur', 'Bose'];
  const studentName = i => firstNames[i % firstNames.length] + ' ' + lastNames[(i + Math.floor(i / firstNames.length)) % lastNames.length];

  const hasBulk = S.books.some(b => b.title.includes(' - Volume '));
  if (!hasBulk) {
    for (let i = 0; i < 600; i++) {
      const id = pad('B', S.nb++);
      const base = titles[i % titles.length];
      const volume = Math.floor(i / titles.length) + 1;
      const copies = (i % 4) + 1;
      S.books.push({
        id,
        title: base + ' - Volume ' + volume,
        author: authors[i % authors.length],
        year: 2000 + (i % 26),
        copies,
        avail: copies
      });
    }
  }

  const hasBulkMem = S.members.length > 50;
  if (!hasBulkMem) {
    for (let i = 0; i < 500; i++) {
      const id = pad('M', S.nm++);
      S.members.push({ id, name: studentName(i) });
    }
  }

  // Deduplicate any books or members from previous bugged runs
  const seenB = new Set();
  S.books = S.books.filter(b => {
    if (seenB.has(b.id)) return false;
    seenB.add(b.id);
    return true;
  });

  const seenM = new Set();
  S.members = S.members.filter(m => {
    if (seenM.has(m.id)) return false;
    seenM.add(m.id);
    return true;
  });

  S.bulkSeeded = true;
}

function build() {
  H = new HashTable();
  T = new BST();
  Q = {};
  L = {};

  S.books.forEach(b => { H.set(b.id, b); T.insert(b); });
  S.members.forEach(m => { L[m.id] = new LinkedList(); });
  S.loans.forEach(l => { if (L[l.m]) L[l.m].add(l); });

  for (const b in S.waits) {
    Q[b] = new Queue();
    S.waits[b].forEach(m => Q[b].enqueue(m));
  }
}

function save() {
  // Sort books by ID for stable persistence
  S.books = H.values().sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  S.loans = Object.values(L).flatMap(l => l.toArray());
  S.waits = {};
  for (const b in Q) {
    if (Q[b].size) S.waits[b] = [...Q[b].a];
  }

  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    console.warn('localStorage save error:', e);
  }

  syncToBackend();
}

function updateBackendBadge(status, text, title) {
  const badge = $('#backendBadge');
  if (!badge) return;
  badge.className = 'badge ' + status;
  badge.textContent = text;
  badge.title = title || '';
}

async function syncToBackend() {
  if (!backendOnline) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      updateBackendBadge('sync', '⏳ Syncing...', 'Saving to backend database...');
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(S)
      });
      if (res.ok) {
        updateBackendBadge('ok', '🟢 Server Connected', 'Changes saved to SQLite database');
      } else {
        updateBackendBadge('sync', '⚠️ Sync issue', 'Failed to save to backend');
      }
    } catch (err) {
      backendOnline = false;
      updateBackendBadge('off', '💾 Local Storage (Offline)', 'Running offline with local storage');
    }
  }, 300);
}

async function initBackendSync() {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.ok) {
      const serverState = await res.json();
      if (serverState && Array.isArray(serverState.books) && serverState.books.length) {
        S = serverState;
        backendOnline = true;
        updateBackendBadge('ok', '🟢 Server Connected', 'Loaded from SQLite database');
        build();
        render();
        try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
        return;
      }
    }
    // If backend state is empty but online, push local state to backend
    if (res.ok) {
      backendOnline = true;
      updateBackendBadge('ok', '🟢 Server Connected', 'Connected to SQLite database');
      syncToBackend();
    }
  } catch (err) {
    backendOnline = false;
    updateBackendBadge('off', '💾 Local Storage (Offline)', 'Server offline; changes saved to browser');
  }
}

function load() {
  try {
    S = JSON.parse(localStorage.getItem(KEY));
  } catch (e) {}

  if (!S) S = seed();
  expandSeedData();
  build();
  save();
  initBackendSync();
}

function say(m) {
  const t = $('#toast');
  t.textContent = m;
  t.className = 'show';
  clearTimeout(say.t);
  say.t = setTimeout(() => { t.className = ''; }, 5000);
}

function log(m) {
  S.log.unshift(fmt(today()) + ': ' + m);
  S.log = S.log.slice(0, 12);
}

function commit(fn) {
  U.push(JSON.stringify(S));
  fn();
  save();
  render();
}

const bookName = id => { const b = H.get(id); return b ? b.title : id; };
const memName = id => (S.members.find(m => m.id === id) || { name: id }).name;
const hasLoan = (m, b) => Boolean(L[m] && L[m].toArray().some(l => l.b === b));

/* ===== Actions ===== */
function addBook(t, a, y, c) {
  if (!t || !a) return say('Please provide both book title and author.');
  if (!(y >= 1000 && y <= 2100 && c >= 1)) return say('Enter a valid year (1000-2100) and copy count (at least 1).');

  commit(() => {
    const b = { id: pad('B', S.nb++), title: t, author: a, year: y, copies: c, avail: c };
    H.set(b.id, b);
    T.insert(b);
    log('Added ' + t);
    say('Added "' + t + '" as ' + b.id);
  });
}

function removeBook(id) {
  const b = H.get(id);
  if (!b) return say('Book not found: ' + id);
  if (b.avail < b.copies || (Q[id] && Q[id].size)) {
    return say('Cannot delete: copies are issued or people are waiting.');
  }

  commit(() => {
    H.delete(id);
    T.remove(b);
    delete Q[id];
    log('Deleted ' + b.title);
    say('Deleted ' + b.title);
  });
}

function addMember(n) {
  if (!n || !n.trim()) return say('Please enter student / member name.');
  n = n.trim();

  commit(() => {
    const m = { id: pad('M', S.nm++), name: n };
    S.members.push(m);
    L[m.id] = new LinkedList();
    log('New member ' + n);
    say('Added ' + n + ' as ' + m.id);
  });
}

function issue(bid, mid) {
  const b = H.get(bid);
  if (!b || !L[mid]) return say('Choose a valid book and member.');
  if (hasLoan(mid, bid)) return say('This member already holds this book.');
  if (Q[bid] && Q[bid].has(mid)) return say('This member is already on the waitlist.');
  if (b.avail > 0 && L[mid].size >= MAX) return say('Limit reached: a member can hold ' + MAX + ' books.');

  commit(() => {
    if (b.avail > 0) {
      b.avail--;
      L[mid].add({ b: bid, m: mid, out: today(), due: today() + LOAN });
      log(b.title + ' issued to ' + memName(mid));
      say('Issued. Due on ' + fmt(today() + LOAN));
    } else {
      (Q[bid] = Q[bid] || new Queue()).enqueue(mid);
      log(memName(mid) + ' waitlisted for ' + b.title);
      say('No copies free. Added to waitlist at position ' + Q[bid].size);
    }
  });
}

function giveBack(bid, mid) {
  const b = H.get(bid);
  if (!b) return say('Book not found: ' + bid);
  const ln = L[mid] && L[mid].toArray().find(l => l.b === bid);
  if (!ln) return say('This member does not hold that book.');

  commit(() => {
    const fine = Math.max(0, today() - ln.due) * FINE;
    L[mid].remove(l => l.b === bid);
    b.avail++;
    log(b.title + ' returned by ' + memName(mid) + (fine ? ' (fine Rs ' + fine + ')' : ''));
    let msg = 'Returned.' + (fine ? ' Fine due: Rs ' + fine + '.' : ' No fine.');
    const q = Q[bid];

    while (q && q.size && b.avail > 0) {
      const n = q.dequeue();
      if (!L[n]) L[n] = new LinkedList();
      if (L[n].size < MAX && !hasLoan(n, bid)) {
        b.avail--;
        L[n].add({ b: bid, m: n, out: today(), due: today() + LOAN });
        log(b.title + ' auto-issued to ' + memName(n));
        msg += ' Auto-issued to ' + memName(n) + ' from the waitlist.';
        break;
      }
    }
    say(msg);
  });
}

function undo() {
  const s = U.pop();
  if (!s) return;
  S = JSON.parse(s);
  build();
  save();
  render();
  say('Last action undone.');
}

function findBook(q) {
  if (!q) return null;
  const s = q.trim();
  if (!s) return null;
  const u = s.toUpperCase(), m = s.match(/\b(B\d+)\b/i);
  let b = H.get(u);
  if (b) return b;
  if (m) {
    b = H.get(m[1].toUpperCase());
    if (b) return b;
  }
  const lower = s.toLowerCase(), all = T.inorder();
  b = all.find(x => x.title.toLowerCase() === lower);
  if (b) return b;
  const pfx = T.prefix(lower);
  if (pfx.length) return pfx[0];
  b = all.find(x => x.title.toLowerCase().includes(lower));
  if (b) return b;
  b = all.find(x => x.author.toLowerCase().includes(lower));
  return b || null;
}

function findMember(q) {
  if (!q) return null;
  const s = q.trim();
  if (!s) return null;
  const u = s.toUpperCase(), idM = s.match(/\b(M\d+)\b/i);
  let m = S.members.find(x => x.id.toUpperCase() === u);
  if (m) return m;
  if (idM) {
    m = S.members.find(x => x.id.toUpperCase() === idM[1].toUpperCase());
    if (m) return m;
  }
  const lower = s.toLowerCase();
  m = S.members.find(x => x.name.toLowerCase() === lower);
  if (m) return m;
  m = S.members.find(x => x.name.toLowerCase().startsWith(lower));
  if (m) return m;
  m = S.members.find(x => x.name.toLowerCase().includes(lower));
  return m || null;
}

function handleIssue() {
  const bt = $('#cb').value.trim(), mt = $('#cm').value.trim();
  if (!bt || !mt) return say('Please write both the book name and student name.');

  const b = findBook(bt);
  if (!b) return say('Book not found: "' + bt + '". Check title or ID.');

  let m = findMember(mt);
  if (!m) {
    if (mt.length >= 2 && !/^M\d+$/i.test(mt)) {
      commit(() => {
        const newId = pad('M', S.nm++);
        m = { id: newId, name: mt };
        S.members.push(m);
        L[m.id] = new LinkedList();
        log('New member ' + mt + ' registered');
      });
    } else {
      return say('Student "' + mt + '" not found.');
    }
  }

  const wasAvail = b.avail > 0, preCount = L[m.id] ? L[m.id].size : 0;
  issue(b.id, m.id);
  if ((wasAvail && L[m.id] && L[m.id].size > preCount) || (Q[b.id] && Q[b.id].has(m.id))) {
    $('#cb').value = '';
    $('#cm').value = '';
  }
}

function handleReturn() {
  const bt = $('#cb').value.trim(), mt = $('#cm').value.trim();
  if (!bt && !mt) return say('Please write the book name and/or student name to return.');

  let b = bt ? findBook(bt) : null;
  let m = mt ? findMember(mt) : null;

  if (bt && !b) return say('Book not found: "' + bt + '".');
  if (mt && !m) return say('Student "' + mt + '" not found.');

  if (b && !m) {
    const loans = Object.values(L).flatMap(l => l.toArray()).filter(l => l.b === b.id);
    if (!loans.length) return say('No active loans found for "' + b.title + '".');
    if (loans.length === 1) m = S.members.find(x => x.id === loans[0].m);
    else return say('Multiple students hold "' + b.title + '": ' + loans.map(l => memName(l.m)).join(', ') + '. Please specify the student name.');
  }

  if (m && !b) {
    const loans = L[m.id] ? L[m.id].toArray() : [];
    if (!loans.length) return say(m.name + ' does not hold any issued books.');
    if (loans.length === 1) b = H.get(loans[0].b);
    else return say(m.name + ' holds multiple books: ' + loans.map(l => bookName(l.b)).join(', ') + '. Please specify the book title.');
  }

  if (!b || !m) return say('Please specify which book and student to return.');

  const had = hasLoan(m.id, b.id);
  giveBack(b.id, m.id);
  if (had && !hasLoan(m.id, b.id)) {
    $('#cb').value = '';
    $('#cm').value = '';
  }
}

/* ===== Rendering ===== */
function render() {
  $('#date').textContent = fmt(today());
  $('#undoBtn').textContent = 'Undo (' + U.size + ')';
  $('#undoBtn').disabled = !U.size;

  const loans = Object.values(L).flatMap(l => l.toArray());
  const od = loans.filter(l => l.due < today()).length;

  $('#stats').innerHTML = [
    ['Titles', H.values().length],
    ['Copies free', H.values().reduce((s, b) => s + b.avail, 0)],
    ['On loan', loans.length],
    ['Overdue', od],
    ['Members', S.members.length]
  ].map(x => '<div>' + x[0] + '<b>' + x[1] + '</b></div>').join('');

  let list;
  const q = $('#q').value.trim().toLowerCase();
  if (q) {
    const seen = new Set();
    const byId = H.get(q.toUpperCase());
    [byId, ...T.prefix(q), ...H.values().filter(b => b.author.toLowerCase().includes(q))].forEach(b => {
      if (b && !seen.has(b.id)) {
        seen.add(b.id);
      }
    });
    list = T.inorder().filter(b => seen.has(b.id));
  } else {
    list = T.inorder();
  }

  const k = $('#sort').value;
  if (k === 'author') list = msort(list, b => b.author.toLowerCase());
  if (k === 'year') list = msort(list, b => b.year);

  $('#bBody').innerHTML = list.length
    ? list.map(b =>
        '<tr><td>' + b.id + '</td><td>' + esc(b.title) + '</td><td>' + esc(b.author) + '</td><td>' + b.year + '</td><td class="' +
        (b.avail ? 'ok' : 'late') + '">' + b.avail + ' / ' + b.copies + '</td><td>' +
        (Q[b.id] ? Q[b.id].size : 0) + '</td><td><button class="del" data-del="' + b.id +
        '" aria-label="Delete ' + esc(b.title) + '">Delete</button></td></tr>'
      ).join('')
    : '<tr><td colspan="7">No books match. Clear the search or add a book above.</td></tr>';

  const dlB = $('#dlBooks'), dlM = $('#dlMembers');
  if (dlB) {
    dlB.innerHTML = T.inorder().slice(0, 100).map(b =>
      '<option value="' + esc(b.title) + '" label="' + b.id + ' (' + b.avail + ' free)">' + b.id + '</option>'
    ).join('');
  }
  if (dlM) {
    dlM.innerHTML = S.members.slice(0, 100).map(m =>
      '<option value="' + esc(m.name) + '" label="' + m.id + '">' + m.id + '</option>'
    ).join('');
  }

  const row = l => {
    const d = l.due - today();
    return '<tr><td>' + esc(bookName(l.b)) + '</td><td>' + esc(memName(l.m)) + '</td><td>' + fmt(l.due) + '</td><td class="' +
      (d < 0 ? 'late' : d <= 3 ? 'warn' : 'ok') + '">' + (d < 0 ? -d + ' days late' : d + ' days left') +
      '</td><td><button class="retBtn" data-rb="' + l.b + '" data-rm="' + l.m + '">Return</button></td></tr>';
  };

  $('#loans').innerHTML = loans.length
    ? '<table><thead><tr><th>Book</th><th>Member / Student</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
      loans.map(row).join('') + '</tbody></table>'
    : '<p class="note">No books are on loan. Issue one above.</p>';

  const w = Object.keys(Q).filter(b => Q[b].size);
  $('#waits').innerHTML = w.length
    ? w.map(b => '<p><b>' + esc(bookName(b)) + '</b>: ' + Q[b].a.map((m, i) => (i + 1) + '. ' + esc(memName(m))).join(', ') + '</p>').join('')
    : '<p class="note">No waitlists right now.</p>';

  $('#log').innerHTML = S.log.map(x => '<li>' + esc(x) + '</li>').join('') || '<li>No activity yet.</li>';

  $('#mList').innerHTML = '<table><thead><tr><th>ID</th><th>Name</th><th>Issued books (linked list)</th></tr></thead><tbody>' +
    S.members.map(m =>
      '<tr><td>' + m.id + '</td><td>' + esc(m.name) + '</td><td>' +
      ((L[m.id] ? L[m.id].toArray().map(l => esc(bookName(l.b))).join(' &rarr; ') : '') || 'none') +
      '</td></tr>'
    ).join('') + '</tbody></table>';

  // MinHeap for overdue books (earliest due dates first)
  const hp = new MinHeap();
  loans.forEach(l => hp.push(l));
  const late = [];
  while (hp.size && hp.peek().due < today()) late.push(hp.pop());

  $('#oList').innerHTML = late.length
    ? '<table><thead><tr><th>Book</th><th>Member</th><th>Due</th><th>Days late</th><th>Fine</th></tr></thead><tbody>' +
      late.map(l =>
        '<tr><td>' + esc(bookName(l.b)) + '</td><td>' + esc(memName(l.m)) + '</td><td>' + fmt(l.due) + '</td><td class="late">' +
        (today() - l.due) + '</td><td>Rs ' + (today() - l.due) * FINE + '</td></tr>'
      ).join('') +
      '</tbody></table><p><b>Total fines: Rs ' + late.reduce((s, l) => s + (today() - l.due) * FINE, 0) + '</b></p>'
    : '<p class="note">Nothing is overdue. Use "+7 days" in the header to simulate time passing.</p>';

  // Live Data Structures View
  const heapDisplay = [];
  const hpCopy = new MinHeap();
  loans.forEach(l => hpCopy.push(l));
  while (hpCopy.size && heapDisplay.length < 8) {
    const cur = hpCopy.pop();
    heapDisplay.push(bookName(cur.b) + ' (due ' + fmt(cur.due) + ')');
  }

  $('#dsView').innerHTML = '<div class="grid">' +
    '<div><h3>Hash table (book ID - 11 buckets)</h3><pre>' +
    H.b.map((b, i) => '[' + String(i).padStart(2) + '] ' + (b.map(p => p[0]).join(' -> ') || 'empty')).join('\n') +
    '</pre></div>' +
    '<div><h3>BST by title (sideways: right on top)</h3><pre>' +
    esc(T.draw() || 'empty') +
    '</pre></div>' +
    '<div><h3>Waitlist queues (front first)</h3><pre>' +
    esc(w.map(b => bookName(b) + ': ' + Q[b].a.map(memName).join(', ')).join('\n') || 'all queues empty') +
    '</pre></div>' +
    '<div><h3>Undo stack &amp; heap</h3><pre>Undo stack size: ' + U.size +
    '\n\nEarliest due loans (Min-Heap popped order):\n' +
    (heapDisplay.join('\n') || 'no active loans in heap') +
    '</pre></div></div>';
}

/* ===== Events ===== */
document.querySelectorAll('nav button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('main section').forEach(s => { s.hidden = s.id !== b.dataset.t; });
  };
});

$('#fBook').onsubmit = e => {
  e.preventDefault();
  const y = +$('#by').value, c = +$('#bc').value;
  addBook($('#bt').value.trim(), $('#ba').value.trim(), y, c);
  e.target.reset();
  $('#bc').value = 1;
};

$('#fMem').onsubmit = e => {
  e.preventDefault();
  addMember($('#mn').value.trim());
  e.target.reset();
};

$('#bBody').onclick = e => {
  const id = e.target.dataset.del;
  if (id) removeBook(id);
};

$('#q').oninput = render;
$('#sort').onchange = render;
$('#undoBtn').onclick = undo;
$('#issue').onclick = handleIssue;
$('#ret').onclick = handleReturn;

$('#cb').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); handleIssue(); } };
$('#cm').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); handleIssue(); } };

$('#loans').onclick = e => {
  const b = e.target.dataset.rb, m = e.target.dataset.rm;
  if (b && m) giveBack(b, m);
};

$('#p7').onclick = () => commit(() => { S.off += 7; say('Moved 7 days ahead.'); });
$('#p0').onclick = () => commit(() => { S.off = 0; say('Date reset to today.'); });

const badgeEl = $('#backendBadge');
if (badgeEl) {
  badgeEl.onclick = () => {
    initBackendSync();
    say('Syncing with backend server...');
  };
}

load();
render();
