/**
 * JIRA Backlog Content Script
 *
 * When enabled, clicking on a backlog issue card opens the issue in a new window
 * instead of the default behavior (opening in the same window/panel).
 */

console.log('[Copy as Markdown] JIRA backlog content script loaded');

// Backlog selectors
const CARD_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.interaction-layer.accessible-card"]';
const ISSUE_LINK_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.screen-reader-key"]';
const CREATE_BUTTON_SELECTOR = '[data-testid="software-backlog.card-list.inline-work-item-create.trigger-wrapper"]';
const ESTIMATE_FIELD_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.estimate-field-wrapper"]';
const EPIC_FIELD_ADD_BUTTON_SELECTOR = '[data-testid="issue-field-parent-switcher.ui.edit.suggested-parents-dropdown.add-parent-button"]';
const EPIC_FIELD_TRIGGER_BUTTON_SELECTOR = '[data-testid="issue-field-parent-switcher.ui.edit.suggested-parents-dropdown.trigger-button"]';

// Timeline selectors
const TIMELINE_ROW_SELECTOR = '[data-testid^="roadmap.timeline-table.components.list-item.container-"]';
const TIMELINE_LINK_SELECTOR = '[data-testid="roadmap.timeline-table-kit.ui.list-item-content.summary.key"]';

// Setting keys
const SETTING_KEY = 'jiraBacklogOpenDetailInNewWindow';
const TIMELINE_SETTING_KEY = 'jiraTimelineOpenDetailInNewWindow';
const HIDE_CREATE_SETTING_KEY = 'jiraBacklogHideCreateButton';
const HIDE_ESTIMATE_SETTING_KEY = 'jiraBacklogHideEstimateField';
const HIDE_EPIC_SETTING_KEY = 'jiraBacklogHideEpicField';
const HIDDEN_TABS_SETTING_KEY = 'jiraSpaceNavHiddenTabs';

// Fixed list of space navigation tabs (for reference)
// Path values used in settings and CSS selectors:
// summary, timeline, backlog, boards, calendar, list, form,
// development, code, archived-work-items, pages, goals, components, security, deployments, issues, shortcuts, addtabs

async function isOpenInNewWindowEnabled(): Promise<boolean> {
  console.log('[Copy as Markdown] Checking if backlog open in new window is enabled...');
  try {
    const result = await browser.storage.sync.get({ [SETTING_KEY]: false });
    console.log('[Copy as Markdown] Backlog open in new window setting value:', result[SETTING_KEY]);
    return result[SETTING_KEY] as boolean;
  } catch (error) {
    console.error('[Copy as Markdown] Failed to read backlog open in new window setting:', error);
    return false;
  }
}

async function isTimelineOpenInNewWindowEnabled(): Promise<boolean> {
  console.log('[Copy as Markdown] Checking if timeline open in new window is enabled...');
  try {
    const result = await browser.storage.sync.get({ [TIMELINE_SETTING_KEY]: false });
    console.log('[Copy as Markdown] Timeline open in new window setting value:', result[TIMELINE_SETTING_KEY]);
    return result[TIMELINE_SETTING_KEY] as boolean;
  } catch (error) {
    console.error('[Copy as Markdown] Failed to read timeline open in new window setting:', error);
    return false;
  }
}

async function isHideCreateButtonEnabled(): Promise<boolean> {
  console.log('[Copy as Markdown] Checking if hide create button is enabled...');
  try {
    const result = await browser.storage.sync.get({ [HIDE_CREATE_SETTING_KEY]: false });
    console.log('[Copy as Markdown] Hide create button setting value:', result[HIDE_CREATE_SETTING_KEY]);
    return result[HIDE_CREATE_SETTING_KEY] as boolean;
  } catch (error) {
    console.error('[Copy as Markdown] Failed to read hide create button setting:', error);
    return false;
  }
}

async function isHideEstimateFieldEnabled(): Promise<boolean> {
  console.log('[Copy as Markdown] Checking if hide estimate field is enabled...');
  try {
    const result = await browser.storage.sync.get({ [HIDE_ESTIMATE_SETTING_KEY]: false });
    console.log('[Copy as Markdown] Hide estimate field setting value:', result[HIDE_ESTIMATE_SETTING_KEY]);
    return result[HIDE_ESTIMATE_SETTING_KEY] as boolean;
  } catch (error) {
    console.error('[Copy as Markdown] Failed to read hide estimate field setting:', error);
    return false;
  }
}

