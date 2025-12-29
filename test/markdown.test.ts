import { describe, expect, it } from 'vitest';
import Markdown, { TabGroupIndentationStyle, UnorderedListStyle } from '../src/lib/markdown';

describe('markdown', () => {
  it('default properties', () => {
    const markdown = new Markdown({});
    expect(markdown.alwaysEscapeLinkBracket).toBe(false);
  });

  describe('list()', () => {
    it('defaults to dash', () => {
      const markdown = new Markdown();
      expect(markdown.list(['a', 'b', 'c'])).toBe('- a\n- b\n- c\n');
    });

    it('can set a character', () => {
      const markdown = new Markdown({ unorderedListStyle: UnorderedListStyle.Asterisk });
      expect(markdown.list(['a', 'b', 'c'])).toBe('* a\n* b\n* c\n');
    });

    describe('nested list', () => {
      it('works', () => {
        const markdown = new Markdown();
        expect(markdown.list(['a', 'b', ['c', 'd'], 'e', ['f']])).toBe('- a\n- b\n  - c\n  - d\n- e\n  - f\n');
      });

      it('can set indentation style', () => {
        const markdown = new Markdown({ indentationStyle: TabGroupIndentationStyle.Tab });
        expect(markdown.list(['a', 'b', ['c', 'd'], 'e', ['f']])).toBe('- a\n- b\n\t- c\n\t- d\n- e\n\t- f\n');
      });
    });
  });

  describe('taskList()', () => {
    it('works', () => {
      const markdown = new Markdown();
      expect(markdown.taskList(['a', 'b', 'c'])).toBe('- [ ] a\n- [ ] b\n- [ ] c\n');
    });
  });

  describe('bracketsArePaired()', () => {
    it('cases', () => {
      expect(Markdown.bracketsAreBalanced('[]')).toBe(true);
      expect(Markdown.bracketsAreBalanced('[[]]')).toBe(true);
      expect(Markdown.bracketsAreBalanced('[][]')).toBe(true);
      expect(Markdown.bracketsAreBalanced('][')).toBe(false);
      expect(Markdown.bracketsAreBalanced('[')).toBe(false);
      expect(Markdown.bracketsAreBalanced('[[[')).toBe(false);
      expect(Markdown.bracketsAreBalanced(']')).toBe(false);
      expect(Markdown.bracketsAreBalanced(']]]')).toBe(false);
    });
  });

  describe('escapeLinkText()', () => {
    describe('brackets', () => {
      describe('alwaysEscapeLinkBracket=false', () => {
        const markdown = new Markdown({ alwaysEscapeLinkBracket: false });

        it('escapes unbalanced brackets', () => {
          expect(markdown.escapeLinkText('[[[staples')).toBe('\\[\\[\\[staples');
          expect(markdown.escapeLinkText('staples]]]')).toBe('staples\\]\\]\\]');
          expect(markdown.escapeLinkText('Apple ][')).toBe('Apple \\]\\[');
        });

        it('does not affect balanced brackets', () => {
          expect(markdown.escapeLinkText('[APOLLO-13] Build a Rocket Engine')).toBe('[APOLLO-13] Build a Rocket Engine');
          expect(markdown.escapeLinkText('[[wiki]]')).toBe('[[wiki]]');
        });

        it('does not affect inline image', () => {
          expect(markdown.escapeLinkText('![moon](moon.jpg)')).toBe('![moon](moon.jpg)');
        });
      });

      describe('alwaysEscapeLinkBracket=true', () => {
        const markdown = new Markdown({ alwaysEscapeLinkBracket: true });

        it('escapes unbalanced brackets', () => {
          expect(markdown.escapeLinkText('[[[staples')).toBe('\\[\\[\\[staples');
          expect(markdown.escapeLinkText('staples]]]')).toBe('staples\\]\\]\\]');
          expect(markdown.escapeLinkText('Apple ][')).toBe('Apple \\]\\[');
        });

        it('does not affect balanced brackets', () => {
          expect(markdown.escapeLinkText('[APOLLO-13] Build a Rocket Engine')).toBe('\\[APOLLO-13\\] Build a Rocket Engine');
          expect(markdown.escapeLinkText('[[wiki]]')).toBe('\\[\\[wiki\\]\\]');
        });

        it('does not affect inline image', () => {
          expect(markdown.escapeLinkText('![moon](moon.jpg)')).toBe('!\\[moon\\](moon.jpg)');
        });
      });
    });

    describe('inline formats', () => {
      const markdown = new Markdown({ alwaysEscapeLinkBracket: false });
      it('escapes', () => {
        expect(markdown.escapeLinkText('link *foo **bar** `#`*')).toBe('link \\*foo \\*\\*bar\\*\\* \\`#\\`\\*');
      });
    });
  });

  describe('linkTo()', () => {
    const markdown = new Markdown();

    it('returns default title when title is empty', () => {
      expect(markdown.linkTo('', 'https://example.com')).toBe('[(No Title)](https://example.com)');
    });

    it('returns normal link for regular title', () => {
      expect(markdown.linkTo('Some Title', 'https://example.com')).toBe('[Some Title](https://example.com)');
    });

    describe('extractBracketedPrefix=true', () => {
      const markdownExtract = new Markdown({ extractBracketedPrefix: true });

      it('extracts [xxx] and appends remainder as text', () => {
        expect(markdownExtract.linkTo('[JIRA-1234] Some Title', 'https://example.com')).toBe('[JIRA-1234](https://example.com) Some Title');
      });

      it('extracts [xxx] when title is exactly the pattern', () => {
        expect(markdownExtract.linkTo('[JIRA-999]', 'https://example.com')).toBe('[JIRA-999](https://example.com)');
      });

      it('handles various prefix formats', () => {
        expect(markdownExtract.linkTo('[PROJ-12345] Long Issue Title', 'https://example.com')).toBe('[PROJ-12345](https://example.com) Long Issue Title');
        expect(markdownExtract.linkTo('[TICKET-1] Fix bug', 'https://example.com')).toBe('[TICKET-1](https://example.com) Fix bug');
        expect(markdownExtract.linkTo('[ABC] Simple', 'https://example.com')).toBe('[ABC](https://example.com) Simple');
      });

      it('does not extract when bracket is not at the start', () => {
        // Balanced brackets are not escaped when alwaysEscapeLinkBracket=false (default)
        expect(markdownExtract.linkTo('Not [JIRA-1234] Title', 'https://example.com')).toBe('[Not [JIRA-1234] Title](https://example.com)');
      });

      it('only extracts first bracketed prefix', () => {
        expect(markdownExtract.linkTo('[PROJ-1] [JIRA-2] Title', 'https://example.com')).toBe('[PROJ-1](https://example.com) [JIRA-2] Title');
      });

      it('handles title without brackets normally', () => {
        expect(markdownExtract.linkTo('Some Title', 'https://example.com')).toBe('[Some Title](https://example.com)');
      });
    });

    describe('extractBracketedPrefix=false (default)', () => {
      it('does not extract bracketed prefix when disabled', () => {
        // Balanced brackets are not escaped when alwaysEscapeLinkBracket=false (default)
        expect(markdown.linkTo('[JIRA-1234] Some Title', 'https://example.com')).toBe('[[JIRA-1234] Some Title](https://example.com)');
      });

      it('still handles empty title', () => {
        expect(markdown.linkTo('', 'https://example.com')).toBe('[(No Title)](https://example.com)');
      });
    });

    describe('trimTitleTrailingSuffix=true', () => {
      const markdownTrim = new Markdown({ trimTitleTrailingSuffix: true });

      it('removes trailing suffix with " - "', () => {
        expect(markdownTrim.linkTo('Article Title - Site Name', 'https://example.com')).toBe('[Article Title](https://example.com)');
      });

      it('removes only the last " - " occurrence', () => {
        expect(markdownTrim.linkTo('A - B - C', 'https://example.com')).toBe('[A - B](https://example.com)');
      });

      it('handles title without suffix', () => {
        expect(markdownTrim.linkTo('Simple Title', 'https://example.com')).toBe('[Simple Title](https://example.com)');
      });

      it('handles empty result after trimming', () => {
        // If the entire title is " - xxx", it becomes empty and uses default title
        expect(markdownTrim.linkTo(' - Site', 'https://example.com')).toBe('[(No Title)](https://example.com)');
      });

      it('requires spaces around hyphen', () => {
        // "Title-Suffix" should not be trimmed (no spaces)
        expect(markdownTrim.linkTo('Title-Suffix', 'https://example.com')).toBe('[Title-Suffix](https://example.com)');
      });
    });

    describe('trimTitleTrailingSuffix=true with extractBracketedPrefix=true', () => {
      const markdownBoth = new Markdown({ trimTitleTrailingSuffix: true, extractBracketedPrefix: true });

      it('applies suffix removal before bracket extraction', () => {
        // [JIRA-1234] Some Title - Site → [JIRA-1234] Some Title → [JIRA-1234](url) Some Title
        expect(markdownBoth.linkTo('[JIRA-1234] Some Title - Site', 'https://example.com')).toBe('[JIRA-1234](https://example.com) Some Title');
      });

      it('handles JIRA-style title with trailing suffix', () => {
        expect(markdownBoth.linkTo('[JIRA-1234] Some Feature Title - Jira', 'https://example.com')).toBe('[JIRA-1234](https://example.com) Some Feature Title');
      });
    });

    describe('trimTitleTrailingSuffix=false (default)', () => {
      it('does not remove trailing suffix when disabled', () => {
        expect(markdown.linkTo('Article Title - Site Name', 'https://example.com')).toBe('[Article Title - Site Name](https://example.com)');
      });
    });
  });
});
