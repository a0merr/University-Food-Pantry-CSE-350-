import test from 'node:test';
import assert from 'node:assert/strict';
import { availableItems, categoriesFor, filterItems } from '../../public/js/student-filter.js';

const items = [
  { id: 1, name: 'Brown Rice', category: 'Grains', active: 1, available: 8 },
  { id: 2, name: 'Canned Beans', category: 'Canned', active: 1, available: 4 },
  { id: 3, name: 'White Rice', category: 'Grains', active: 1, available: 0 },
  { id: 4, name: 'Milk', category: 'Dairy', active: 0, available: 5 }
];

test('FR2 lists only active items with stock', () => {
  assert.deepEqual(availableItems(items).map(item => item.id), [1, 2]);
});
test('FR3 search is case-insensitive and ignores whitespace', () => {
  assert.deepEqual(filterItems(items, '  RICE ').map(item => item.id), [1]);
});
test('FR3 filters by category', () => {
  assert.deepEqual(filterItems(items, '', 'canned').map(item => item.id), [2]);
});
test('FR3 combines search and category', () => {
  assert.deepEqual(filterItems(items, 'rice', 'Canned'), []);
});
test('FR3 offers sorted categories for available items', () => {
  assert.deepEqual(categoriesFor(items), ['Canned', 'Grains']);
});
test('FR3 matches category text in search', () => {
  assert.deepEqual(filterItems(items, 'grains').map(item => item.id), [1]);
});