async function isHideEpicFieldEnabled(): Promise<boolean> {
  console.log('[Copy as Markdown] Checking if hide epic field is enabled...');
  try {
    const result = await browser.storage.sync.get({ [HIDE_EPIC_SETTING_KEY]: false });
    console.log('[Copy as Markdown] Hide epic field setting value:', result[HIDE_EPIC_SETTING_KEY]);
    return result[HIDE_EPIC_SETTING_KEY] as boolean;
  } catch (error) {
    console.error('[Copy as Markdown] Failed to read hide epic field setting:', error);
    return false;
  }
}

async function getHiddenTabs(): Promise<string[]> {
  console.log('[Copy as Markdown] Getting hidden tabs...');
  try {
    const result = await browser.storage.sync.get({ [HIDDEN_TABS_SETTING_KEY]: [] });
    console.log('[Copy as Markdown] Hidden tabs:', result[HIDDEN_TABS_SETTING_KEY]);
    return result[HIDDEN_TABS_SETTING_KEY] as string[];
  } catch (error) {
    console.error('[Copy as Markdown] Failed to read hidden tabs setting:', error);
    return [];
  }
}

const HIDE_CREATE_BUTTON_STYLE_ID = 'copy-as-markdown-hide-create-button';

function injectHideCreateButtonStyle(): void {
  if (document.getElementById(HIDE_CREATE_BUTTON_STYLE_ID)) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = HIDE_CREATE_BUTTON_STYLE_ID;
  style.textContent = `${CREATE_BUTTON_SELECTOR} { display: none !important; }`;
  document.head.appendChild(style);
  console.log('[Copy as Markdown] Hide create button style injected');
}

function removeHideCreateButtonStyle(): void {
  const style = document.getElementById(HIDE_CREATE_BUTTON_STYLE_ID);
  if (style) {
    style.remove();
    console.log('[Copy as Markdown] Hide create button style removed');
  }
}

const HIDE_ESTIMATE_FIELD_STYLE_ID = 'copy-as-markdown-hide-estimate-field';

function injectHideEstimateFieldStyle(): void {
  if (document.getElementById(HIDE_ESTIMATE_FIELD_STYLE_ID)) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = HIDE_ESTIMATE_FIELD_STYLE_ID;
  style.textContent = `div:has(> ${ESTIMATE_FIELD_SELECTOR}) { display: none !important; }`;
  document.head.appendChild(style);
  console.log('[Copy as Markdown] Hide estimate field style injected');
}

function removeHideEstimateFieldStyle(): void {
  const style = document.getElementById(HIDE_ESTIMATE_FIELD_STYLE_ID);
  if (style) {
    style.remove();
    console.log('[Copy as Markdown] Hide estimate field style removed');
  }
}

const HIDE_EPIC_FIELD_STYLE_ID = 'copy-as-markdown-hide-epic-field';

function injectHideEpicFieldStyle(): void {
  if (document.getElementById(HIDE_EPIC_FIELD_STYLE_ID)) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = HIDE_EPIC_FIELD_STYLE_ID;
  // Hide the container div 4 levels up from the button (both add-parent-button and trigger-button)
  style.textContent = `
    div:has(> div > div > div > ${EPIC_FIELD_ADD_BUTTON_SELECTOR}) { display: none !important; }
    div:has(> div > div > div > ${EPIC_FIELD_TRIGGER_BUTTON_SELECTOR}) { display: none !important; }
  `;
  document.head.appendChild(style);
  console.log('[Copy as Markdown] Hide epic field style injected');
}

function removeHideEpicFieldStyle(): void {
  const style = document.getElementById(HIDE_EPIC_FIELD_STYLE_ID);
  if (style) {
    style.remove();
    console.log('[Copy as Markdown] Hide epic field style removed');
  }
}

const HIDE_TABS_STYLE_ID = 'copy-as-markdown-hide-space-nav-tabs';

