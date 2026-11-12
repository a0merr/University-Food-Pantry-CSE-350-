// Sign-in page (FR1). Sends staff to the staff page and students to the student page.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { api } from './api.js';
import { showMessage } from './ui.js';

const form = document.querySelector('#signin-form');
const message = document.querySelector('#signin-message');

function homeFor(user) {
  return user.role === 'staff' ? '/staff.html' : '/student.html';
}

// Already signed in? Skip the form. Plain fetch, not api(): api() sends every
// 401 back to this page, which would reload it forever.
try {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (res.ok) {
    const { user } = await res.json();
    window.location.replace(homeFor(user));
  }
} catch {
  // Network error: stay on the sign-in form.
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(message, '');
  const data = new FormData(form);

  try {
    const { user } = await api('/api/auth/login', {
      method: 'POST',
      body: { email: data.get('email'), password: data.get('password') }
    });
    window.location.assign(homeFor(user));
  } catch (err) {
    showMessage(message, err.message, 'error');
  }
});
