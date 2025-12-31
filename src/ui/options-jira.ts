import Settings from '../lib/settings.js';

function showFlash(message: string): void {
  const flash = document.getElementById('flash-error');
  if (!flash) return;
  flash.classList.remove('is-hidden');
  const p = flash.querySelector('p');
  if (p) p.textContent = message;
}

function hideFlash(): void {
  const flash = document.getElementById('flash-error');
  if (!flash) return;
  flash.classList.add('is-hidden');
  const p = flash.querySelector('p');
  if (p) p.textContent = '';
}

async function loadSettings(): Promise<void> {
  try {
    const settings = await Settings.getAll();
    const form = document.forms.namedItem('form-jira-backlog-open-detail-in-new-window');

    if (form) {
      const checkbox = form.elements.namedItem('jiraBacklogOpenDetailInNewWindow') as HTMLInputElement | null;
      if (checkbox) checkbox.checked = settings.jiraBacklogOpenDetailInNewWindow;
    }
    hideFlash();
  } catch (error) {
    console.error('error getting settings', error);
    showFlash('Failed to load settings. Please try again.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
});

const form = document.forms.namedItem('form-jira-backlog-open-detail-in-new-window');
if (form) {
  form.addEventListener('change', async (event) => {
    try {
      const target = event.target as HTMLInputElement;
      await Settings.setJiraBacklogOpenDetailInNewWindow(target.checked);
      hideFlash();
    } catch (error) {
      console.error('failed to save settings:', error);
      showFlash('Failed to save setting. Please try again.');
    }
  });
}

browser.storage.sync.onChanged.addListener(async (changes) => {
  const hasSettingsChanged = Object.keys(changes).some(key => Settings.keys.includes(key));

  if (hasSettingsChanged) {
    await loadSettings();
  }
});
