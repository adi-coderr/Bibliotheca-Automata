const assert = require('node:assert');

// Test data structure classes directly
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

console.log('--- Testing Hand-written Data Structures ---');

// 1. HashTable
const ht = new HashTable(11);
ht.set('B001', { id: 'B001', title: 'Algorithms' });
ht.set('B002', { id: 'B002', title: 'Data Structures' });
assert.strictEqual(ht.get('B001').title, 'Algorithms');
assert.strictEqual(ht.get('B002').title, 'Data Structures');
assert.strictEqual(ht.get('B999'), undefined);
ht.set('B001', { id: 'B001', title: 'Algorithms 2nd Ed' });
assert.strictEqual(ht.get('B001').title, 'Algorithms 2nd Ed');
ht.delete('B001');
assert.strictEqual(ht.get('B001'), undefined);
console.log('✓ HashTable operations passed');

// 2. BST
const bst = new BST();
const books = [
  { id: 'B001', title: 'Operating Systems' },
  { id: 'B002', title: 'Algorithms' },
  { id: 'B003', title: 'Computer Networks' },
  { id: 'B004', title: 'Algebra' }
];
books.forEach(b => bst.insert(b));
const inord = bst.inorder();
assert.strictEqual(inord[0].title, 'Algebra');
assert.strictEqual(inord[1].title, 'Algorithms');
assert.strictEqual(inord[2].title, 'Computer Networks');
assert.strictEqual(inord[3].title, 'Operating Systems');

const algPref = bst.prefix('alg');
assert.strictEqual(algPref.length, 2); // Algebra, Algorithms

bst.remove(books[1]); // Remove Algorithms
const inordAfter = bst.inorder();
assert.strictEqual(inordAfter.find(b => b.id === 'B002'), undefined);
console.log('✓ BST in-order, prefix search, and removal passed');

// 3. MinHeap
const heap = new MinHeap();
heap.push({ id: 1, due: 100 });
heap.push({ id: 2, due: 50 });
heap.push({ id: 3, due: 75 });
heap.push({ id: 4, due: 25 });
assert.strictEqual(heap.peek().due, 25);
assert.strictEqual(heap.pop().due, 25);
assert.strictEqual(heap.pop().due, 50);
assert.strictEqual(heap.pop().due, 75);
assert.strictEqual(heap.pop().due, 100);
assert.strictEqual(heap.pop(), undefined);
console.log('✓ MinHeap push, pop, peek ordering passed');

// 4. Queue (FIFO)
const q = new Queue();
q.enqueue('M001');
q.enqueue('M002');
assert.strictEqual(q.size, 2);
assert.strictEqual(q.has('M001'), true);
assert.strictEqual(q.dequeue(), 'M001');
assert.strictEqual(q.dequeue(), 'M002');
assert.strictEqual(q.size, 0);
console.log('✓ Queue FIFO operations passed');

// 5. Stack (LIFO & 25 cap)
const st = new Stack();
for (let i = 1; i <= 30; i++) st.push(i);
assert.strictEqual(st.size, 25, 'Stack cap must be 25');
assert.strictEqual(st.pop(), 30);
assert.strictEqual(st.pop(), 29);
console.log('✓ Stack LIFO and 25 capacity cap passed');

// 6. LinkedList
const ll = new LinkedList();
ll.add('B001');
ll.add('B002');
ll.add('B003');
assert.strictEqual(ll.size, 3);
assert.deepStrictEqual(ll.toArray(), ['B001', 'B002', 'B003']);
ll.remove(v => v === 'B002');
assert.strictEqual(ll.size, 2);
assert.deepStrictEqual(ll.toArray(), ['B001', 'B003']);
ll.remove(v => v === 'B001');
assert.deepStrictEqual(ll.toArray(), ['B003']);
console.log('✓ LinkedList add, remove, toArray passed');

// 7. msort
const unsorted = [
  { name: 'Zed', num: 40 },
  { name: 'Alice', num: 10 },
  { name: 'Bob', num: 20 },
  { name: 'Charlie', num: 15 }
];
const byName = msort(unsorted, x => x.name);
assert.strictEqual(byName[0].name, 'Alice');
assert.strictEqual(byName[3].name, 'Zed');
const byNum = msort(unsorted, x => x.num);
assert.strictEqual(byNum[0].num, 10);
assert.strictEqual(byNum[3].num, 40);
console.log('✓ msort sorting passed');

console.log('\nALL DATA STRUCTURE TESTS PASSED! ✅');

