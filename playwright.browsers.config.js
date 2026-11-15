// Cross-browser run (NFR4): the desktop specs in Firefox and in WebKit, the engine behind Safari.
// Run `npx playwright install firefox webkit` once, then `npm run test:e2e:browsers`.
// Each browser is a separate run with its own freshly seeded server (see package.json).
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  reporter: [['list']],
  projects: [
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: '**/mobile.spec.js' },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] }, testIgnore: '**/mobile.spec.js' }
  ]
});
