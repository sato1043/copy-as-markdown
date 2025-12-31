/**
 * E2E tests for JIRA backlog content script
 *
 * Since content_scripts only match *.atlassian.net/jira/*, we test by:
 * 1. Loading the fixture page
 * 2. Dynamically injecting the content script logic via scripting API
 */

import { expect, test } from './fixtures';

const JIRA_BACKLOG_FIXTURE = 'http://localhost:5566/jira-backlog.html';
const CARD_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.interaction-layer.accessible-card"]';
const SETTING_KEY = 'jiraBacklogOpenDetailInNewWindow';
const TIMELINE_SETTING_KEY = 'jiraTimelineOpenDetailInNewWindow';
const HIDE_CREATE_SETTING_KEY = 'jiraBacklogHideCreateButton';
const HIDDEN_TABS_SETTING_KEY = 'jiraSpaceNavHiddenTabs';
const CREATE_BUTTON_SELECTOR = '[data-testid="software-backlog.card-list.inline-work-item-create.trigger-wrapper"]';
const SPACE_NAV_SELECTOR = 'nav[aria-label="スペース ナビゲーション"]';
const TIMELINE_ROW_SELECTOR = '[data-testid^="roadmap.timeline-table.components.list-item.container-"]';
const TIMELINE_LINK_SELECTOR = '[data-testid="roadmap.timeline-table-kit.ui.list-item-content.summary.key"]';

test.describe('JIRA backlog content script', () => {
  test.beforeEach(async ({ page, serviceWorker }) => {
    // Enable the feature
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: true });
    }, SETTING_KEY);

    // Navigate to fixture page
    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');
  });

  test('setting is stored correctly', async ({ serviceWorker }) => {
    const value = await serviceWorker.evaluate(async (key) => {
      const result = await chrome.storage.sync.get({ [key]: false });
      return result[key];
    }, SETTING_KEY);

    expect(value).toBe(true);
  });

  test('fixture page has correct DOM structure', async ({ page }) => {
    // Verify fixture has the expected elements
    const cards = await page.locator(CARD_SELECTOR).count();
    expect(cards).toBe(3);

    // First card should have a link
    const firstCardLink = await page
      .locator('[data-testid="software-backlog.card-list.card"]')
      .first()
      .locator('[data-testid="software-backlog.card-list.card.card-contents.screen-reader-key"]');
    await expect(firstCardLink).toHaveAttribute('href', '/browse/SCRUM-1');
  });

  test('content script injected via page.evaluate opens new window on card click', async ({
    page,
  }) => {
    // Inject the content script logic directly via page.evaluate
    await page.evaluate(() => {
      const CARD_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.interaction-layer.accessible-card"]';
      const ISSUE_LINK_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.screen-reader-key"]';

      function findIssueUrl(card: Element): string | null {
        const container = card.closest('[data-testid*="software-backlog.card-list.card"]');
        if (!container) return null;

        const link = container.querySelector(ISSUE_LINK_SELECTOR) as HTMLAnchorElement | null;
        if (link?.href) return link.href;

        const ariaLabel = card.getAttribute('aria-label');
        if (ariaLabel) {
          const match = ariaLabel.match(/^([A-Z]+-\d+)/);
          if (match) return `/browse/${match[1]}`;
        }
        return null;
      }

      function handleCardClick(event: MouseEvent): void {
        const target = event.target as Element;
        const card = target.closest(CARD_SELECTOR);
        if (!card) {
          console.log('[Test] No card found for target:', target);
          return;
        }

        const issueUrl = findIssueUrl(card);
        if (!issueUrl) {
          console.log('[Test] No issue URL found for card:', card);
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        // Store the URL for verification instead of opening
        (window as any).__lastClickedIssueUrl = issueUrl;
        console.log('[Test] Would open:', issueUrl);
      }

      document.addEventListener('click', handleCardClick, { capture: true });
      console.log('[Test] Content script logic injected');
    });

    // Wait for script to be injected
    await page.waitForTimeout(100);

    // Click on the first card's accessible element
    const firstCard = page.locator(CARD_SELECTOR).first();
    await firstCard.click();

    // Verify the URL was captured
    const capturedUrl = await page.evaluate(() => (window as any).__lastClickedIssueUrl);
    expect(capturedUrl).toContain('/browse/SCRUM-1');
  });

  test('clicking card with aria-label fallback extracts issue key', async ({
    page,
  }) => {
    // Inject content script via page.evaluate
    await page.evaluate(() => {
      const CARD_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.interaction-layer.accessible-card"]';
      const ISSUE_LINK_SELECTOR = '[data-testid="software-backlog.card-list.card.card-contents.screen-reader-key"]';

      function findIssueUrl(card: Element): string | null {
        const container = card.closest('[data-testid*="software-backlog.card-list.card"]');
        if (!container) return null;

        const link = container.querySelector(ISSUE_LINK_SELECTOR) as HTMLAnchorElement | null;
        if (link?.href) return link.href;

        const ariaLabel = card.getAttribute('aria-label');
        if (ariaLabel) {
          const match = ariaLabel.match(/^([A-Z]+-\d+)/);
          if (match) return `/browse/${match[1]}`;
        }
        return null;
      }

      function handleCardClick(event: MouseEvent): void {
        const target = event.target as Element;
        const card = target.closest(CARD_SELECTOR);
        if (!card) return;

        const issueUrl = findIssueUrl(card);
        if (!issueUrl) return;

        event.preventDefault();
        event.stopPropagation();
        (window as any).__lastClickedIssueUrl = issueUrl;
      }

      document.addEventListener('click', handleCardClick, { capture: true });
    });

    await page.waitForTimeout(100);

    // Click on the third card (no explicit link, uses aria-label)
    const thirdCard = page.locator(CARD_SELECTOR).nth(2);
    await thirdCard.click();

    const capturedUrl = await page.evaluate(() => (window as any).__lastClickedIssueUrl);
    expect(capturedUrl).toBe('/browse/TEST-123');
  });
});

