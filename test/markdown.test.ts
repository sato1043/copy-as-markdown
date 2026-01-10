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

    describe('jiraExtractBracketedPrefix=true (JIRA URL)', () => {
      const markdownExtract = new Markdown({ jiraExtractBracketedPrefix: true });
      const jiraUrl = 'https://example.atlassian.net/browse/JIRA-1234';

      it('extracts [xxx] and appends remainder as text', () => {
        expect(markdownExtract.linkTo('[JIRA-1234] Some Title', jiraUrl)).toBe(`[JIRA-1234](${jiraUrl}) Some Title`);
      });

      it('extracts [xxx] when title is exactly the pattern', () => {
        expect(markdownExtract.linkTo('[JIRA-999]', jiraUrl)).toBe(`[JIRA-999](${jiraUrl})`);
      });

      it('handles various prefix formats', () => {
        expect(markdownExtract.linkTo('[PROJ-12345] Long Issue Title', jiraUrl)).toBe(`[PROJ-12345](${jiraUrl}) Long Issue Title`);
        expect(markdownExtract.linkTo('[TICKET-1] Fix bug', jiraUrl)).toBe(`[TICKET-1](${jiraUrl}) Fix bug`);
        expect(markdownExtract.linkTo('[ABC] Simple', jiraUrl)).toBe(`[ABC](${jiraUrl}) Simple`);
      });

      it('does not extract when bracket is not at the start', () => {
        // Balanced brackets are not escaped when alwaysEscapeLinkBracket=false (default)
        expect(markdownExtract.linkTo('Not [JIRA-1234] Title', jiraUrl)).toBe(`[Not [JIRA-1234] Title](${jiraUrl})`);
      });

      it('only extracts first bracketed prefix', () => {
        expect(markdownExtract.linkTo('[PROJ-1] [JIRA-2] Title', jiraUrl)).toBe(`[PROJ-1](${jiraUrl}) [JIRA-2] Title`);
      });

      it('handles title without brackets normally', () => {
        expect(markdownExtract.linkTo('Some Title', jiraUrl)).toBe(`[Some Title](${jiraUrl})`);
      });

      it('does not apply to non-JIRA URLs', () => {
        expect(markdownExtract.linkTo('[JIRA-1234] Some Title', 'https://example.com')).toBe('[[JIRA-1234] Some Title](https://example.com)');
      });

      it('applies to localhost URLs (development/test)', () => {
        expect(markdownExtract.linkTo('[JIRA-1234] Some Title', 'http://localhost:5566/jira-page.html')).toBe('[JIRA-1234](http://localhost:5566/jira-page.html) Some Title');
        expect(markdownExtract.linkTo('[JIRA-1234] Some Title', 'https://localhost/browse/JIRA-1234')).toBe('[JIRA-1234](https://localhost/browse/JIRA-1234) Some Title');
      });
    });

    describe('jiraExtractBracketedPrefix=false (default)', () => {
      it('does not extract bracketed prefix when disabled', () => {
        const jiraUrl = 'https://example.atlassian.net/browse/JIRA-1234';
        // Balanced brackets are not escaped when alwaysEscapeLinkBracket=false (default)
        expect(markdown.linkTo('[JIRA-1234] Some Title', jiraUrl)).toBe(`[[JIRA-1234] Some Title](${jiraUrl})`);
      });

      it('still handles empty title', () => {
        expect(markdown.linkTo('', 'https://example.com')).toBe('[(No Title)](https://example.com)');
      });
    });

    describe('jiraTrimTitleTrailingSuffix=true (JIRA URL)', () => {
      const markdownTrim = new Markdown({ jiraTrimTitleTrailingSuffix: true });
      const jiraUrl = 'https://example.atlassian.net/browse/JIRA-1234';

      it('removes trailing suffix with " - "', () => {
        expect(markdownTrim.linkTo('Article Title - Site Name', jiraUrl)).toBe(`[Article Title](${jiraUrl})`);
      });

      it('removes only the last " - " occurrence', () => {
        expect(markdownTrim.linkTo('A - B - C', jiraUrl)).toBe(`[A - B](${jiraUrl})`);
      });

      it('handles title without suffix', () => {
        expect(markdownTrim.linkTo('Simple Title', jiraUrl)).toBe(`[Simple Title](${jiraUrl})`);
      });

      it('handles empty result after trimming', () => {
        // If the entire title is " - xxx", it becomes empty and uses default title
        expect(markdownTrim.linkTo(' - Site', jiraUrl)).toBe(`[(No Title)](${jiraUrl})`);
      });

      it('requires spaces around hyphen', () => {
        // "Title-Suffix" should not be trimmed (no spaces)
        expect(markdownTrim.linkTo('Title-Suffix', jiraUrl)).toBe(`[Title-Suffix](${jiraUrl})`);
      });

      it('does not apply to non-JIRA URLs', () => {
        expect(markdownTrim.linkTo('Article Title - Site Name', 'https://example.com')).toBe('[Article Title - Site Name](https://example.com)');
      });

      it('applies to localhost URLs (development/test)', () => {
        expect(markdownTrim.linkTo('Article Title - Site Name', 'http://localhost:5566/page.html')).toBe('[Article Title](http://localhost:5566/page.html)');
      });
    });

    describe('jiraTrimTitleTrailingSuffix=true with jiraExtractBracketedPrefix=true (JIRA URL)', () => {
      const markdownBoth = new Markdown({ jiraTrimTitleTrailingSuffix: true, jiraExtractBracketedPrefix: true });
      const jiraUrl = 'https://example.atlassian.net/browse/JIRA-1234';

      it('applies suffix removal before bracket extraction', () => {
        // [JIRA-1234] Some Title - Site → [JIRA-1234] Some Title → [JIRA-1234](url) Some Title
        expect(markdownBoth.linkTo('[JIRA-1234] Some Title - Site', jiraUrl)).toBe(`[JIRA-1234](${jiraUrl}) Some Title`);
      });

      it('handles JIRA-style title with trailing suffix', () => {
        expect(markdownBoth.linkTo('[JIRA-1234] Some Feature Title - Jira', jiraUrl)).toBe(`[JIRA-1234](${jiraUrl}) Some Feature Title`);
      });
    });

    describe('jiraTrimTitleTrailingSuffix=false (default)', () => {
      it('does not remove trailing suffix when disabled', () => {
        expect(markdown.linkTo('Article Title - Site Name', 'https://example.com')).toBe('[Article Title - Site Name](https://example.com)');
      });
    });
  });
});
