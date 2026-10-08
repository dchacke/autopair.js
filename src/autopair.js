// Mirrors Sublime Text's auto-pairing in Markdown mode: the auto_match_enabled
// key bindings from the Default package plus the Markdown package's additions
// for backticks, asterisks and underscores. Regexes are copied from those
// keymaps. Like Sublime's preceding_text/following_text, they are tested
// against the text between the caret and the start/end of its line.

const QUOTE_FOLLOWING = /^(?:\t| |\)|]|\}|>|$)/;
const BRACKET_FOLLOWING = /^(?:\t| |\)|]|;|\}|$)/;

const SUBLIME_RULES = {
  '(': { following: BRACKET_FOLLOWING },
  '[': { following: BRACKET_FOLLOWING },
  '{': { following: /^(?:\t| |\)|]|\}|$)/ },
  '"': { following: QUOTE_FOLLOWING, preceding: /["a-zA-Z0-9_]$/ },
  "'": { following: QUOTE_FOLLOWING, preceding: /['a-zA-Z0-9_]$/ },
  '`': {
    following: /^(?:\t| |\)|]|\}|\.|,|$)/,
    // Sublime's \w is Unicode-aware
    preceding: /[\p{L}\p{M}\p{Nd}\p{Pc}`]$/u,
    notInCode: true,
    codeSpan: true
  },
  '*': { wrapOnly: true, notInCode: true },
  '_': { wrapOnly: true, notInCode: true }
};

const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Pairs Sublime doesn't know get the rules of its closest equivalent:
// symmetric pairs behave like quotes, asymmetric ones like brackets.
const genericRule = (opening, closing) => opening === closing
  ? {
    following: QUOTE_FOLLOWING,
    preceding: new RegExp(`[${escapeRegExp(opening)}a-zA-Z0-9_]$`)
  }
  : {
    following: new RegExp(`^(?:\\t| |\\)|]|;|\\}|${escapeRegExp(closing)}|$)`)
  };

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const CLOSING_FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

// Approximates Sublime's meta.code-fence scope
const inFencedCode = (value, pos) => {
  const lines = value.slice(0, pos).split('\n');
  const currentLine = lines.pop();
  let fence = null;

  for (const line of lines) {
    if (!fence) {
      fence = line.match(FENCE)?.[1] || null;
    } else {
      const closing = line.match(CLOSING_FENCE)?.[1];

      if (closing && closing[0] === fence[0] && closing.length >= fence.length) {
        fence = null;
      }
    }
  }

  return fence !== null || FENCE.test(currentLine);
};

// Approximates Sublime's inline markup.raw scope
const inInlineCode = lineBefore => (lineBefore.match(/`/g) || []).length % 2 === 1;

export default function autopair(textarea, pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"',
  '`': '`',
  '*': '*',
  '_': '_'
}) {
  const rules = new Map(Object.entries(pairs).map(([opening, closing]) => [
    opening,
    { opening, closing, ...(SUBLIME_RULES[opening] || genericRule(opening, closing)) }
  ]));
  const rulesByClosing = new Map([...rules.values()].map(rule => [rule.closing, rule]));

  const insertText = text => textarea.ownerDocument.execCommand('insertText', false, text);
  const setSelection = (start, end) => {
    textarea.selectionStart = start;
    textarea.selectionEnd = end;
  };

  const handler = evt => {
    if (evt.defaultPrevented || evt.isComposing) return;

    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const lineEnd = value.indexOf('\n', end);
    const before = value.slice(value.lastIndexOf('\n', start - 1) + 1, start);
    const after = value.slice(end, lineEnd === -1 ? value.length : lineEnd);
    const empty = start === end;
    const prevChar = before.slice(-1);
    const nextChar = after[0];
    const inCode = () => inFencedCode(value, start) || inInlineCode(before);

    // Backspace inside a direct pair. Sublime binds plain backspace only.
    if (evt.key === 'Backspace') {
      if (!empty || evt.shiftKey || evt.ctrlKey || evt.altKey || evt.metaKey) return;

      const rule = rulesByClosing.get(nextChar);

      if (!rule || rule.wrapOnly || prevChar !== rule.opening) return;
      if (rule.codeSpan && (inFencedCode(value, start) || !inInlineCode(before))) return;

      evt.preventDefault();
      setSelection(start - 1, start + 1);
      insertText('');

      return;
    }

    // Leave shortcuts alone, but not AltGr (reported as Ctrl+Alt on Windows)
    if (evt.metaKey || (evt.ctrlKey && !evt.altKey)) return;

    // Typethrough: move cursor past an existing closing char
    const closingRule = rulesByClosing.get(evt.key);

    if (empty && closingRule && !closingRule.wrapOnly && nextChar === evt.key) {
      const typesThrough = closingRule.codeSpan
        ? !inFencedCode(value, start) && (inInlineCode(before) || prevChar === evt.key)
        : true;

      if (typesThrough) {
        evt.preventDefault();
        setSelection(end + 1, end + 1);

        return;
      }
    }

    const rule = rules.get(evt.key);
    if (!rule || (rule.notInCode && inCode())) return;

    // Wrap selection
    if (!empty) {
      evt.preventDefault();
      insertText(rule.opening + value.slice(start, end) + rule.closing);
      setSelection(start + 1, end + 1);

      return;
    }

    if (rule.wrapOnly) return;

    // Autoclose
    if (!rule.following.test(after) || rule.preceding?.test(before)) return;

    evt.preventDefault();
    insertText(rule.opening + rule.closing);
    setSelection(start + 1, start + 1);
  };

  textarea.addEventListener('keydown', handler);

  return () => {
    textarea.removeEventListener('keydown', handler);
  };
}