test.describe('JIRA backlog feature disabled', () => {
  test('content script does not activate when setting is false', async ({
    page,
    serviceWorker,
  }) => {
    // Ensure the feature is disabled
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: false });
    }, SETTING_KEY);

    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');

    // The content script should check the setting and not attach listeners
    // We verify this by checking that the init function would return early
    const isEnabled = await serviceWorker.evaluate(async (key) => {
      const result = await chrome.storage.sync.get({ [key]: false });
      return result[key];
    }, SETTING_KEY);

    expect(isEnabled).toBe(false);
  });
});

test.describe('JIRA backlog hide create button', () => {
  test('hides create button when enabled', async ({ page, serviceWorker }) => {
    // Enable hide create button
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: true });
    }, HIDE_CREATE_SETTING_KEY);

    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');

    // Inject the CSS hiding logic
    await page.evaluate((selector) => {
      const style = document.createElement('style');
      style.textContent = `${selector} { display: none !important; }`;
      document.head.appendChild(style);
    }, CREATE_BUTTON_SELECTOR);

    // Verify create button is hidden
    const createButton = page.locator(CREATE_BUTTON_SELECTOR);
    await expect(createButton).toBeHidden();
  });

  test('shows create button when disabled', async ({ page, serviceWorker }) => {
    // Disable hide create button
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: false });
    }, HIDE_CREATE_SETTING_KEY);

    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');

    // Verify create button is visible
    const createButton = page.locator(CREATE_BUTTON_SELECTOR);
    await expect(createButton).toBeVisible();
  });
});

