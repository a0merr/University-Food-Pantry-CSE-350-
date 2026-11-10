import { api } from './api.js';
import { el, formatDateTime, showMessage, statusChip } from './ui.js';

const queueTarget = document.querySelector('#pickup-queue');
const queueMessage = document.querySelector('#queue-message');
const queueStatus = document.querySelector('#queue-status');
const slotForm = document.querySelector('#slot-form');
const slotList = document.querySelector('#slot-list');
const slotMessage = document.querySelector('#slot-message');
const alertList = document.querySelector('#alert-list');
const alertMessage = document.querySelector('#alert-message');

function itemSummary(items = []) {
  return items.map(item => `${item.quantity} x ${item.name}`).join(', ');
}

function table(headers, rows) {
  if (!rows.length) return el('p', { class: 'empty', text: 'Nothing to show.' });
  return el('table', {},
    el('thead', {}, el('tr', {}, headers.map(header => el('th', { text: header })))),
    el('tbody', {}, rows)
  );
}

async function loadQueue() {
  try {
    showMessage(queueMessage, '');
    const qs = queueStatus.value ? `?status=${encodeURIComponent(queueStatus.value)}` : '';
    const { pickups } = await api(`/api/staff/pickups${qs}`);
    const rows = pickups.map((pickup) => el('tr', {},
      el('td', { 'data-label': 'Time', text: pickup.starts_at ? formatDateTime(pickup.starts_at) : 'Unscheduled' }),
      el('td', { 'data-label': 'Student', text: `${pickup.student_name} (${pickup.student_email})` }),
      el('td', { 'data-label': 'Items', text: itemSummary(pickup.items) }),
      el('td', { 'data-label': 'Status' }, statusChip(pickup.status)),
      el('td', { 'data-label': 'Actions' },
        el('div', { class: 'actions' },
          pickup.status === 'scheduled'
            ? el('button', { type: 'button', onclick: () => updatePickup(pickup.id, 'prepare'), text: 'Prepare' })
            : null,
          pickup.status === 'prepared'
            ? el('button', { type: 'button', onclick: () => updatePickup(pickup.id, 'complete'), text: 'Complete' })
            : null
        )
      )
    ));
    queueTarget.replaceChildren(table(['Time', 'Student', 'Items', 'Status', 'Actions'], rows));
  } catch (err) {
    showMessage(queueMessage, err.message, 'error');
  }
}

async function updatePickup(id, action) {
  try {
    await api(`/api/staff/pickups/${id}/${action}`, { method: 'POST' });
    await loadQueue();
    showMessage(queueMessage, action === 'prepare' ? 'Pickup marked ready.' : 'Pickup completed.');
  } catch (err) {
    showMessage(queueMessage, err.message, 'error');
  }
}

async function loadSlots() {
  try {
    showMessage(slotMessage, '');
    const { slots } = await api('/api/staff/slots');
    const rows = slots.map(slot => el('tr', {},
      el('td', { 'data-label': 'Time', text: formatDateTime(slot.starts_at) }),
      el('td', { 'data-label': 'Capacity', text: `${slot.booked}/${slot.capacity}` }),
      el('td', { 'data-label': 'Open spots', text: slot.available }),
      el('td', { 'data-label': 'Actions' },
        el('button', {
          type: 'button',
          class: 'danger',
          onclick: () => deleteSlot(slot.id),
          text: 'Delete'
        })
      )
    ));
    slotList.replaceChildren(table(['Time', 'Capacity', 'Open spots', 'Actions'], rows));
  } catch (err) {
    showMessage(slotMessage, err.message, 'error');
  }
}

async function createSlot(event) {
  event.preventDefault();
  try {
    const form = new FormData(slotForm);
    await api('/api/staff/slots', {
      method: 'POST',
      body: {
        starts_at: form.get('starts_at'),
        capacity: Number(form.get('capacity'))
      }
    });
    slotForm.reset();
    await loadSlots();
    showMessage(slotMessage, 'Pickup slot added.');
  } catch (err) {
    showMessage(slotMessage, err.message, 'error');
  }
}

async function deleteSlot(id) {
  try {
    await api(`/api/staff/slots/${id}`, { method: 'DELETE' });
    await loadSlots();
    showMessage(slotMessage, 'Pickup slot deleted.');
  } catch (err) {
    showMessage(slotMessage, err.message, 'error');
  }
}

async function loadAlerts({ check = false } = {}) {
  try {
    showMessage(alertMessage, '');
    if (check) await api('/api/staff/alerts/check', { method: 'POST' });
    const { alerts } = await api('/api/staff/alerts');
    const rows = alerts.map(alert => el('tr', {},
      el('td', { 'data-label': 'Item', text: alert.item_name }),
      el('td', { 'data-label': 'Category', text: alert.category }),
      el('td', { 'data-label': 'Available', text: alert.available }),
      el('td', { 'data-label': 'Threshold', text: alert.threshold })
    ));
    alertList.replaceChildren(table(['Item', 'Category', 'Available', 'Threshold'], rows));
    if (check) showMessage(alertMessage, 'Low stock alerts refreshed.');
  } catch (err) {
    showMessage(alertMessage, err.message, 'error');
  }
}

document.querySelector('#refresh-queue').addEventListener('click', loadQueue);
queueStatus.addEventListener('change', loadQueue);
slotForm.addEventListener('submit', createSlot);
document.querySelector('#check-alerts').addEventListener('click', () => loadAlerts({ check: true }));

await Promise.all([loadQueue(), loadSlots(), loadAlerts()]);
