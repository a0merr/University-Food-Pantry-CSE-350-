import { api } from './api.js';
import { el, formatDateTime, showMessage } from './ui.js';
import { availableItems, categoriesFor, dietaryTagsFor, filterItems, tagsOf } from './student-filter.js';

const itemList = document.querySelector('#student-item-list');
const slotList = document.querySelector('#student-slot-list');
const requestForm = document.querySelector('#student-pickup-form');
const messageTarget = document.querySelector('#student-pickup-message');
const notificationList = document.querySelector('#student-notifications');
const searchInput = document.querySelector('#student-search');
const categorySelect = document.querySelector('#student-category');
const dietSelect = document.querySelector('#student-diet');
const resultCount = document.querySelector('#student-results-count');

let selectedSlotId = null;
let allItems = [];
const selectedItems = new Map();

// "gluten-free" -> "Gluten-free"
const tagLabel = (tag) => tag.charAt(0).toLocaleUpperCase() + tag.slice(1);

/** Most a student can ask for: what is available, capped by the item's per-visit limit (FR4). */
function maxFor(item) {
  const available = Math.max(0, Number(item.available));
  return item.per_visit_limit ? Math.min(available, Number(item.per_visit_limit)) : available;
}

function quantityControl(item) {
  const max = maxFor(item);
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
  const visible = filterItems(allItems, searchInput.value, categorySelect.value, dietSelect?.value ?? '');
  resultCount.textContent = `${visible.length} available item${visible.length === 1 ? '' : 's'} shown`;
  itemList.replaceChildren(...visible.map(item => el('article', { class: 'pickup-item' },
    el('div', {},
      el('h3', { text: item.name }),
      el('p', { text: `${item.category} | ${item.available} available` }),
      itemDetails(item)
    ), quantityControl(item)
  )));
  if (!visible.length) {
    itemList.replaceChildren(el('p', { class: 'empty', text: 'No matching pantry items available.' }));
  }
}

/** Dietary tags and the per-visit limit, when the item has them (FR3, FR4). */
function itemDetails(item) {
  const parts = tagsOf(item).map(tagLabel);
  if (item.per_visit_limit) parts.push(`Limit ${item.per_visit_limit} per visit`);
  return parts.length ? el('p', { class: 'item-tags', text: parts.join(' · ') }) : null;
}

function fillDietMenu(items) {
  if (!dietSelect) return;
  const previous = dietSelect.value;
  const tags = dietaryTagsFor(items);
  dietSelect.replaceChildren(el('option', { value: '', text: 'Any diet' }),
    ...tags.map(tag => el('option', { value: tag, text: tagLabel(tag) })));
  if (tags.includes(previous)) dietSelect.value = previous;
}

async function loadItems() {
  const { items } = await api('/api/items');
  allItems = items;
  const previousCategory = categorySelect.value;
  categorySelect.replaceChildren(el('option', { value: '', text: 'All categories' }),
    ...categoriesFor(items).map(category => el('option', { value: category, text: category })));
  if (categoriesFor(items).includes(previousCategory)) categorySelect.value = previousCategory;
  fillDietMenu(items);
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
    // Lets the "Your pickup" panel (student-mypickup.js) show the new booking.
    document.dispatchEvent(new Event('pickup-booked'));
  } catch (err) {
    showMessage(messageTarget, err.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
}

searchInput.addEventListener('input', renderItems);
categorySelect.addEventListener('change', renderItems);
dietSelect?.addEventListener('change', renderItems);
// A cancellation from the "Your pickup" panel returns stock and frees a pickup time.
document.addEventListener('pickup-cancelled', async () => {
  try {
    await Promise.all([loadItems(), loadSlots(), loadNotifications()]);
  } catch (err) {
    showMessage(messageTarget, err.message, 'error');
  }
});
requestForm.addEventListener('submit', submitPickup);
try {
  await Promise.all([loadItems(), loadSlots(), loadNotifications()]);
} catch (err) {
  showMessage(messageTarget, err.message, 'error');
}
