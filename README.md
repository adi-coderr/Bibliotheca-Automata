# Bibliotheca Automata (Smart Library Management System)

A full-stack Smart Library Management System designed for 2nd Year Computer Science & Engineering (AKTU Data Structures course).

Every core library operation is driven by **hand-written data structures** without built-in helper libraries, paired with a persistent **Node.js + SQLite REST API backend**.

---

## 🚀 Quick Start

### 1. Install & Start Backend
```bash
# Install dependencies
npm install

# Run backend server
npm start
```
The server will start at **`http://localhost:3000`**. Open that URL in any modern browser.

### 2. Run Tests
```bash
npm test
```
Runs unit tests for hand-written data structures, database persistence, and REST API endpoints.

---

## 🏛 Architecture & Data Storage

The system operates in **dual mode**:
1. **Full Backend Mode (Server Connected)**:
   - Built on **Express** and Node.js built-in **`node:sqlite`** (`DatabaseSync`).
   - Changes are saved directly to an ACID-compliant SQLite database at `data/library.db`.
   - Structured relational schema:
     - `books`: `id`, `title`, `author`, `year`, `copies`, `avail`
     - `members`: `id`, `name`
     - `loans`: `id`, `book_id`, `member_id`, `out_day`, `due_day`
     - `waitlists`: `id`, `book_id`, `member_id`, `pos`
     - `logs`: `id`, `message`, `created_at`
     - `meta`: `off` (day offset), `nb`, `nm`, `bulkSeeded`
     - `undo_history`: Stores snapshots for undo (up to 25 states)
2. **Offline Fallback Mode**:
   - If the backend is unreachable or the HTML file is opened directly via `file://`, the frontend seamlessly falls back to browser `localStorage` without disruption.
   - Header badge indicates live status: `🟢 Server Connected` vs `💾 Local Storage (Offline)`.

---

## 🧠 Hand-Written Data Structures

| Structure | Class | Purpose | Time Complexity |
|---|---|---|---|
| **Hash Table** (Chaining, size 11, base-31 polynomial) | `HashTable` | Book lookup by ID (`get/set/delete/values`) | $O(1)$ average |
| **Binary Search Tree** (`title.toLowerCase() + "\|" + id`) | `BST` | Sorted book list (in-order), title prefix search, node deletion | $O(h)$ / $O(n)$ |
| **Merge Sort** | `msort(arr, keyFn)` | Stable sorting by author or publication year | $O(n \log n)$ |
| **Queue** (FIFO) | `Queue` | Waitlist per book for pending reservations | $O(1)$ enqueue/dequeue |
| **Singly Linked List** | `LinkedList` | Active loans issued to each student (max 3) | $O(k), k \le 3$ |
| **Min-Heap** (on `due`) | `MinHeap` | Earliest-due overdue loans extraction | $O(\log n)$ push/pop |
| **Stack** (LIFO, max 25) | `Stack` | Undo mechanism restoring full state snapshots | $O(1)$ push/pop |

---

## 🛠 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & uptime |
| `GET` | `/api/state` | Returns full library state snapshot |
| `POST` | `/api/state` | Saves/syncs full state atomically in SQLite |
| `GET` | `/api/books` | List books (supports `?q=...` & `?sort=title\|author\|year`) |
| `POST` | `/api/books` | Add new book (`{ title, author, year, copies }`) |
| `DELETE` | `/api/books/:id` | Delete book (blocked if copies issued or waitlist exists) |
| `GET` | `/api/members` | List students / members |
| `POST` | `/api/members` | Add student (`{ name }`) |
| `GET` | `/api/loans` | List active loans |
| `POST` | `/api/issue` | Issue book (`{ bookId, memberId }`) or enqueue waitlist |
| `POST` | `/api/return` | Return book (`{ bookId, memberId }`), compute fine, auto-issue |
| `POST` | `/api/date/advance` | Advance simulated time (`{ days: 7 }`) |
| `POST` | `/api/date/reset` | Reset simulated time offset to 0 |
| `POST` | `/api/undo/push` | Push undo state snapshot |
| `POST` | `/api/undo/pop` | Pop and retrieve last undo state snapshot |
| `POST` | `/api/reset` | Reset database to default seed data |
| `GET` | `/api/export` | Download full library state as JSON |
| `POST` | `/api/import` | Import JSON library state into database |

