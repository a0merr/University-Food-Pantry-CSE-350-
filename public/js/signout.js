// Sign-out link for any page: <a href="/" id="sign-out">Sign out</a>
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { api } from './api.js';

document.querySelector('#sign-out')?.addEventListener('click', async (event) => {
  event.preventDefault();
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } finally {
    window.location.assign('/');
  }
});
