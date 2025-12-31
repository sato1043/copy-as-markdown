/**
 * JIRA Backlog Content Script
 *
 * When enabled, clicking on a backlog issue card opens the issue in a new window
 * instead of the default behavior (opening in the same window/panel).
 */

console.log('[Copy as Markdown] JIRA backlog content script loaded');

const CARD_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.interaction-layer.accessible-card"]';
const ISSUE_LINK_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.screen-reader-key"]';
const SETTING_KEY = 'jiraBacklogOpenDetailInNewWindow';

async function isFeatureEnabled(): Promise<boolean> {
  console.log('[Copy as Markdown] Checking if feature is enabled...');
  try {
    const result = await browser.storage.sync.get({ [SETTING_KEY]: false });
    console.log('[Copy as Markdown] Setting value:', result[SETTING_KEY]);
    return result[SETTING_KEY] as boolean;
  } catch (error) {
    console.error('[Copy as Markdown] Failed to read settings:', error);
    return false;
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

function attachClickListener(): void {
  // Use capture phase to intercept before JIRA's handlers
  document.addEventListener('click', handleCardClick, { capture: true });
  console.log('[Copy as Markdown] Click listener attached');
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
  const enabled = await isFeatureEnabled();
  if (!enabled) {
    console.log('[Copy as Markdown] Feature is disabled, exiting');
    return;
  }

  attachClickListener();
  observeDynamicContent();

  console.log('[Copy as Markdown] JIRA backlog enhancement enabled');
}

// Listen for settings changes
browser.storage.sync.onChanged.addListener((changes) => {
  if (SETTING_KEY in changes) {
    // Reload page to apply new setting
    // (simpler than managing listener state)
    window.location.reload();
  }
});

// Start
init();
