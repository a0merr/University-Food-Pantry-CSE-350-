import { mkdirSync, rmSync } from 'node:fs';
import { openDatabase } from '../src/db.js';
import { hashPassword } from '../src/auth/passwords.js';

// Same time zone as server.js, so seeded pickup days match the pantry's calendar.
process.env.TZ ??= 'America/New_York';

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

// [name, category, quantity, low-stock threshold, dietary tags, per-visit limit]
const items = [
  ['Rice', 'Grains', 30, 5, 'vegan, vegetarian, gluten-free', null],
  ['Pasta', 'Grains', 25, 5, 'vegan, vegetarian', null],
  ['Canned Beans', 'Canned Goods', 20, 5, 'vegan, vegetarian, gluten-free', null],
  ['Peanut Butter', 'Protein', 12, 5, 'vegan, vegetarian, gluten-free', 2],
  ['Cereal', 'Breakfast', 18, 5, 'vegetarian', null],
  ['Oatmeal', 'Breakfast', 15, 5, 'vegan, vegetarian', null],
  ['Canned Soup', 'Canned Goods', 4, 5, '', null],
  ['Mac and Cheese', 'Meals', 20, 5, 'vegetarian', null],
  ['Granola Bars', 'Snacks', 3, 5, 'vegetarian', null],
  ['Bottled Water', 'Drinks', 40, 10, 'vegan, vegetarian, gluten-free', 6]
];

const insertItem = db.prepare(`
  INSERT INTO items
  (name, category, quantity, low_stock_threshold, dietary_tags, per_visit_limit, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const [name, category, quantity, threshold, tags, limit] of items) {
  const exists = db.prepare(
    'SELECT id FROM items WHERE name = ?'
  ).get(name);

  if (!exists) {
    insertItem.run(name, category, quantity, threshold, tags, limit, now, now);
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
