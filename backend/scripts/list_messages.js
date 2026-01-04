const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database', 'real_estate.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT id, name, phone, email, message, created_at FROM contact_messages ORDER BY created_at DESC', (err, rows) => {
  if (err) {
    console.error('Error querying contact_messages:', err.message);
    process.exit(1);
  }
  console.log('Contact messages:', rows.length);
  rows.forEach(r => console.log(r));
  db.close();
});
