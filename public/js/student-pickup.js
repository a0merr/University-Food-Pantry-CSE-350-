import { api } from './api.js';
import { el, formatDateTime, showMessage } from './ui.js';
import { availableItems, categoriesFor, filterItems } from './student-filter.js';

const itemList = document.querySelector('#student-item-list');
const slotList = document.querySelector('#student-slot-list');
const requestForm = document.querySelector('#student-pickup-form');
const messageTarget = document.querySelector('#student-pickup-message');
const notificationList = document.querySelector('#student-notifications');
const searchInput = document.querySelector('#student-search');
const categorySelect = document.querySelector('#student-category');
const resultCount = document.querySelector('#student-results-count');

let selectedSlotId = null;
let allItems = [];
const selectedItems = new Map();

function quantityControl(item) {
  const max = Math.max(0, Number(item.available));
  const input = el('input', {
    type: 'number', min: '0', max: String(max), step: '1',
    value: String(selectedItems.get(item.id) ?? 0),
    'aria-label': `${item.name} quantity`
  });
  input.addEventListener('change', () => {
    const value = Number(input.value);
    if (Number.isSafeInteger(value) && value > 0 && value <= max) {
      selectedItems.set(item.id, value);
    } else {
      selectedItems.delete(item.id);
      input.value = '0';
    }
  });
  return input;
}

function renderItems() {
  const visible = filterItems(allItems, searchInput.value, categorySelect.value);
  resultCount.textContent = `${visible.length} available item${visible.length === 1 ? '' : 's'} shown`;
  itemList.replaceChildren(...visible.map(item => el('article', { class: 'pickup-item' },
    el('div', {},
      el('h3', { text: item.name }),
      el('p', { text: `${item.category} | ${item.available} available` })
    ), quantityControl(item)
  )));
  if (!visible.length) {
    itemList.replaceChildren(el('p', { class: 'empty', text: 'No matching pantry items available.' }));
  }
}

async function loadItems() {
  const { items } = await api('/api/items');
  allItems = items;
  const previousCategory = categorySelect.value;
  categorySelect.replaceChildren(el('option', { value: '', text: 'All categories' }),
    ...categoriesFor(items).map(category => el('option', { value: category, text: category })));
  if (categoriesFor(items).includes(previousCategory)) categorySelect.value = previousCategory;
  const availableIds = new Set(availableItems(items).map(item => item.id));
  for (const id of selectedItems.keys()) if (!availableIds.has(id)) selectedItems.delete(id);
  renderItems();
}

async function loadSlots() {
  const { slots } = await api('/api/pickup-slots');
  const openSlots = slots.filter(slot => slot.available > 0);
  slotList.replaceChildren(...openSlots.map(slot => {
    const option = el('button', {
      type: 'button',
      class: selectedSlotId === slot.id ? 'slot selected' : 'slot',
      'aria-pressed': String(selectedSlotId === slot.id),
      text: `${formatDateTime(slot.starts_at)} (${slot.available} open)`
    });
    option.addEventListener('click', () => {
      selectedSlotId = slot.id;
      for (const button of slotList.querySelectorAll('button.slot')) {
        const chosen = button === option;
        button.classList.toggle('selected', chosen);
        button.setAttribute('aria-pressed', String(chosen));
      }
    });
    return option;
  }));
  if (!openSlots.length) {
    slotList.replaceChildren(el('p', { class: 'empty', text: 'No pickup slots are open right now.' }));
  }
}

async function loadNotifications() {
  if (!notificationList) return;
  const { notifications } = await api('/api/notifications?unread=true');
  notificationList.replaceChildren(...notifications.map(notification => el('li', {},
    el('span', { text: notification.message }),
    el('button', {
      type: 'button', class: 'secondary',
      onclick: async () => {
        try {
          await api(`/api/notifications/${notification.id}/read`, { method: 'PATCH' });
          await loadNotifications();
        } catch (err) { showMessage(messageTarget, err.message, 'error'); }
      },
      text: 'Mark read'
    })
  )));
  if (!notifications.length) {
    notificationList.replaceChildren(el('li', { class: 'empty', text: 'No unread notifications.' }));
  }
}

async function submitPickup(event) {
  event.preventDefault();
  showMessage(messageTarget, '');
  const items = [...selectedItems.entries()].map(([item_id, quantity]) => ({ item_id, quantity }));
  if (!selectedSlotId) return showMessage(messageTarget, 'Choose a pickup time.', 'error');
  if (!items.length) return showMessage(messageTarget, 'Choose at least one item.', 'error');
  const submitButton = requestForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    await api('/api/pickups', { method: 'POST', body: { slot_id: selectedSlotId, items } });
    selectedItems.clear();
    selectedSlotId = null;
    showMessage(messageTarget, 'Pickup scheduled. Check your notifications for confirmation.');
    await Promise.all([loadItems(), loadSlots(), loadNotifications()]);
  } catch (err) {
    showMessage(messageTarget, err.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
}

searchInput.addEventListener('input', renderItems);
categorySelect.addEventListener('change', renderItems);
requestForm.addEventListener('submit', submitPickup);
try {
  await Promise.all([loadItems(), loadSlots(), loadNotifications()]);
} catch (err) {
  showMessage(messageTarget, err.message, 'error');
}