function injectHideTabsStyle(hiddenTabs: string[]): void {
  // Remove existing style first
  removeHideTabsStyle();

  if (hiddenTabs.length === 0) {
    return;
  }

  const style = document.createElement('style');
  style.id = HIDE_TABS_STYLE_ID;

  // Generate CSS selectors for each hidden tab
  const cssRules = hiddenTabs.map((tabPath) => {
    // shortcuts and addtabs use button with data-testid instead of anchor with href
    if (tabPath === 'shortcuts') {
      return `nav[aria-label="スペース ナビゲーション"] li:has([data-testid="horizontal-nav-shortcuts-tab.dropdown-menu-trigger"]) { display: none !important; }`;
    }
    if (tabPath === 'addtabs') {
      return `nav[aria-label="スペース ナビゲーション"] [data-testid="navigation-kit-add-tab.ui.trigger"] { display: none !important; }`;
    }
    // boards URL is /boards/N, but backlog/timeline/calendar are /boards/N/xxx, so exclude them
    if (tabPath === 'boards') {
      return `nav[aria-label="スペース ナビゲーション"] li:has(a[href*="/boards/"]):not(:has(a[href$="/backlog"])):not(:has(a[href$="/timeline"])):not(:has(a[href$="/calendar"])) { display: none !important; }`;
    }
    return `nav[aria-label="スペース ナビゲーション"] li:has(a[href$="/${tabPath}"]) { display: none !important; }`;
  }).join('\n');

  style.textContent = cssRules;
  document.head.appendChild(style);
  console.log('[Copy as Markdown] Hide tabs style injected for:', hiddenTabs);
}

function removeHideTabsStyle(): void {
  const style = document.getElementById(HIDE_TABS_STYLE_ID);
  if (style) {
    style.remove();
    console.log('[Copy as Markdown] Hide tabs style removed');
  }
}

function findIssueUrl(card: Element): string | null {
  // Find the issue link within the same card container
  const container = card.closest('[data-testid*="software-backlog.card-list.card"]');
  if (!container) {
    return null;
  }

  const link = container.querySelector(ISSUE_LINK_SELECTOR) as HTMLAnchorElement | null;
  if (link?.href) {
    return link.href;
  }

  // Fallback: extract issue key from aria-label
  const ariaLabel = card.getAttribute('aria-label');
  if (ariaLabel) {
    // aria-label format: "SCRUM-1 JIRAのバックログの構造を調べる。..."
    const match = ariaLabel.match(/^([A-Z]+-\d+)/);
    if (match) {
      return `/browse/${match[1]}`;
    }
  }

  return null;
}

function findTimelineIssueUrl(row: Element): string | null {
  // Find the issue link within the timeline row
  const link = row.querySelector(TIMELINE_LINK_SELECTOR) as HTMLAnchorElement | null;
  if (link?.href) {
    return link.href;
  }
  return null;
}

function handleCardClick(event: MouseEvent): void {
  console.log('[Copy as Markdown] Click event captured');
  const target = event.target as Element;
  const card = target.closest(CARD_SELECTOR);

  if (!card) {
    console.log('[Copy as Markdown] No card found for target:', target.tagName, target.className);
    return;
  }

  console.log('[Copy as Markdown] Card found:', card.getAttribute('aria-label'));
  const issueUrl = findIssueUrl(card);
  if (!issueUrl) {
    console.log('[Copy as Markdown] No issue URL found');
    return;
  }

  console.log('[Copy as Markdown] Opening issue:', issueUrl);

  // Prevent default click behavior
  event.preventDefault();
  event.stopPropagation();

  // Open in new window/tab
  window.open(issueUrl, '_blank');
}

function handleTimelineRowClick(event: MouseEvent): void {
  console.log('[Copy as Markdown] Timeline click event captured');
  const target = event.target as Element;
  const row = target.closest(TIMELINE_ROW_SELECTOR);

  if (!row) {
    console.log('[Copy as Markdown] No timeline row found for target:', target.tagName, target.className);
    return;
  }

  console.log('[Copy as Markdown] Timeline row found:', row.getAttribute('data-testid'));
  const issueUrl = findTimelineIssueUrl(row);
  if (!issueUrl) {
    console.log('[Copy as Markdown] No issue URL found in timeline row');
    return;
  }

  console.log('[Copy as Markdown] Opening issue from timeline:', issueUrl);

  // Prevent default click behavior
  event.preventDefault();
  event.stopPropagation();

  // Open in new window/tab
  window.open(issueUrl, '_blank');
}

