# Smart Library Management System: Specification for an AI agent

Course: Data Structures (AKTU, 2nd year CSE). Deliverable: a static webpage (`index.html`, `style.css`, `app.js`), no backend, no libraries. Open `index.html` in a browser to run. Data persists in `localStorage` (key `slms-v1`).

## 1. Goal
A librarian manages books and members, issues and returns books, handles waitlists and fines. Every core feature must be driven by a hand-written data structure (no built-in Map/Set/sort for the core logic) so it can be explained in a viva.

## 2. Data structures and where each is used
| Structure | Class | Used for |
|---|---|---|
| Hash table, chaining, size 11, hash = polynomial base 31 | `HashTable` | Book lookup by ID (`get/set/delete/values`) |
| Binary search tree, key = `title.toLowerCase()+"|"+id` | `BST` | Sorted book list (in-order), title-prefix search, delete with in-order successor |
| Merge sort | `msort(arr, keyFn)` | Sorting by author or year |
| Queue (FIFO) | `Queue` | One waitlist per book |
| Stack (LIFO, max 25) | `Stack` | Undo: stores JSON snapshots of app state |
| Singly linked list | `LinkedList` | Books currently issued to each member (max 3) |
| Min-heap on `due` | `MinHeap` | Extract overdue loans earliest-first |

## 3. Data model
- Book: `{id:"B001", title, author, year, copies, avail}`
- Member: `{id:"M001", name}`
- Loan: `{b: bookId, m: memberId, out: dayNumber, due: dayNumber}`
- State `S`: `{off (simulated days), nb, nm (ID counters), books, members, loans, waits:{bookId:[memberIds]}, log[]}`
- Day number = `floor(Date.now()/86400000) + S.off`.

## 4. Business rules
Loan period 14 days. Max 3 books per member. Fine Rs 2 per late day. A member cannot hold the same book twice or join the same waitlist twice. A book cannot be deleted while copies are issued or people are waiting.

## 5. Features (functions)
1. `addBook(title, author, year, copies)`: new ID, insert into hash table and BST. Validate year 1000-2100, copies at least 1.
2. `removeBook(id)`: blocked by the rule above; else delete from hash table, BST, and queue map.
3. Search box: exact ID via hash table; title prefix via BST pruned traversal; author substring via scan. Results merged, deduplicated, shown in title order.
4. Sort dropdown: title (BST in-order), author and year (merge sort).
5. `addMember(name)`: new ID, empty linked list.
6. `issue(bookId, memberId)`: if a copy is free, `avail--` and append a loan to the member's linked list with due = today + 14; if none is free, enqueue the member on the book's waitlist and report the position.
7. `giveBack(bookId, memberId)`: remove the loan from the linked list, `avail++`, compute fine, then dequeue waitlist members until one is eligible and auto-issue the book to them.
8. Overdue view: push all loans into the min-heap, pop while `due < today`, show days late and fine, plus a total.
9. `undo()`: pop the stack, restore the snapshot, rebuild all structures. Every change goes through `commit(fn)` which pushes a snapshot first.
10. Date simulator: "+7 days" and "Reset date" buttons so overdue and fines can be demonstrated.
11. Dashboard counters: titles, free copies, on loan, overdue, members.
12. "Data structures" tab: live view of hash buckets, sideways BST, queues, undo stack size, earliest due dates, plus a complexity table.

## 6. UI
Header (title, library date, date buttons, Undo) / tabs: Books, Issue & Return, Members, Overdue, Data structures. Toast line for every result or error, written as plain instructions. Responsive, keyboard focusable, all user text HTML-escaped.

## 7. Acceptance tests
1. Add a book with 1 copy; issue it to M001, then to M002: M002 appears in the waitlist at position 1.
2. Return it from M001: it is auto-issued to M002.
3. Issue 3 books to one member; the 4th is refused.
4. Issue a book, click "+7 days" three times, open Overdue: 7 days late, Rs 14 fine.
5. Undo restores the previous state after any of the above. Reload keeps the data.

## 8. Viva questions to prepare
Why chaining in the hash table? Worst-case height of your BST and how to fix it (AVL/Red-Black)? Why a queue for waitlists and a stack for undo? Why is heap pop O(log n)? Why is merge sort stable and O(n log n)?
