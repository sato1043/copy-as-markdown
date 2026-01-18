/**
 * JIRA Backlog Content Script
 *
 * Provides customization features for JIRA backlog and timeline pages:
 * - Open issue details in new window
 * - Hide UI elements (create button, estimate field, epic field)
 * - Hide space navigation tabs
 */

console.log('[Copy as Markdown] JIRA backlog content script loaded');

// =============================================================================
// Selectors
// =============================================================================

// Backlog
const CARD_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.interaction-layer.accessible-card"]';
const ISSUE_LINK_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.screen-reader-key"]';
const CREATE_BUTTON_SELECTOR = '[data-testid="software-backlog.card-list.inline-work-item-create.trigger-wrapper"]';
const ESTIMATE_FIELD_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.estimate-field-wrapper"]';

// Timeline
const TIMELINE_ROW_SELECTOR = '[data-testid^="roadmap.timeline-table.components.list-item.container-"]';
const TIMELINE_LINK_SELECTOR = '[data-testid="roadmap.timeline-table-kit.ui.list-item-content.summary.key"]';

// =============================================================================
// Setting Keys
// =============================================================================

const SETTING_KEY_BACKLOG_OPEN_NEW_WINDOW = 'jiraBacklogOpenDetailInNewWindow';
const SETTING_KEY_TIMELINE_OPEN_NEW_WINDOW = 'jiraTimelineOpenDetailInNewWindow';
const SETTING_KEY_HIDE_CREATE_BUTTON = 'jiraBacklogHideCreateButton';
const SETTING_KEY_HIDE_ESTIMATE_FIELD = 'jiraBacklogHideEstimateField';
const SETTING_KEY_HIDDEN_TABS = 'jiraSpaceNavHiddenTabs';

// =============================================================================
// Generic Helpers
// =============================================================================

/**
 * Reads a boolean setting from sync storage
 */
async function getBooleanSetting(key: string, logName: string): Promise<boolean> {
  console.log(`[Copy as Markdown] Checking if ${logName} is enabled...`);
  try {
    const result = await browser.storage.sync.get({ [key]: false });
    console.log(`[Copy as Markdown] ${logName} setting value:`, result[key]);
    return result[key] as boolean;
  } catch (error) {
    console.error(`[Copy as Markdown] Failed to read ${logName} setting:`, error);
    return false;
  }
}

/**
 * Reads a string array setting from sync storage
 */
async function getArraySetting(key: string, logName: string): Promise<string[]> {
  console.log(`[Copy as Markdown] Getting ${logName}...`);
  try {
    const result = await browser.storage.sync.get({ [key]: [] });
    console.log(`[Copy as Markdown] ${logName}:`, result[key]);
    return result[key] as string[];
  } catch (error) {
    console.error(`[Copy as Markdown] Failed to read ${logName} setting:`, error);
    return [];
  }
}

/**
 * Injects a style element into the document head
 */
function injectStyle(styleId: string, css: string, logName: string): void {
  if (document.getElementById(styleId)) {
    return; // Already injected
  }
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);
  console.log(`[Copy as Markdown] ${logName} style injected`);
}

/**
 * Removes a style element from the document
 */
function removeStyle(styleId: string, logName: string): void {
  const style = document.getElementById(styleId);
  if (style) {
    style.remove();
    console.log(`[Copy as Markdown] ${logName} style removed`);
  }
}

/**
 * Toggles a style based on enabled state
 */
function toggleStyle(styleId: string, css: string, logName: string, enabled: boolean): void {
  if (enabled) {
    injectStyle(styleId, css, logName);
  } else {
    removeStyle(styleId, logName);
  }
}

// =============================================================================
// Style Configurations
// =============================================================================

interface StyleConfig {
  settingKey: string;
  styleId: string;
  css: string;
  logName: string;
}

const STYLE_CONFIGS: StyleConfig[] = [
  {
    settingKey: SETTING_KEY_HIDE_CREATE_BUTTON,
    styleId: 'copy-as-markdown-hide-create-button',
    css: `${CREATE_BUTTON_SELECTOR} { display: none !important; }`,
    logName: 'Hide create button',
  },
  {
    settingKey: SETTING_KEY_HIDE_ESTIMATE_FIELD,
    styleId: 'copy-as-markdown-hide-estimate-field',
    css: `div:has(> ${ESTIMATE_FIELD_SELECTOR}) { display: none !important; }`,
    logName: 'Hide estimate field',
  },
];

// =============================================================================
// Hidden Tabs Style (special handling due to dynamic CSS generation)
// =============================================================================

const HIDE_TABS_STYLE_ID = 'copy-as-markdown-hide-space-nav-tabs';

function generateHiddenTabsCss(hiddenTabs: string[]): string {
  if (hiddenTabs.length === 0) {
    return '';
  }

  return hiddenTabs.map((tabPath) => {
    // shortcuts and addtabs use button with data-testid instead of anchor with href
    if (tabPath === 'shortcuts') {
      return `nav[aria-label="スペース ナビゲーション"] li:has([data-testid="horizontal-nav-shortcuts-tab.dropdown-menu-trigger"]) { display: none !important; }`;
    }
    if (tabPath === 'addtabs') {
      return `nav[aria-label="スペース ナビゲーション"] [data-testid="navigation-kit-add-tab.ui.trigger"] { display: none !important; }`;
    }
    // boards URL is /boards/N, but backlog/timeline/calendar/reports are /boards/N/xxx, so exclude them
    if (tabPath === 'boards') {
      return `nav[aria-label="スペース ナビゲーション"] li:has(a[href*="/boards/"]):not(:has(a[href$="/backlog"])):not(:has(a[href$="/timeline"])):not(:has(a[href$="/calendar"])):not(:has(a[href$="/reports"])) { display: none !important; }`;
    }
    // release-page is in query parameter, so use contains selector
    if (tabPath === 'release-page') {
      return `nav[aria-label="スペース ナビゲーション"] li:has(a[href*="release-page"]) { display: none !important; }`;
    }
    // backlog-prioritization is in query parameter, so use contains selector
    if (tabPath === 'backlog-prioritization') {
      return `nav[aria-label="スペース ナビゲーション"] li:has(a[href*="backlog-prioritization"]) { display: none !important; }`;
    }
    return `nav[aria-label="スペース ナビゲーション"] li:has(a[href$="/${tabPath}"]) { display: none !important; }`;
  }).join('\n');
}

