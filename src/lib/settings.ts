import '../vendor/browser-polyfill.js';
import { TabGroupIndentationStyle, UnorderedListStyle } from './markdown.js';

const SKLinkTextAlwaysEscapeBrackets = 'linkTextAlwaysEscapeBrackets';
// [sic.] The following keys have spaces at the end since they were introduced (typo). Do not modify.
const SKStyleOfUnorderedList = 'styleOfUnorderedList ';
const SKStyleTabGroupIndentation = 'style.tabgroup.indentation ';
const SKExtractBracketedPrefix = 'extractBracketedPrefix';

interface Settings {
  alwaysEscapeLinkBrackets: boolean;
  styleOfUnorderedList: UnorderedListStyle;
  styleOfTabGroupIndentation: TabGroupIndentationStyle;
  extractBracketedPrefix: boolean;
}

/**
 * Singleton Settings object in the sync storage
 */
export default {
  SKLinkTextAlwaysEscapeBrackets,
  SKStyleOfUnorderedList,
  SKStyleTabGroupIndentation,
  SKExtractBracketedPrefix,

  get defaultSettings(): Record<string, unknown> {
    return {
      [SKLinkTextAlwaysEscapeBrackets]: false,
      [SKStyleOfUnorderedList]: UnorderedListStyle.Dash,
      [SKStyleTabGroupIndentation]: TabGroupIndentationStyle.Spaces,
      [SKExtractBracketedPrefix]: false,
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
    };
  },
};
