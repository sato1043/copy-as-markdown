import '../vendor/browser-polyfill.js';
import { TabGroupIndentationStyle, UnorderedListStyle } from './markdown.js';

const SKLinkTextAlwaysEscapeBrackets = 'linkTextAlwaysEscapeBrackets';
// [sic.] The following keys have spaces at the end since they were introduced (typo). Do not modify.
const SKStyleOfUnorderedList = 'styleOfUnorderedList ';
const SKStyleTabGroupIndentation = 'style.tabgroup.indentation ';
const SKJiraExtractBracketedPrefix = 'jiraExtractBracketedPrefix';
const SKJiraTrimTitleTrailingSuffix = 'jiraTrimTitleTrailingSuffix';
const SKJiraBacklogOpenDetailInNewWindow = 'jiraBacklogOpenDetailInNewWindow';
const SKJiraBacklogHideCreateButton = 'jiraBacklogHideCreateButton';
const SKJiraBacklogHideEstimateField = 'jiraBacklogHideEstimateField';
const SKJiraBacklogHideColumnsOnTitleHover = 'jiraBacklogHideColumnsOnTitleHover';
const SKJiraSpaceNavHiddenTabs = 'jiraSpaceNavHiddenTabs';
const SKJiraTimelineOpenDetailInNewWindow = 'jiraTimelineOpenDetailInNewWindow';

interface Settings {
  alwaysEscapeLinkBrackets: boolean;
  styleOfUnorderedList: UnorderedListStyle;
  styleOfTabGroupIndentation: TabGroupIndentationStyle;
  jiraExtractBracketedPrefix: boolean;
  jiraTrimTitleTrailingSuffix: boolean;
  jiraBacklogOpenDetailInNewWindow: boolean;
  jiraBacklogHideCreateButton: boolean;
  jiraBacklogHideEstimateField: boolean;
  jiraBacklogHideColumnsOnTitleHover: boolean;
  jiraSpaceNavHiddenTabs: string[];
  jiraTimelineOpenDetailInNewWindow: boolean;
}

/**
 * Singleton Settings object in the sync storage
 */
export default {
  SKLinkTextAlwaysEscapeBrackets,
  SKStyleOfUnorderedList,
  SKStyleTabGroupIndentation,
  SKJiraExtractBracketedPrefix,
  SKJiraTrimTitleTrailingSuffix,
  SKJiraBacklogOpenDetailInNewWindow,
  SKJiraBacklogHideCreateButton,
  SKJiraBacklogHideEstimateField,
  SKJiraBacklogHideColumnsOnTitleHover,
  SKJiraSpaceNavHiddenTabs,
  SKJiraTimelineOpenDetailInNewWindow,

  get defaultSettings(): Record<string, unknown> {
    return {
      [SKLinkTextAlwaysEscapeBrackets]: false,
      [SKStyleOfUnorderedList]: UnorderedListStyle.Dash,
      [SKStyleTabGroupIndentation]: TabGroupIndentationStyle.Spaces,
      [SKJiraExtractBracketedPrefix]: false,
      [SKJiraTrimTitleTrailingSuffix]: false,
      [SKJiraBacklogOpenDetailInNewWindow]: false,
      [SKJiraBacklogHideCreateButton]: false,
      [SKJiraBacklogHideEstimateField]: false,
      [SKJiraBacklogHideColumnsOnTitleHover]: false,
      [SKJiraSpaceNavHiddenTabs]: [],
      [SKJiraTimelineOpenDetailInNewWindow]: false,
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

  async setJiraExtractBracketedPrefix(value: boolean): Promise<void> {
    await browser.storage.sync.set({
      [SKJiraExtractBracketedPrefix]: value,
    });
  },

  async setJiraTrimTitleTrailingSuffix(value: boolean): Promise<void> {
    await browser.storage.sync.set({
      [SKJiraTrimTitleTrailingSuffix]: value,
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

  async setJiraBacklogHideEstimateField(value: boolean): Promise<void> {
    await browser.storage.sync.set({
      [SKJiraBacklogHideEstimateField]: value,
    });
  },

  async setJiraBacklogHideColumnsOnTitleHover(value: boolean): Promise<void> {
    await browser.storage.sync.set({
      [SKJiraBacklogHideColumnsOnTitleHover]: value,
    });
  },

  async setJiraSpaceNavHiddenTabs(value: string[]): Promise<void> {
    await browser.storage.sync.set({
      [SKJiraSpaceNavHiddenTabs]: value,
    });
  },

  async setJiraTimelineOpenDetailInNewWindow(value: boolean): Promise<void> {
    await browser.storage.sync.set({
      [SKJiraTimelineOpenDetailInNewWindow]: value,
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
      jiraExtractBracketedPrefix: all[SKJiraExtractBracketedPrefix] as boolean,
      jiraTrimTitleTrailingSuffix: all[SKJiraTrimTitleTrailingSuffix] as boolean,
      jiraBacklogOpenDetailInNewWindow: all[SKJiraBacklogOpenDetailInNewWindow] as boolean,
      jiraBacklogHideCreateButton: all[SKJiraBacklogHideCreateButton] as boolean,
      jiraBacklogHideEstimateField: all[SKJiraBacklogHideEstimateField] as boolean,
      jiraBacklogHideColumnsOnTitleHover: all[SKJiraBacklogHideColumnsOnTitleHover] as boolean,
      jiraSpaceNavHiddenTabs: all[SKJiraSpaceNavHiddenTabs] as string[],
      jiraTimelineOpenDetailInNewWindow: all[SKJiraTimelineOpenDetailInNewWindow] as boolean,
    };
  },
};