function attachClickListener(): void {
  // Use capture phase to intercept before JIRA's handlers
  document.addEventListener('click', handleCardClick, { capture: true });
  console.log('[Copy as Markdown] Backlog click listener attached');
}

function attachTimelineClickListener(): void {
  // Use capture phase to intercept before JIRA's handlers
  document.addEventListener('click', handleTimelineRowClick, { capture: true });
  console.log('[Copy as Markdown] Timeline click listener attached');
}

function observeDynamicContent(): void {
  // MutationObserver is not strictly needed since we use event delegation,
  // but we keep it for potential future enhancements
  const observer = new MutationObserver(() => {
    // Event delegation handles dynamic content automatically
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

async function init(): Promise<void> {
  console.log('[Copy as Markdown] init() called');

  // Handle backlog open in new window feature
  const openInNewWindowEnabled = await isOpenInNewWindowEnabled();
  if (openInNewWindowEnabled) {
    attachClickListener();
    observeDynamicContent();
    console.log('[Copy as Markdown] JIRA backlog open in new window enabled');
  } else {
    console.log('[Copy as Markdown] Backlog open in new window feature is disabled');
  }

  // Handle timeline open in new window feature
  const timelineOpenInNewWindowEnabled = await isTimelineOpenInNewWindowEnabled();
  if (timelineOpenInNewWindowEnabled) {
    attachTimelineClickListener();
    observeDynamicContent();
    console.log('[Copy as Markdown] JIRA timeline open in new window enabled');
  } else {
    console.log('[Copy as Markdown] Timeline open in new window feature is disabled');
  }

  // Handle hide create button feature
  const hideCreateButtonEnabled = await isHideCreateButtonEnabled();
  if (hideCreateButtonEnabled) {
    injectHideCreateButtonStyle();
  } else {
    removeHideCreateButtonStyle();
  }

  // Handle hide estimate field feature
  const hideEstimateFieldEnabled = await isHideEstimateFieldEnabled();
  if (hideEstimateFieldEnabled) {
    injectHideEstimateFieldStyle();
  } else {
    removeHideEstimateFieldStyle();
  }

  // Handle hide epic field feature
  const hideEpicFieldEnabled = await isHideEpicFieldEnabled();
  if (hideEpicFieldEnabled) {
    injectHideEpicFieldStyle();
  } else {
    removeHideEpicFieldStyle();
  }

  // Handle hide space navigation tabs feature
  const hiddenTabs = await getHiddenTabs();
  injectHideTabsStyle(hiddenTabs);
}

// Listen for settings changes
browser.storage.sync.onChanged.addListener((changes) => {
  if (SETTING_KEY in changes || TIMELINE_SETTING_KEY in changes) {
    // Reload page to apply new setting
    // (simpler than managing listener state)
    window.location.reload();
  }

  if (HIDE_CREATE_SETTING_KEY in changes) {
    const newValue = changes[HIDE_CREATE_SETTING_KEY].newValue as boolean;
    if (newValue) {
      injectHideCreateButtonStyle();
    } else {
      removeHideCreateButtonStyle();
    }
  }

  if (HIDE_ESTIMATE_SETTING_KEY in changes) {
    const newValue = changes[HIDE_ESTIMATE_SETTING_KEY].newValue as boolean;
    if (newValue) {
      injectHideEstimateFieldStyle();
    } else {
      removeHideEstimateFieldStyle();
    }
  }

  if (HIDE_EPIC_SETTING_KEY in changes) {
    const newValue = changes[HIDE_EPIC_SETTING_KEY].newValue as boolean;
    if (newValue) {
      injectHideEpicFieldStyle();
    } else {
      removeHideEpicFieldStyle();
    }
  }

  if (HIDDEN_TABS_SETTING_KEY in changes) {
    const newValue = changes[HIDDEN_TABS_SETTING_KEY].newValue as string[];
    injectHideTabsStyle(newValue);
  }
});

// Start
init();
