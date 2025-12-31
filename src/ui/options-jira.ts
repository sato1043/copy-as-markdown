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

    const formTimelineOpenInNewWindow = document.forms.namedItem('form-jira-timeline-open-detail-in-new-window');
    if (formTimelineOpenInNewWindow) {
      const checkbox = formTimelineOpenInNewWindow.elements.namedItem('jiraTimelineOpenDetailInNewWindow') as HTMLInputElement | null;
      if (checkbox) checkbox.checked = settings.jiraTimelineOpenDetailInNewWindow;
    }

    const formHideCreateButton = document.forms.namedItem('form-jira-backlog-hide-create-button');
    if (formHideCreateButton) {
      const checkbox = formHideCreateButton.elements.namedItem('jiraBacklogHideCreateButton') as HTMLInputElement | null;
      if (checkbox) checkbox.checked = settings.jiraBacklogHideCreateButton;
    }

    const formHideEstimateField = document.forms.namedItem('form-jira-backlog-hide-estimate-field');
    if (formHideEstimateField) {
      const checkbox = formHideEstimateField.elements.namedItem('jiraBacklogHideEstimateField') as HTMLInputElement | null;
      if (checkbox) checkbox.checked = settings.jiraBacklogHideEstimateField;
    }

    const formHiddenTabs = document.forms.namedItem('form-jira-space-nav-hidden-tabs');
    if (formHiddenTabs) {
      const checkboxes = formHiddenTabs.querySelectorAll<HTMLInputElement>('input[name="hiddenTab"]');
      checkboxes.forEach((checkbox) => {
        checkbox.checked = settings.jiraSpaceNavHiddenTabs.includes(checkbox.value);
      });
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

const formTimelineOpenInNewWindow = document.forms.namedItem('form-jira-timeline-open-detail-in-new-window');
if (formTimelineOpenInNewWindow) {
  formTimelineOpenInNewWindow.addEventListener('change', async (event) => {
    try {
      const target = event.target as HTMLInputElement;
      await Settings.setJiraTimelineOpenDetailInNewWindow(target.checked);
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

const formHideEstimateField = document.forms.namedItem('form-jira-backlog-hide-estimate-field');
if (formHideEstimateField) {
  formHideEstimateField.addEventListener('change', async (event) => {
    try {
      const target = event.target as HTMLInputElement;
      await Settings.setJiraBacklogHideEstimateField(target.checked);
      hideFlash();
    } catch (error) {
      console.error('failed to save settings:', error);
      showFlash('Failed to save setting. Please try again.');
    }
  });
}

const formHiddenTabs = document.forms.namedItem('form-jira-space-nav-hidden-tabs');
if (formHiddenTabs) {
  formHiddenTabs.addEventListener('change', async () => {
    try {
      const checkboxes = formHiddenTabs.querySelectorAll<HTMLInputElement>('input[name="hiddenTab"]:checked');
      const hiddenTabs = Array.from(checkboxes).map(cb => cb.value);
      await Settings.setJiraSpaceNavHiddenTabs(hiddenTabs);
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
