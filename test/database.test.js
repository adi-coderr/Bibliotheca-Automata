const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const { LibraryDatabase } = require('../database.js');

const TEST_DB = path.join(__dirname, 'test_library.db');

try {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

  console.log('--- Testing LibraryDatabase ---');
  const db = new LibraryDatabase(TEST_DB);

  // 1. Check initial seed
  const state = db.getState();
  assert.strictEqual(state.books.length, 6, 'Should have 6 seed books');
  assert.strictEqual(state.members.length, 3, 'Should have 3 seed members');
  assert.strictEqual(state.loans.length, 0, 'Should have 0 initial loans');
  assert.strictEqual(state.off, 0, 'Day offset should be 0');
  console.log('✓ Initial seed verified');

  // 2. Add book
  const newBook = db.addBook({ title: 'Test Book', author: 'Test Author', year: 2024, copies: 2 });
  assert.strictEqual(newBook.id, 'B007');
  assert.strictEqual(newBook.avail, 2);
  const stateAfterAdd = db.getState();
  assert.strictEqual(stateAfterAdd.books.length, 7);
  console.log('✓ addBook verified');

  // 3. Add member
  const newMem = db.addMember({ name: 'Test Student' });
  assert.strictEqual(newMem.id, 'M004');
  console.log('✓ addMember verified');

  // 4. Issue book
  const issue1 = db.issueBook('B007', 'M004');
  assert.strictEqual(issue1.status, 'issued');
  const b007 = db.getState().books.find(b => b.id === 'B007');
  assert.strictEqual(b007.avail, 1);
  console.log('✓ issueBook verified');

  // 5. Issue remaining copy
  const issue2 = db.issueBook('B007', 'M001');
  assert.strictEqual(issue2.status, 'issued');

  // 6. Waitlist when 0 copies available (Acceptance test 1)
  const waitIssue = db.issueBook('B007', 'M002');
  assert.strictEqual(waitIssue.status, 'waitlisted');
  assert.strictEqual(waitIssue.position, 1);
  const waits = db.getState().waits;
  assert.deepStrictEqual(waits['B007'], ['M002']);
  console.log('✓ waitlist on 0 copies verified (Acceptance test 1)');

  // 7. Cannot delete while copies issued or people waiting
  assert.throws(() => db.deleteBook('B007'), /Cannot delete/);
  console.log('✓ deleteBook prevention verified');

  // 8. Return book & auto-issue to waitlist (Acceptance test 2)
  const retRes = db.returnBook('B007', 'M004');
  assert.strictEqual(retRes.success, true);
  assert.strictEqual(retRes.autoIssuedTo.id, 'M002');
  const stateAfterRet = db.getState();
  // B007 should still have 0 avail because it was auto-issued to M002!
  const b007After = stateAfterRet.books.find(b => b.id === 'B007');
  assert.strictEqual(b007After.avail, 0);
  // Waitlist should now be empty
  assert.strictEqual((stateAfterRet.waits['B007'] || []).length, 0);
  console.log('✓ returnBook and auto-issue verified (Acceptance test 2)');

  // 9. Max 3 loans per member (Acceptance test 3)
  // M001 currently holds 1 book (B007). Let's issue B001 and B002 to M001.
  db.issueBook('B001', 'M001');
  db.issueBook('B002', 'M001');
  // M001 now has 3 books. 4th should throw error!
  assert.throws(() => db.issueBook('B003', 'M001'), /Limit reached/);
  console.log('✓ Max 3 books limit verified (Acceptance test 3)');

  // 10. Date advance & fine calculation (Acceptance test 4)
  db.advanceDate(21); // +7 days 3 times = 21 days
  const today = db.getToday();
  const retLate = db.returnBook('B001', 'M001');
  assert.strictEqual(retLate.daysLate, 7);
  assert.strictEqual(retLate.fine, 14); // 7 * Rs 2 = Rs 14
  console.log('✓ +21 days -> 7 days late, Rs 14 fine verified (Acceptance test 4)');

  // 11. Undo history
  db.pushUndo(JSON.stringify({ test: 'undo1' }));
  const popped = db.popUndo();
  assert.strictEqual(JSON.parse(popped).test, 'undo1');
  console.log('✓ Undo history push & pop verified');

  // 12. Reset all
  db.resetAll();
  const stateReset = db.getState();
  assert.strictEqual(stateReset.books.length, 6);
  assert.strictEqual(stateReset.loans.length, 0);
  console.log('✓ resetAll verified');

  console.log('\nALL DATABASE TESTS PASSED SUCCESSFULLY! ✅');
} finally {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
}