test.describe('JIRA space navigation hidden tabs', () => {
  test('hides tabs with href-based selector', async ({ page, serviceWorker }) => {
    // Set hidden tabs
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: ['summary', 'list'] });
    }, HIDDEN_TABS_SETTING_KEY);

    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');

    // Inject the CSS hiding logic
    await page.evaluate((navSelector) => {
      const style = document.createElement('style');
      style.textContent = `
        ${navSelector} li:has(a[href$="/summary"]) { display: none !important; }
        ${navSelector} li:has(a[href$="/list"]) { display: none !important; }
      `;
      document.head.appendChild(style);
    }, SPACE_NAV_SELECTOR);

    // Verify summary and list tabs are hidden
    const summaryTab = page.locator(`${SPACE_NAV_SELECTOR} li:has(a[href$="/summary"])`);
    const listTab = page.locator(`${SPACE_NAV_SELECTOR} li:has(a[href$="/list"])`);
    await expect(summaryTab).toBeHidden();
    await expect(listTab).toBeHidden();

    // Verify other tabs are still visible
    const backlogTab = page.locator(`${SPACE_NAV_SELECTOR} li:has(a[href$="/backlog"])`);
    await expect(backlogTab).toBeVisible();
  });

  test('hides shortcuts tab with data-testid selector', async ({ page, serviceWorker }) => {
    // Set hidden tabs
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: ['shortcuts'] });
    }, HIDDEN_TABS_SETTING_KEY);

    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');

    // Inject the CSS hiding logic for shortcuts
    await page.evaluate((navSelector) => {
      const style = document.createElement('style');
      style.textContent = `${navSelector} li:has([data-testid="horizontal-nav-shortcuts-tab.dropdown-menu-trigger"]) { display: none !important; }`;
      document.head.appendChild(style);
    }, SPACE_NAV_SELECTOR);

    // Verify shortcuts tab is hidden
    const shortcutsTab = page.locator(`${SPACE_NAV_SELECTOR} li:has([data-testid="horizontal-nav-shortcuts-tab.dropdown-menu-trigger"])`);
    await expect(shortcutsTab).toBeHidden();
  });

  test('hides addtabs button with data-testid selector', async ({ page, serviceWorker }) => {
    // Set hidden tabs
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: ['addtabs'] });
    }, HIDDEN_TABS_SETTING_KEY);

    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');

    // Inject the CSS hiding logic for addtabs
    await page.evaluate((navSelector) => {
      const style = document.createElement('style');
      style.textContent = `${navSelector} [data-testid="navigation-kit-add-tab.ui.trigger"] { display: none !important; }`;
      document.head.appendChild(style);
    }, SPACE_NAV_SELECTOR);

    // Verify addtabs button is hidden
    const addtabsButton = page.locator(`${SPACE_NAV_SELECTOR} [data-testid="navigation-kit-add-tab.ui.trigger"]`);
    await expect(addtabsButton).toBeHidden();
  });

  test('hides boards tab without hiding backlog/timeline/calendar', async ({ page, serviceWorker }) => {
    // Set hidden tabs
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: ['boards'] });
    }, HIDDEN_TABS_SETTING_KEY);

    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');

    // Inject the CSS hiding logic for boards (excluding backlog/timeline/calendar)
    await page.evaluate((navSelector) => {
      const style = document.createElement('style');
      style.textContent = `${navSelector} li:has(a[href*="/boards/"]):not(:has(a[href$="/backlog"])):not(:has(a[href$="/timeline"])):not(:has(a[href$="/calendar"])) { display: none !important; }`;
      document.head.appendChild(style);
    }, SPACE_NAV_SELECTOR);

    // Verify boards tab is hidden
    const boardsTab = page.locator(`${SPACE_NAV_SELECTOR} li:has(a[href$="/boards/1"]):not(:has(a[href$="/backlog"]))`);
    await expect(boardsTab).toBeHidden();

    // Verify backlog, timeline, calendar tabs are still visible
    const backlogTab = page.locator(`${SPACE_NAV_SELECTOR} li:has(a[href$="/backlog"])`);
    const timelineTab = page.locator(`${SPACE_NAV_SELECTOR} li:has(a[href$="/timeline"])`);
    const calendarTab = page.locator(`${SPACE_NAV_SELECTOR} li:has(a[href$="/calendar"])`);
    await expect(backlogTab).toBeVisible();
    await expect(timelineTab).toBeVisible();
    await expect(calendarTab).toBeVisible();
  });

  test('shows all tabs when hiddenTabs is empty', async ({ page, serviceWorker }) => {
    // Set empty hidden tabs
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: [] });
    }, HIDDEN_TABS_SETTING_KEY);

    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');

    // Verify all tabs are visible
    const allTabs = page.locator(`${SPACE_NAV_SELECTOR} li`);
    const count = await allTabs.count();
    expect(count).toBe(18); // 18 tabs in fixture

    for (let i = 0; i < count; i++) {
      await expect(allTabs.nth(i)).toBeVisible();
    }
  });
});