---

## 🐞 Bugs Detected and Fixed

1. **Bulk Seeding Duplicate Bug (Critical)**:
   - *Issue*: `hasBulkBooks` was checking for `'Library Collection 001'`, which was never in the generated dataset. Every page reload appended 600 duplicate books and 500 members, causing memory inflation and `localStorage` overflow.
   - *Fix*: Added proper checks for `S.bulkSeeded` and deduplication logic so bulk data is only generated once and existing duplicates are purged.

2. **Uncommitted Student Registration Bug**:
   - *Issue*: In `handleIssue`, when auto-registering a new student name, `S.members.push()` was called outside `commit()`. If the loan subsequently failed, the student remained unregistered in persistent storage and could not be undone with Undo.
   - *Fix*: Wrapped student creation in `commit()` so all changes are captured in snapshots and saved to the backend database.

3. **`removeBook` Undefined Object Crash**:
   - *Issue*: Calling `removeBook` on a non-existent ID caused `TypeError: Cannot read properties of undefined (reading 'avail')`.
   - *Fix*: Added validation check `if (!b) return say('Book not found: ' + id);`.

4. **`giveBack` Non-Existent Book Crash**:
   - *Issue*: Calling `giveBack` with an invalid book ID caused an unhandled crash when incrementing `b.avail`.
   - *Fix*: Added verification `if (!b) return say('Book not found: ' + bid);`.

5. **Input Validation Flaws**:
   - *Issue*: Empty string / whitespace titles, authors, and student names could be submitted.
   - *Fix*: Added strict input trimming and validation with informative error messages.

6. **Heap Display Bug in Live View**:
   - *Issue*: The Live View previously called JavaScript's built-in array `.sort()` to show earliest due loans instead of demonstrating the `MinHeap`.
   - *Fix*: Replaced with actual `MinHeap` extractions, visibly demonstrating heap property for viva evaluations.

7. **Database Foreign Key Deletion Order Bug**:
   - *Issue*: Calling `saveState()` when active loans or waitlists existed caused `FOREIGN KEY constraint failed` because parent tables (`books`, `members`) were deleted before child tables (`loans`, `waitlists`).
   - *Fix*: Re-ordered deletions so child tables are cleared first and inserted last, ensuring strict relational integrity.

8. **Alphanumeric ID Sorting Beyond B999**:
   - *Issue*: Standard alphabetical `ORDER BY id` sorted `B1000` before `B999`.
   - *Fix*: Used numeric substring casting `ORDER BY CAST(SUBSTR(id, 2) AS INTEGER) ASC` so IDs sort in true numerical sequence (`B001` through `B1000+`).

---

## 📋 Viva / Interview Reference

- **Why chaining in the Hash Table?** Avoids clustering found in open addressing (linear probing) and handles collisions gracefully with linked buckets.
- **Why polynomial rolling hash with base 31?** 31 is an odd prime ($2^5 - 1$), allowing multiplication to be computed as $(x \ll 5) - x$, dispersing English text characters evenly across buckets.
- **Worst-case BST height and solution?** Inserting sorted titles produces a degenerate tree (linked list) with $O(n)$ search. Balanced BSTs like AVL or Red-Black trees maintain $O(\log n)$ height by performing rotations.
- **Why a Queue for waitlists?** Guarantees First-In, First-Out (FIFO) fairness: the first student to reserve a book is the first to receive it upon return.
- **Why a Min-Heap for overdue loans?** Finding the next book due requires checking the minimum due date ($O(1)$ peek). Extracting overdue loans takes $O(\log n)$ per element rather than sorting all loans in $O(n \log n)$.

