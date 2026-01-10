export type NestedArray = (string | NestedArray)[];

export enum UnorderedListStyle {
  Dash = 'dash',
  Asterisk = 'asterisk',
  Plus = 'plus',
}

export enum TabGroupIndentationStyle {
  Spaces = 'spaces',
  Tab = 'tab',
}

export default class Markdown {
  alwaysEscapeLinkBracket: boolean;
  unorderedListStyle: UnorderedListStyle;
  indentationStyle: TabGroupIndentationStyle;
  jiraExtractBracketedPrefix: boolean;
  jiraTrimTitleTrailingSuffix: boolean;

  static DefaultTitle(): string {
    return '(No Title)';
  }

  constructor({
    alwaysEscapeLinkBracket = false,
    unorderedListStyle = UnorderedListStyle.Dash,
    indentationStyle = TabGroupIndentationStyle.Spaces,
    jiraExtractBracketedPrefix = false,
    jiraTrimTitleTrailingSuffix = false,
  } = {}) {
    this.alwaysEscapeLinkBracket = alwaysEscapeLinkBracket;
    this.unorderedListStyle = unorderedListStyle;
    this.indentationStyle = indentationStyle;
    this.jiraExtractBracketedPrefix = jiraExtractBracketedPrefix;
    this.jiraTrimTitleTrailingSuffix = jiraTrimTitleTrailingSuffix;
  }

  private isJiraUrl(url: string): boolean {
    // Production: *.atlassian.net
    // Development/Test: localhost
    return /\.atlassian\.net\//.test(url) || /^https?:\/\/localhost[:/]/.test(url);
  }

  /**
   * check if [] are balanced
   */
  static bracketsAreBalanced(text: string): boolean {
    const stack: string[] = [];

    // using an iterator to ensure Unicode code point is considered.
    const it = text[Symbol.iterator]();
    let ch = it.next();

    while (!ch.done) {
      if (ch.value === '[') {
        stack.push(ch.value);
      } else if (ch.value === ']') {
        if (stack.length === 0) {
          return false;
        }
        stack.pop();
      }
      ch = it.next();
    }

    return (stack.length === 0);
  }

  /**
   * Escapes link text to sanitize inline formats or unbalanced brackets.
   * @see https://spec.commonmark.org/0.30/#link-text
   * @example unbalanced brackets are escaped
   *   escapeLinkText('[[[Staple') // \[\[\[Staple
   *   escapeLinkText('Apple ][') // Apple \]\[
   * @example balanced brackets are intact
   *   escapeLinkText('[JIRA-123] Launch Rocket') // [JIRA-123] Launch Rocket
   * @example inline formats are escaped
   *   escapeLinkText('Click *Start* button to run `launch()`')
   *   //=> Click \*Start\* button to run \`launch()\`
   */
  escapeLinkText(text: string): string {
    const shouldEscapeBrackets = (
      this.alwaysEscapeLinkBracket // user wants \[\]
      || !Markdown.bracketsAreBalanced(text) // unbalanced brackets, must be escaped
    );

    const newString: string[] = [];

    // using an iterator to ensure Unicode code point is considered.
    const it = text[Symbol.iterator]();
    let ch = it.next();

    while (!ch.done) {
      let chToUse: string | null = null;

      switch (ch.value) {
        // Potential unbalanced brackets
        case '[':
        case ']':
          if (shouldEscapeBrackets) {
            chToUse = `\\${ch.value}`;
          }
          break;

        // chars that may be interpreted as inline formats
        case '*':
        case '_':
        case '`':
        case '~':
          chToUse = `\\${ch.value}`;
          break;

        default:
          break;
      }

      if (chToUse === null) {
        chToUse = ch.value;
      }

      newString.push(chToUse);
      ch = it.next();
    }

    return newString.join('');
  }

  linkTo(title: string, url: string): string {
    if (title === '') {
      return `[${Markdown.DefaultTitle()}](${url})`;
    }

    // JIRA サイトの場合のみ設定を適用
    const isJira = this.isJiraUrl(url);

    let processedTitle = title;

    // サフィックス削除（JIRA のみ）: 最後の " - xxx" パターンを除去
    // 例: "記事タイトル - サイト名" → "記事タイトル"
    if (isJira && this.jiraTrimTitleTrailingSuffix) {
      processedTitle = title.replace(/\s+-\s[^-]*$/, '').trim();
      if (processedTitle === '') {
        return `[${Markdown.DefaultTitle()}](${url})`;
      }
    }

    // プレフィックス抽出（JIRA のみ）
    // 先頭の [xxx] パターンを抽出し、残りをテキストとして追加
    // 例: [JIRA-1234] Some Feature Title → [JIRA-1234](url) Some Feature Title
    if (isJira && this.jiraExtractBracketedPrefix) {
      const pattern = /^\[([^\]]+)\]\s*(.*)/;
      const match = processedTitle.match(pattern);
      if (match && match[1]) {
        const prefixText = this.escapeLinkText(match[1]);
        const remainder = match[2] ? ` ${match[2]}` : '';
        return `[${prefixText}](${url})${remainder}`;
      }
    }

    return `[${this.escapeLinkText(processedTitle)}](${url})`;
  }

  static imageFor(title: string, url: string): string {
    return `![${title}](${url})`;
  }

  static linkedImage(description: string, url: string, linkURL: string): string {
    return `[![${description}](${url})](${linkURL})`;
  }

  list(items: NestedArray): string {
    const rendered = this.renderList(items, this.unorderedListChar);
    const flattened = rendered.flat(10); // otherwise it only flatters 1 level deep
    return flattened.map(item => `${item}\n`).join('');
  }

  taskList(items: NestedArray): string {
    const rendered = this.renderList(items, '- [ ]');
    const flattened = rendered.flat(10); // otherwise it only flatters 1 level deep
    return flattened.map(item => `${item}\n`).join('');
  }

  renderList(items: NestedArray, prefix: string, level: number = 0): NestedArray {
    let renderedIndents = '';
    let indent = '';
    if (this.indentationStyle === TabGroupIndentationStyle.Spaces) {
      // Two spaces, happens to work because we only support unordered list.
      // It will break if we are going to support ordered list, in which the spaces to use
      // depend on the length of prefix characters in the parent level.
      indent = '  ';
    } else if (this.indentationStyle === TabGroupIndentationStyle.Tab) {
      indent = '\t';
    } else {
      throw new TypeError(`Invalid indent style ${this.indentationStyle}`);
    }

    for (let i = 0; i < level; i += 1) {
      renderedIndents += indent;
    }

    return items.map((item: string | NestedArray) => {
      if (Array.isArray(item)) {
        return this.renderList(item, prefix, level + 1);
      }
      return `${renderedIndents}${prefix} ${item}`;
    });
  }

  get unorderedListChar(): '-' | '*' | '+' {
    switch (this.unorderedListStyle) {
      case UnorderedListStyle.Asterisk:
        return '*';
      case UnorderedListStyle.Dash:
        return '-';
      case UnorderedListStyle.Plus:
        return '+';
      default:
        throw new TypeError(`invalid unorderedListStyle: ${this.unorderedListStyle}`);
    }
  }
}
