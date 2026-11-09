// DOM helpers shared by the pages. Text is always set with textContent, never innerHTML,
// so data from the server cannot inject markup.
// AI-generated (Claude Code) - see docs/AI_USAGE.md

/** el('p', { class: 'x', text: 'hi' }, child1, child2) */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Shows a message in a live region so screen readers announce it (NFR2). */
export function showMessage(target, text, kind = 'ok') {
  const box = typeof target === 'string' ? document.querySelector(target) : target;
  box.replaceChildren();
  if (!text) return;
  box.append(el('div', { class: `message ${kind}`, role: kind === 'error' ? 'alert' : 'status' }, text));
}

const pad = (n) => String(n).padStart(2, '0');
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseLocal(iso) {
  const [date, time = '00:00'] = iso.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi);
}

export function formatDay(iso) {
  return parseLocal(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatTime(iso) {
  return parseLocal(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso) {
  return `${parseLocal(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${formatTime(iso)}`;
}

export const STATUS_LABELS = {
  submitted: 'Needs pickup time',
  scheduled: 'Scheduled',
  prepared: 'Ready for pickup',
  picked_up: 'Picked up',
  cancelled: 'Cancelled',
};

export function statusChip(status) {
  return el('span', { class: `chip ${status}`, text: STATUS_LABELS[status] ?? status });
}

/** Two-step confirm inside the page (no browser confirm() dialogs). */
export function confirmButton(button, { prompt, confirmLabel, onConfirm }) {
  const original = button.textContent;
  let armed = false;
  let timer;
  button.addEventListener('click', async () => {
    if (!armed) {
      armed = true;
      button.textContent = confirmLabel;
      button.setAttribute('aria-describedby', button.id + '-prompt');
      const hint = document.getElementById(button.id + '-prompt');
      if (hint) hint.textContent = prompt;
      timer = setTimeout(reset, 6000);
      return;
    }
    clearTimeout(timer);
    reset();
    await onConfirm();
  });
  function reset() {
    armed = false;
    button.textContent = original;
    const hint = document.getElementById(button.id + '-prompt');
    if (hint) hint.textContent = '';
  }
}
