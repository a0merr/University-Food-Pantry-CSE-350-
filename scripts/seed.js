import { mkdirSync, rmSync } from 'node:fs';
import { openDatabase } from '../src/db.js';
import { hashPassword } from '../src/auth/passwords.js';

const reset = process.argv.includes('--reset');

mkdirSync('data', { recursive: true });

if (reset) {
  for (const suffix of ['', '-wal', '-shm']) {
    rmSync(`data/pantry.db${suffix}`, { force: true });
  }
}

const db = openDatabase('data/pantry.db');
const now = new Date().toISOString();

const accounts = [
  ['Pantry Staff', 'staff@pantry.demo', 'staff', 'StaffDemo123!'],
  ['Student One', 'student1@pantry.demo', 'student', 'StudentDemo123!'],
  ['Student Two', 'student2@pantry.demo', 'student', 'StudentDemo123!'],
  ['Student Three', 'student3@pantry.demo', 'student', 'StudentDemo123!']
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users
  (name, email, password_hash, role, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

for (const [name, email, role, password] of accounts) {
  insertUser.run(name, email, hashPassword(password), role, now);
}

const items = [
  ['Rice', 'Grains', 30, 5],
  ['Pasta', 'Grains', 25, 5],
  ['Canned Beans', 'Canned Goods', 20, 5],
  ['Peanut Butter', 'Protein', 12, 5],
  ['Cereal', 'Breakfast', 18, 5],
  ['Oatmeal', 'Breakfast', 15, 5],
  ['Canned Soup', 'Canned Goods', 4, 5],
  ['Mac and Cheese', 'Meals', 20, 5],
  ['Granola Bars', 'Snacks', 3, 5],
  ['Bottled Water', 'Drinks', 40, 10]
];

const insertItem = db.prepare(`
  INSERT INTO items
  (name, category, quantity, low_stock_threshold, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const [name, category, quantity, threshold] of items) {
  const exists = db.prepare(
    'SELECT id FROM items WHERE name = ?'
  ).get(name);

  if (!exists) {
    insertItem.run(name, category, quantity, threshold, now, now);
  }
}

const insertSlot = db.prepare(`
  INSERT OR IGNORE INTO pickup_slots (starts_at, capacity)
  VALUES (?, ?)
`);

for (let day = 1; day <= 5; day++) {
  const date = new Date();
  date.setDate(date.getDate() + day);
  date.setHours(14, 0, 0, 0);

  const localDate =
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, '0')}-` +
    `${String(date.getDate()).padStart(2, '0')}T14:00:00`;

  insertSlot.run(localDate, 10);
}

db.close();

console.log('\nDemo accounts created:');
for (const [name, email, role, password] of accounts) {
  console.log(`${role}: ${email} / ${password}`);
}
console.log('\nSeed completed successfully.');
