const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { createServer } = require('../server.js');

const TEST_DB = path.join(__dirname, 'test_api_library.db');

async function runTests() {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

  const { app, db } = createServer(TEST_DB);
  const server = http.createServer(app);

  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  console.log(`--- Running API integration tests on ${baseUrl} ---`);

  try {
    // 1. Health check
    const rHealth = await fetch(`${baseUrl}/api/health`);
    const dHealth = await rHealth.json();
    assert.strictEqual(rHealth.status, 200);
    assert.strictEqual(dHealth.status, 'ok');
    console.log('✓ GET /api/health passed');

    // 2. GET /api/state
    const rState = await fetch(`${baseUrl}/api/state`);
    const dState = await rState.json();
    assert.strictEqual(rState.status, 200);
    assert.strictEqual(dState.books.length, 6);
    assert.strictEqual(dState.members.length, 3);
    console.log('✓ GET /api/state passed');

    // 3. POST /api/books
    const rAddBook = await fetch(`${baseUrl}/api/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Clean Architecture', author: 'Robert C. Martin', year: 2017, copies: 3 })
    });
    const dAddBook = await rAddBook.json();
    assert.strictEqual(rAddBook.status, 201);
    assert.strictEqual(dAddBook.id, 'B007');
    assert.strictEqual(dAddBook.avail, 3);
    console.log('✓ POST /api/books passed');

    // 4. GET /api/books with query search
    const rSearch = await fetch(`${baseUrl}/api/books?q=architecture`);
    const dSearch = await rSearch.json();
    assert.strictEqual(dSearch.length, 1);
    assert.strictEqual(dSearch[0].id, 'B007');
    console.log('✓ GET /api/books?q=... passed');

    // 5. POST /api/members
    const rAddMem = await fetch(`${baseUrl}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sneha Patel' })
    });
    const dAddMem = await rAddMem.json();
    assert.strictEqual(rAddMem.status, 201);
    assert.strictEqual(dAddMem.id, 'M004');
    console.log('✓ POST /api/members passed');

    // 6. POST /api/issue
    const rIssue = await fetch(`${baseUrl}/api/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: 'B007', memberId: 'M004' })
    });
    const dIssue = await rIssue.json();
    assert.strictEqual(rIssue.status, 200);
    assert.strictEqual(dIssue.status, 'issued');
    console.log('✓ POST /api/issue passed');

    // 7. Duplicate issue check
    const rDup = await fetch(`${baseUrl}/api/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: 'B007', memberId: 'M004' })
    });
    assert.strictEqual(rDup.status, 400);
    console.log('✓ Duplicate loan prevention passed');

    // 8. POST /api/date/advance
    const rDate = await fetch(`${baseUrl}/api/date/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 21 })
    });
    const dDate = await rDate.json();
    assert.strictEqual(dDate.off, 21);
    console.log('✓ POST /api/date/advance passed');

    // 9. POST /api/return (with overdue fine)
    const rReturn = await fetch(`${baseUrl}/api/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: 'B007', memberId: 'M004' })
    });
    const dReturn = await rReturn.json();
    assert.strictEqual(rReturn.status, 200);
    assert.strictEqual(dReturn.daysLate, 7);
    assert.strictEqual(dReturn.fine, 14);
    console.log('✓ POST /api/return with fine calculation passed');

    // 10. POST /api/state (save full state)
    const curState = await (await fetch(`${baseUrl}/api/state`)).json();
    curState.off = 0;
    const rSaveState = await fetch(`${baseUrl}/api/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(curState)
    });
    assert.strictEqual(rSaveState.status, 200);
    const updatedState = await (await fetch(`${baseUrl}/api/state`)).json();
    assert.strictEqual(updatedState.off, 0);
    console.log('✓ POST /api/state passed');

    // 11. Static files serving
    const rIndex = await fetch(`${baseUrl}/index.html`);
    assert.strictEqual(rIndex.status, 200);
    const indexHtml = await rIndex.text();
    assert.ok(indexHtml.includes('Smart Library'), 'Should serve index.html');
    console.log('✓ Static file serving passed');

    console.log('\nALL API INTEGRATION TESTS PASSED! ✅');
  } finally {
    server.close();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

