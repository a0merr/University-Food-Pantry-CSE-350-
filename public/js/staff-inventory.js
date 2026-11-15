// FR7: staff inventory screen. Add and edit items (quantity, low-stock threshold, per-visit
// limit, dietary tags), retire or restore an item, and log donations.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { api } from './api.js';
import { el, showMessage } from './ui.js';

const itemForm = document.querySelector('#item-form');
const formTitle = document.querySelector('#item-form-title');
const submitButton = document.querySelector('#item-submit');
const cancelEdit = document.querySelector('#item-cancel-edit');
const itemMessage = document.querySelector('#item-message');
const donationForm = document.querySelector('#donation-form');
const donationItem = document.querySelector('#donation-item');
const donationMessage = document.querySelector('#donation-message');
const itemList = document.querySelector('#item-list');
const field = (id) => document.querySelector(`#${id}`);

let editingId = null;

function inventoryChanged() {
  // Lets the low-stock alerts panel (staff-pickups.js) refresh.
  document.dispatchEvent(new Event('inventory-changed'));
}

function startEdit(item) {
  editingId = item.id;
  field('item-name').value = item.name;
  field('item-category').value = item.category;
  field('item-quantity').value = String(item.quantity);
  field('item-quantity').min = String(item.reserved);
  field('item-threshold').value = String(item.low_stock_threshold);
  field('item-limit').value = item.per_visit_limit ? String(item.per_visit_limit) : '';
  field('item-tags').value = item.dietary_tags ?? '';
  formTitle.textContent = `Edit ${item.name}`;
  submitButton.textContent = 'Save Changes';
  cancelEdit.hidden = false;
  showMessage(itemMessage, '');
  field('item-name').focus();
}

function resetForm() {
  editingId = null;
  itemForm.reset();
  field('item-quantity').min = '0';
  formTitle.textContent = 'Add an item';
  submitButton.textContent = 'Add Item';
  cancelEdit.hidden = true;
}

function itemRow(item) {
  const retired = item.active !== 1;
  return el('tr', { class: retired ? 'retired' : null },
    el('td', { 'data-label': 'Item', text: item.name }),
    el('td', { 'data-label': 'Category', text: item.category }),
    el('td', { 'data-label': 'Dietary tags', text: item.dietary_tags || '—' }),
    el('td', { 'data-label': 'On shelf', text: item.quantity }),
    el('td', { 'data-label': 'Reserved', text: item.reserved }),
    el('td', { 'data-label': 'Available', text: item.available }),
    el('td', { 'data-label': 'Threshold', text: item.low_stock_threshold }),
    el('td', { 'data-label': 'Limit', text: item.per_visit_limit ?? '—' }),
    el('td', { 'data-label': 'Status', text: retired ? 'Retired' : 'Active' }),
    el('td', { 'data-label': 'Actions' },
      el('div', { class: 'actions' },
        el('button', {
          type: 'button', class: 'secondary', text: 'Edit',
          'aria-label': `Edit ${item.name}`, onclick: () => startEdit(item)
        }),
        el('button', {
          type: 'button', class: retired ? 'secondary' : 'danger', text: retired ? 'Restore' : 'Retire',
          'aria-label': `${retired ? 'Restore' : 'Retire'} ${item.name}`, onclick: () => setActive(item, retired)
        })
      )
    )
  );
}

async function loadItems() {
  try {
    const { items } = await api('/api/items');
    const previous = donationItem.value;
    donationItem.replaceChildren(...items.map(item => el('option', {
      value: String(item.id),
      text: item.active === 1 ? item.name : `${item.name} (retired)`
    })));
    if (items.some(item => String(item.id) === previous)) donationItem.value = previous;

    if (!items.length) {
      itemList.replaceChildren(el('p', { class: 'empty', text: 'No items yet. Add the first one above.' }));
      return;
    }
    itemList.replaceChildren(el('table', {},
      el('thead', {}, el('tr', {}, ['Item', 'Category', 'Dietary tags', 'On shelf', 'Reserved', 'Available',
        'Threshold', 'Limit', 'Status', 'Actions'].map(label => el('th', { text: label })))),
      el('tbody', {}, items.map(itemRow))
    ));
  } catch (err) {
    showMessage(itemMessage, err.message, 'error');
  }
}

async function saveItem(event) {
  event.preventDefault();
  const limit = field('item-limit').value.trim();
  const body = {
    name: field('item-name').value,
    category: field('item-category').value,
    quantity: Number(field('item-quantity').value),
    low_stock_threshold: Number(field('item-threshold').value),
    per_visit_limit: limit === '' ? null : Number(limit),
    dietary_tags: field('item-tags').value
  };
  try {
    if (editingId) {
      await api(`/api/items/${editingId}`, { method: 'PATCH', body });
    } else {
      await api('/api/items', { method: 'POST', body });
    }
    const verb = editingId ? 'updated' : 'added';
    resetForm();
    await loadItems();
    showMessage(itemMessage, `Item ${verb}.`);
    inventoryChanged();
  } catch (err) {
    showMessage(itemMessage, err.message, 'error');
  }
}

async function setActive(item, active) {
  try {
    await api(`/api/items/${item.id}`, { method: 'PATCH', body: { active } });
    if (editingId === item.id) resetForm();
    await loadItems();
    showMessage(itemMessage, active
      ? `${item.name} restored. Students can request it again.`
      : `${item.name} retired. Students no longer see it.`);
    inventoryChanged();
  } catch (err) {
    showMessage(itemMessage, err.message, 'error');
  }
}

async function logDonation(event) {
  event.preventDefault();
  try {
    await api('/api/donations', {
      method: 'POST',
      body: {
        item_id: Number(donationItem.value),
        quantity: Number(field('donation-quantity').value),
        source: field('donation-source').value.trim()
      }
    });
    const itemId = donationItem.value;
    donationForm.reset();
    await loadItems();
    donationItem.value = itemId;
    showMessage(donationMessage, 'Donation logged. Stock updated.');
    inventoryChanged();
  } catch (err) {
    showMessage(donationMessage, err.message, 'error');
  }
}

itemForm.addEventListener('submit', saveItem);
cancelEdit.addEventListener('click', () => {
  resetForm();
  showMessage(itemMessage, '');
});
donationForm.addEventListener('submit', logDonation);

await loadItems();
