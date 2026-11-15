// FR6: the student's own open pickup, with a Cancel button that returns the items to the pantry.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { api } from './api.js';
import { confirmButton, el, formatDateTime, showMessage, statusChip } from './ui.js';

const list = document.querySelector('#my-pickup-list');
const message = document.querySelector('#my-pickup-message');

function itemSummary(items = []) {
  return items.map(item => `${item.quantity} x ${item.name}`).join(', ');
}

function pickupCard(pickup) {
  const id = `cancel-pickup-${pickup.id}`;
  const button = el('button', { type: 'button', class: 'secondary', id, text: 'Cancel pickup' });
  // Two clicks, so a stray tap does not cancel the order.
  confirmButton(button, {
    prompt: 'Press "Confirm cancel" to cancel this pickup and return the items to the pantry.',
    confirmLabel: 'Confirm cancel',
    onConfirm: () => cancelPickup(pickup.id)
  });
  return el('article', { class: 'my-pickup' },
    el('div', {},
      el('h3', { text: pickup.starts_at ? formatDateTime(pickup.starts_at) : 'No pickup time yet' }),
      el('p', { text: itemSummary(pickup.items) }),
      statusChip(pickup.status)
    ),
    el('div', { class: 'actions' },
      button,
      el('p', { id: `${id}-prompt`, class: 'hint', 'aria-live': 'polite' })
    )
  );
}

async function loadMyPickups() {
  const { pickups } = await api('/api/pickups');
  list.replaceChildren(...pickups.map(pickupCard));
  if (!pickups.length) {
    list.replaceChildren(el('p', { class: 'empty', text: 'You have no pickup booked.' }));
  }
}

async function cancelPickup(id) {
  try {
    await api(`/api/pickups/${id}/cancel`, { method: 'POST' });
    await loadMyPickups();
    showMessage(message, 'Pickup cancelled. The items were returned to the pantry.');
    // Lets the booking form (student-pickup.js) refresh stock, times and notifications.
    document.dispatchEvent(new Event('pickup-cancelled'));
  } catch (err) {
    showMessage(message, err.message, 'error');
  }
}

document.addEventListener('pickup-booked', async () => {
  showMessage(message, '');
  try {
    await loadMyPickups();
  } catch (err) {
    showMessage(message, err.message, 'error');
  }
});

try {
  await loadMyPickups();
} catch (err) {
  showMessage(message, err.message, 'error');
}
