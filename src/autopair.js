// Mirrors Sublime Text's auto-pairing in Markdown mode: the auto_match_enabled
// key bindings from the Default package plus the Markdown package's additions
// for backticks, asterisks and underscores. Regexes are copied from those
// keymaps. Like Sublime's preceding_text/following_text, they are tested
// against the text between the caret and the start/end of its line.
// Custom pairs override the Markdown package's rules.

const QUOTE_FOLLOWING = /^(?:\t| |\)|]|\}|>|$)/;
const BRACKET_FOLLOWING = /^(?:\t| |\)|]|;|\}|$)/;

const DEFAULT_PACKAGE_RULES = {
  '(': { following: BRACKET_FOLLOWING },
  '[': { following: BRACKET_FOLLOWING },
  '{': { following: /^(?:\t| |\)|]|\}|$)/ },
  '"': { following: QUOTE_FOLLOWING, preceding: /["a-zA-Z0-9_]$/ },
  "'": { following: QUOTE_FOLLOWING, preceding: /['a-zA-Z0-9_]$/ }
};

const MARKDOWN_PACKAGE_RULES = {
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

// Other pairs get the rules of their closest equivalent in the Default
// package: symmetric pairs behave like quotes, asymmetric ones like brackets.
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

// Number of edits whose selection is restored on undo/redo
const HISTORY_SIZE = 100;

const DEFAULT_PAIRS = {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"',
  '`': '`',
  '*': '*',
  '_': '_'
};

export default function autopair(textarea, pairs) {
  const sublimeRules = pairs
    ? DEFAULT_PACKAGE_RULES
    : { ...DEFAULT_PACKAGE_RULES, ...MARKDOWN_PACKAGE_RULES };
  const rules = new Map(Object.entries(pairs || DEFAULT_PAIRS).map(([opening, closing]) => [
    opening,
    { opening, closing, ...(sublimeRules[opening] || genericRule(opening, closing)) }
  ]));
  const rulesByClosing = new Map([...rules.values()].map(rule => [rule.closing, rule]));

  const insertText = text => textarea.ownerDocument.execCommand('insertText', false, text);
  const setSelection = (start, end) => {
    textarea.selectionStart = start;
    textarea.selectionEnd = end;
  };

  // On undo, browsers restore the selection from before an edit, and on redo
  // they put the caret after the inserted text, ignoring where autopair moved
  // it. Remember the intended selections so undo/redo can restore them.
  const history = [];

  const replace = (start, end, text, selectionStart, selectionEnd) => {
    const before = {
      value: textarea.value,
      start: textarea.selectionStart,
      end: textarea.selectionEnd
    };

    setSelection(start, end);
    insertText(text);
    setSelection(selectionStart, selectionEnd);

    history.push({
      before,
      after: { value: textarea.value, start: selectionStart, end: selectionEnd }
    });

    if (history.length > HISTORY_SIZE) history.shift();
  };

  const restoreSelection = evt => {
    const state = { historyUndo: 'before', historyRedo: 'after' }[evt.inputType];
    if (!state) return;

    const entry = history.findLast(entry => entry[state].value === textarea.value);
    if (entry) setSelection(entry[state].start, entry[state].end);
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
      replace(start - 1, start + 1, '', start - 1, start - 1);

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
      replace(start, end, rule.opening + value.slice(start, end) + rule.closing, start + 1, end + 1);

      return;
    }

    if (rule.wrapOnly) return;

    // Autoclose
    if (!rule.following.test(after) || rule.preceding?.test(before)) return;

    evt.preventDefault();
    replace(start, end, rule.opening + rule.closing, start + 1, start + 1);
  };

  textarea.addEventListener('keydown', handler);
  textarea.addEventListener('input', restoreSelection);

  return () => {
    textarea.removeEventListener('keydown', handler);
    textarea.removeEventListener('input', restoreSelection);
  };
}
