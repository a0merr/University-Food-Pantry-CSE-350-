import { api } from './api.js';
import { el, showMessage, STATUS_LABELS } from './ui.js';

const form = document.querySelector('#reports-form');
const message = document.querySelector('#reports-message');
const summary = document.querySelector('#reports-summary');
const statuses = document.querySelector('#reports-statuses');
const topItems = document.querySelector('#reports-top-items');
const categories = document.querySelector('#reports-categories');

function metric(label, value) {
  return el('div', { class: 'metric' },
    el('span', { text: label }),
    el('strong', { text: value })
  );
}

function rows(items, columns) {
  if (!items.length) return el('p', { class: 'empty', text: 'No report data for this range.' });
  return el('table', {},
    el('thead', {}, el('tr', {}, columns.map(column => el('th', { text: column.label })))),
    el('tbody', {}, items.map(item => el('tr', {},
      columns.map(column => el('td', {
        'data-label': column.label,
        text: column.value(item)
      }))
    )))
  );
}

async function loadReport(event) {
  if (event) event.preventDefault();

  try {
    showMessage(message, '');
    const params = new URLSearchParams(new FormData(form));
    const { report } = await api(`/api/staff/reports?${params.toString()}`);
    const inventory = report.inventory.summary;

    summary.replaceChildren(
      metric('Active items', inventory.active_items),
      metric('Available units', inventory.total_available),
      metric('Reserved units', inventory.total_reserved),
      metric('Low stock items', inventory.low_stock_items)
    );
    statuses.replaceChildren(rows(report.pickups.status_counts, [
      { label: 'Status', value: row => STATUS_LABELS[row.status] ?? row.status },
      { label: 'Pickups', value: row => row.count }
    ]));
    topItems.replaceChildren(rows(report.pickups.top_items, [
      { label: 'Item', value: row => row.name },
      { label: 'Quantity', value: row => row.quantity }
    ]));
    categories.replaceChildren(rows(report.inventory.categories, [
      { label: 'Category', value: row => row.category },
      { label: 'Items', value: row => row.item_count },
      { label: 'Available', value: row => row.available }
    ]));
  } catch (err) {
    showMessage(message, err.message, 'error');
  }
}

form.addEventListener('submit', loadReport);
await loadReport();
