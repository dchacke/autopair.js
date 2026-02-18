export default function autopair(textarea, pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"'
}) {
  const closingFor = new Map(Object.entries(pairs));
  const openingFor = new Map(Object.entries(pairs).map(([k, v]) => [v, k]));

  const insertText = text => document.execCommand('insertText', false, text);
  const setSelection = (start, end) => {
    textarea.selectionStart = start;
    textarea.selectionEnd = end;
  };

  const handler = evt => {
    const { selectionStart: start, selectionEnd: end, value } = textarea;

    // Typethrough: move cursor past an existing closing char
    if (start === end && openingFor.has(evt.key) && value[end] === evt.key) {
      evt.preventDefault();
      setSelection(end + 1, end + 1);

      return;
    }

    // Backspace inside a direct pair
    if (evt.key === 'Backspace' && start === end && start > 0) {
      const left = value[start - 1];
      const right = value[start];
      const opening = openingFor.get(right);

      if (left === opening) {
        evt.preventDefault();
        setSelection(start - 1, start + 1);
        insertText('');

        return;
      }
    }

    const closing = closingFor.get(evt.key);
    if (!closing) return;

    // Wrap selection
    if (start !== end) {
      evt.preventDefault();
      insertText(evt.key + value.slice(start, end) + closing);
      setSelection(start + 1, end + 1);

      return;
    }

    // Autoclose single characters when typing next to a safe context
    const nextChar = value[end] || '';
    const prevChar = value[start - 1] || '';
    const insidePair = closing === nextChar;
    const safeNext = nextChar === '' || /[\s;})\]]/.test(nextChar);
    const isSymmetric = evt.key === closing;

    if (!insidePair && (!safeNext || (isSymmetric && (prevChar === evt.key || /\w/.test(prevChar))))) {
      return;
    }

    evt.preventDefault();
    insertText(evt.key + closing);
    setSelection(start + 1, start + 1);
  };

  textarea.addEventListener('keydown', handler);

  return () => {
    textarea.removeEventListener('keydown', handler);
  };
}
