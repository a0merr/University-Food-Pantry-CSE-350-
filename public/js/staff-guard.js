// Staff page guard (Issue #19). Every tab in a browser shares one sign-in, so signing in as a
// student in another tab turns this page's session into a student session and every staff
// action fails. Check the account on load and whenever this tab comes back into view.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { el } from './ui.js';

const banner = el('div', { class: 'message error', role: 'alert', id: 'role-warning', hidden: true });
document.querySelector('main')?.prepend(banner);

async function checkRole() {
  let user = null;
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (res.ok) ({ user } = await res.json());
  } catch {
    return; // Network error: leave the page as it is.
  }

  if (!user) {
    window.location.assign('/');
    return;
  }

  if (user.role === 'staff') {
    banner.hidden = true;
    return;
  }

  banner.replaceChildren(
    `This browser is now signed in as ${user.name} (a ${user.role} account), so staff actions are blocked. `,
    el('a', { href: '/', text: 'Sign in as staff again' }),
    '.'
  );
  banner.hidden = false;
}

checkRole();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkRole();
});
window.addEventListener('focus', checkRole);
