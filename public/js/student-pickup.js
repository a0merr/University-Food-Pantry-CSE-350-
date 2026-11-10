import { api } from './api.js';
import { el, formatDateTime, showMessage } from './ui.js';

const itemList = document.querySelector('#student-item-list');
const slotList = document.querySelector('#student-slot-list');
const requestForm = document.querySelector('#student-pickup-form');
const messageTarget = document.querySelector('#student-pickup-message');
const notificationList = document.querySelector('#student-notifications');

let selectedSlotId = null;
const selectedItems = new Map();

function quantityControl(item) {
  const max = Math.max(0, item.available);
  const input = el('input', {
    type: 'number',
    min: '0',
    max: String(max),
    value: String(selectedItems.get(item.id) ?? 0),
    'aria-label': `${item.name} quantity`
  });

  input.addEventListener('change', () => {
    const value = Number(input.value);
    if (Number.isInteger(value) && value > 0) selectedItems.set(item.id, value);
    else selectedItems.delete(item.id);
  });

  return input;
}

async function loadItems() {
  const { items } = await api('/api/items');
  const availableItems = items.filter(item => item.active === 1 && item.available > 0);

  itemList.replaceChildren(...availableItems.map(item => el('article', { class: 'pickup-item' },
    el('div', {},
      el('h3', { text: item.name }),
      el('p', { text: `${item.category} | ${item.available} available` })
    ),
    quantityControl(item)
  )));

  if (!availableItems.length) {
    itemList.replaceChildren(el('p', { class: 'empty', text: 'No pantry items are available right now.' }));
  }
}

async function loadSlots() {
  const { slots } = await api('/api/pickup-slots');
  const openSlots = slots.filter(slot => slot.available > 0);

  slotList.replaceChildren(...openSlots.map(slot => {
    const option = el('button', {
      type: 'button',
      class: selectedSlotId === slot.id ? 'slot selected' : 'slot',
      text: `${formatDateTime(slot.starts_at)} (${slot.available} open)`
    });
    option.addEventListener('click', () => {
      selectedSlotId = slot.id;
      loadSlots();
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
      type: 'button',
      class: 'secondary',
      onclick: async () => {
        await api(`/api/notifications/${notification.id}/read`, { method: 'PATCH' });
        await loadNotifications();
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

  if (!selectedSlotId) {
    showMessage(messageTarget, 'Choose a pickup time.', 'error');
    return;
  }

  if (!items.length) {
    showMessage(messageTarget, 'Choose at least one item.', 'error');
    return;
  }

  try {
    await api('/api/pickups', {
      method: 'POST',
      body: { slot_id: selectedSlotId, items }
    });
    selectedItems.clear();
    selectedSlotId = null;
    await Promise.all([loadItems(), loadSlots(), loadNotifications()]);
    showMessage(messageTarget, 'Pickup scheduled.');
  } catch (err) {
    showMessage(messageTarget, err.message, 'error');
  }
}

requestForm.addEventListener('submit', submitPickup);

try {
  await Promise.all([loadItems(), loadSlots(), loadNotifications()]);
} catch (err) {
  showMessage(messageTarget, err.message, 'error');
}