function updateHiddenTabsStyle(hiddenTabs: string[]): void {
  removeStyle(HIDE_TABS_STYLE_ID, 'Hide tabs');
  const css = generateHiddenTabsCss(hiddenTabs);
  if (css) {
    injectStyle(HIDE_TABS_STYLE_ID, css, 'Hide tabs');
  }
}

// =============================================================================
// Click Handlers for Open in New Window
// =============================================================================

let backlogClickListenerAttached = false;
let timelineClickListenerAttached = false;

function toggleBacklogClickListener(enabled: boolean): void {
  if (enabled && !backlogClickListenerAttached) {
    document.addEventListener('click', handleCardClick, { capture: true });
    backlogClickListenerAttached = true;
  } else if (!enabled && backlogClickListenerAttached) {
    document.removeEventListener('click', handleCardClick, { capture: true });
    backlogClickListenerAttached = false;
  }
}

function toggleTimelineClickListener(enabled: boolean): void {
  if (enabled && !timelineClickListenerAttached) {
    document.addEventListener('click', handleTimelineRowClick, { capture: true });
    timelineClickListenerAttached = true;
  } else if (!enabled && timelineClickListenerAttached) {
    document.removeEventListener('click', handleTimelineRowClick, { capture: true });
    timelineClickListenerAttached = false;
  }
}

function findIssueUrl(card: Element): string | null {
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
    const match = ariaLabel.match(/^([A-Z]+-\d+)/);
    if (match) {
      return `/browse/${match[1]}`;
    }
  }

  return null;
}

function findTimelineIssueUrl(row: Element): string | null {
  const link = row.querySelector(TIMELINE_LINK_SELECTOR) as HTMLAnchorElement | null;
  return link?.href ?? null;
}

function handleCardClick(event: MouseEvent): void {
  const target = event.target as Element;
  const card = target.closest(CARD_SELECTOR);

  if (!card) {
    return;
  }

  const issueUrl = findIssueUrl(card);
  if (!issueUrl) {
    return;
  }

  console.log('[Copy as Markdown] Opening backlog issue:', issueUrl);
  event.preventDefault();
  event.stopPropagation();
  window.open(issueUrl, '_blank');
}

function handleTimelineRowClick(event: MouseEvent): void {
  const target = event.target as Element;

  // Skip button elements (e.g., expand button) to preserve their default behavior
  if (target.closest('button')) {
    return;
  }

  const row = target.closest(TIMELINE_ROW_SELECTOR);

  if (!row) {
    return;
  }

  const issueUrl = findTimelineIssueUrl(row);
  if (!issueUrl) {
    return;
  }

  console.log('[Copy as Markdown] Opening timeline issue:', issueUrl);
  event.preventDefault();
  event.stopPropagation();
  window.open(issueUrl, '_blank');
}

// =============================================================================
// Initialization
// =============================================================================

async function init(): Promise<void> {
  console.log('[Copy as Markdown] init() called');

  // Handle "open in new window" features
  const backlogOpenEnabled = await getBooleanSetting(SETTING_KEY_BACKLOG_OPEN_NEW_WINDOW, 'backlog open in new window');
  toggleBacklogClickListener(backlogOpenEnabled);

  const timelineOpenEnabled = await getBooleanSetting(SETTING_KEY_TIMELINE_OPEN_NEW_WINDOW, 'timeline open in new window');
  toggleTimelineClickListener(timelineOpenEnabled);

  // Handle style toggle features
  for (const config of STYLE_CONFIGS) {
    const enabled = await getBooleanSetting(config.settingKey, config.logName);
    toggleStyle(config.styleId, config.css, config.logName, enabled);
  }

  // Handle hidden tabs (special case with dynamic CSS)
  const hiddenTabs = await getArraySetting(SETTING_KEY_HIDDEN_TABS, 'hidden tabs');
  updateHiddenTabsStyle(hiddenTabs);
}

// =============================================================================
// Settings Change Listener
// =============================================================================

browser.storage.sync.onChanged.addListener((changes) => {
  // Handle "open in new window" settings
  const backlogChange = changes[SETTING_KEY_BACKLOG_OPEN_NEW_WINDOW];
  if (backlogChange) {
    toggleBacklogClickListener(backlogChange.newValue as boolean);
  }

  const timelineChange = changes[SETTING_KEY_TIMELINE_OPEN_NEW_WINDOW];
  if (timelineChange) {
    toggleTimelineClickListener(timelineChange.newValue as boolean);
  }

  // Handle style toggle settings
  for (const config of STYLE_CONFIGS) {
    const change = changes[config.settingKey];
    if (change) {
      toggleStyle(config.styleId, config.css, config.logName, change.newValue as boolean);
    }
  }

  // Handle hidden tabs setting
  const hiddenTabsChange = changes[SETTING_KEY_HIDDEN_TABS];
  if (hiddenTabsChange) {
    updateHiddenTabsStyle(hiddenTabsChange.newValue as string[]);
  }
});

// =============================================================================
// Start
// =============================================================================

init();
