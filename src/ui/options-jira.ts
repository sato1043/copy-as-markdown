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

    const formOpenInNewWindow = document.forms.namedItem('form-jira-backlog-open-detail-in-new-window');
    if (formOpenInNewWindow) {
      const checkbox = formOpenInNewWindow.elements.namedItem('jiraBacklogOpenDetailInNewWindow') as HTMLInputElement | null;
      if (checkbox) checkbox.checked = settings.jiraBacklogOpenDetailInNewWindow;
    }

    const formHideCreateButton = document.forms.namedItem('form-jira-backlog-hide-create-button');
    if (formHideCreateButton) {
      const checkbox = formHideCreateButton.elements.namedItem('jiraBacklogHideCreateButton') as HTMLInputElement | null;
      if (checkbox) checkbox.checked = settings.jiraBacklogHideCreateButton;
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

const formOpenInNewWindow = document.forms.namedItem('form-jira-backlog-open-detail-in-new-window');
if (formOpenInNewWindow) {
  formOpenInNewWindow.addEventListener('change', async (event) => {
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

const formHideCreateButton = document.forms.namedItem('form-jira-backlog-hide-create-button');
if (formHideCreateButton) {
  formHideCreateButton.addEventListener('change', async (event) => {
    try {
      const target = event.target as HTMLInputElement;
      await Settings.setJiraBacklogHideCreateButton(target.checked);
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
