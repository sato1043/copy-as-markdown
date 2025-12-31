import '../vendor/browser-polyfill.js';
import { TabGroupIndentationStyle, UnorderedListStyle } from './markdown.js';

const SKLinkTextAlwaysEscapeBrackets = 'linkTextAlwaysEscapeBrackets';
// [sic.] The following keys have spaces at the end since they were introduced (typo). Do not modify.
const SKStyleOfUnorderedList = 'styleOfUnorderedList ';
const SKStyleTabGroupIndentation = 'style.tabgroup.indentation ';
const SKExtractBracketedPrefix = 'extractBracketedPrefix';
const SKTrimTitleTrailingSuffix = 'trimTitleTrailingSuffix';
const SKJiraBacklogOpenDetailInNewWindow = 'jiraBacklogOpenDetailInNewWindow';
const SKJiraBacklogHideCreateButton = 'jiraBacklogHideCreateButton';
const SKJiraSpaceNavHiddenTabs = 'jiraSpaceNavHiddenTabs';

interface Settings {
  alwaysEscapeLinkBrackets: boolean;
  styleOfUnorderedList: UnorderedListStyle;
  styleOfTabGroupIndentation: TabGroupIndentationStyle;
  extractBracketedPrefix: boolean;
  trimTitleTrailingSuffix: boolean;
  jiraBacklogOpenDetailInNewWindow: boolean;
  jiraBacklogHideCreateButton: boolean;
  jiraSpaceNavHiddenTabs: string[];
}

/**
 * Singleton Settings object in the sync storage
 */
export default {
  SKLinkTextAlwaysEscapeBrackets,
  SKStyleOfUnorderedList,
  SKStyleTabGroupIndentation,
  SKExtractBracketedPrefix,
  SKTrimTitleTrailingSuffix,
  SKJiraBacklogOpenDetailInNewWindow,
  SKJiraBacklogHideCreateButton,
  SKJiraSpaceNavHiddenTabs,

  get defaultSettings(): Record<string, unknown> {
    return {
      [SKLinkTextAlwaysEscapeBrackets]: false,
      [SKStyleOfUnorderedList]: UnorderedListStyle.Dash,
      [SKStyleTabGroupIndentation]: TabGroupIndentationStyle.Spaces,
      [SKExtractBracketedPrefix]: false,
      [SKTrimTitleTrailingSuffix]: false,
      [SKJiraBacklogOpenDetailInNewWindow]: false,
      [SKJiraBacklogHideCreateButton]: false,
      [SKJiraSpaceNavHiddenTabs]: [],
    };
  },

  get keys(): string[] {
    return Object.keys(this.defaultSettings);
  },

  async setLinkTextAlwaysEscapeBrackets(value: boolean): Promise<void> {
    await browser.storage.sync.set({
      [SKLinkTextAlwaysEscapeBrackets]: value,
    });
  },

  async setStyleTabGroupIndentation(value: TabGroupIndentationStyle): Promise<void> {
    await browser.storage.sync.set({
      [SKStyleTabGroupIndentation]: value,
    });
  },

  async setStyleOfUnrderedList(value: UnorderedListStyle): Promise<void> {
    await browser.storage.sync.set({
      [SKStyleOfUnorderedList]: value,
    });
  },

  async setExtractBracketedPrefix(value: boolean): Promise<void> {
    await browser.storage.sync.set({
      [SKExtractBracketedPrefix]: value,
    });
  },

  async setTrimTitleTrailingSuffix(value: boolean): Promise<void> {
    await browser.storage.sync.set({
      [SKTrimTitleTrailingSuffix]: value,
    });
  },

  async setJiraBacklogOpenDetailInNewWindow(value: boolean): Promise<void> {
    await browser.storage.sync.set({
      [SKJiraBacklogOpenDetailInNewWindow]: value,
    });
  },

  async setJiraBacklogHideCreateButton(value: boolean): Promise<void> {
    await browser.storage.sync.set({
      [SKJiraBacklogHideCreateButton]: value,
    });
  },

  async setJiraSpaceNavHiddenTabs(value: string[]): Promise<void> {
    await browser.storage.sync.set({
      [SKJiraSpaceNavHiddenTabs]: value,
    });
  },

  async reset(): Promise<void> {
    await browser.storage.sync.remove(this.keys);
  },

  async getAll(): Promise<Settings> {
    const all = await browser.storage.sync.get(this.defaultSettings);

    return {
      alwaysEscapeLinkBrackets: all[SKLinkTextAlwaysEscapeBrackets] as boolean,
      styleOfUnorderedList: all[SKStyleOfUnorderedList] as UnorderedListStyle,
      styleOfTabGroupIndentation: all[SKStyleTabGroupIndentation] as TabGroupIndentationStyle,
      extractBracketedPrefix: all[SKExtractBracketedPrefix] as boolean,
      trimTitleTrailingSuffix: all[SKTrimTitleTrailingSuffix] as boolean,
      jiraBacklogOpenDetailInNewWindow: all[SKJiraBacklogOpenDetailInNewWindow] as boolean,
      jiraBacklogHideCreateButton: all[SKJiraBacklogHideCreateButton] as boolean,
      jiraSpaceNavHiddenTabs: all[SKJiraSpaceNavHiddenTabs] as string[],
    };
  },
};