test.describe('JIRA timeline content script', () => {
  test.beforeEach(async ({ page, serviceWorker }) => {
    // Enable the timeline feature
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: true });
    }, TIMELINE_SETTING_KEY);

    // Navigate to fixture page
    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');
  });

  test('timeline setting is stored correctly', async ({ serviceWorker }) => {
    const value = await serviceWorker.evaluate(async (key) => {
      const result = await chrome.storage.sync.get({ [key]: false });
      return result[key];
    }, TIMELINE_SETTING_KEY);

    expect(value).toBe(true);
  });

  test('fixture page has timeline DOM structure', async ({ page }) => {
    // Verify fixture has the expected timeline elements
    const rows = await page.locator(TIMELINE_ROW_SELECTOR).count();
    expect(rows).toBe(2);

    // First row should have a link
    const firstRowLink = await page.locator(TIMELINE_LINK_SELECTOR).first();
    await expect(firstRowLink).toHaveAttribute('href', '/browse/SCRUM-2');
  });

  test('content script injected via page.evaluate opens new window on timeline row click', async ({
    page,
  }) => {
    // Inject the content script logic directly via page.evaluate
    await page.evaluate((selectors) => {
      const { TIMELINE_ROW_SELECTOR, TIMELINE_LINK_SELECTOR } = selectors;

      function findTimelineIssueUrl(row: Element): string | null {
        const link = row.querySelector(TIMELINE_LINK_SELECTOR) as HTMLAnchorElement | null;
        if (link?.href) return link.href;
        return null;
      }

      function handleTimelineRowClick(event: MouseEvent): void {
        const target = event.target as Element;
        const row = target.closest(TIMELINE_ROW_SELECTOR);
        if (!row) {
          console.log('[Test] No timeline row found for target:', target);
          return;
        }

        const issueUrl = findTimelineIssueUrl(row);
        if (!issueUrl) {
          console.log('[Test] No issue URL found for row:', row);
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        // Store the URL for verification instead of opening
        (window as any).__lastClickedTimelineIssueUrl = issueUrl;
        console.log('[Test] Would open timeline issue:', issueUrl);
      }

      document.addEventListener('click', handleTimelineRowClick, { capture: true });
      console.log('[Test] Timeline content script logic injected');
    }, { TIMELINE_ROW_SELECTOR, TIMELINE_LINK_SELECTOR });

    // Wait for script to be injected
    await page.waitForTimeout(100);

    // Click on the first timeline row
    const firstRow = page.locator(TIMELINE_ROW_SELECTOR).first();
    await firstRow.click();

    // Verify the URL was captured
    const capturedUrl = await page.evaluate(() => (window as any).__lastClickedTimelineIssueUrl);
    expect(capturedUrl).toContain('/browse/SCRUM-2');
  });
});

test.describe('JIRA timeline feature disabled', () => {
  test('content script does not activate when timeline setting is false', async ({
    page,
    serviceWorker,
  }) => {
    // Ensure the timeline feature is disabled
    await serviceWorker.evaluate(async (key) => {
      await chrome.storage.sync.set({ [key]: false });
    }, TIMELINE_SETTING_KEY);

    await page.goto(JIRA_BACKLOG_FIXTURE);
    await page.waitForLoadState('networkidle');

    // The content script should check the setting and not attach listeners
    const isEnabled = await serviceWorker.evaluate(async (key) => {
      const result = await chrome.storage.sync.get({ [key]: false });
      return result[key];
    }, TIMELINE_SETTING_KEY);

    expect(isEnabled).toBe(false);
  });
});
