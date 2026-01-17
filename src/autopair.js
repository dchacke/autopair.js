export default function autopair(textarea, pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"'
}) {
  const openings = Object.keys(pairs);
  const closings = Object.values(pairs);

  const insertText = (text) => document.execCommand('insertText', false, text);

  let handler = evt => {
    const { selectionStart: start, selectionEnd: end, value } = textarea;

    // Typethrough
    if (start === end && closings.includes(evt.key) && value[end] === evt.key) {
      evt.preventDefault();
      textarea.selectionStart = textarea.selectionEnd = end + 1;
      return;
    }

    // Handle backspace inside a direct pair
    if (evt.key === 'Backspace' && start === end && start > 0) {
      const left = value[start - 1];
      const right = value[start];
      const opening = openings.find(k => pairs[k] === right);
      if (left === opening) {
        evt.preventDefault();
        // Select the pair and delete in one go
        textarea.selectionStart = start - 1;
        textarea.selectionEnd = start + 1;
        insertText('');

        return;
      }

      return; // normal backspace
    }

    const closing = pairs[evt.key];
    if (!closing) return;

    // Wrap selection if present
    if (start !== end) {
      evt.preventDefault();
      textarea.selectionStart = start;
      textarea.selectionEnd = end;
      insertText(evt.key + value.slice(start, end) + closing);
      textarea.selectionStart = start + 1;
      textarea.selectionEnd = end + 1;
      return;
    }

    const nextCharWhitelist = /[\s;})\]]/;
    const nextChar = value[end] || '';
    const prevChar = value[start - 1] || '';
    const insidePair = closing === nextChar;
    const safeNext = nextChar === '' || nextCharWhitelist.test(nextChar);
    const isSymmetric = evt.key === closing;

    // Autoclose only when allowed
    if (!insidePair && (!safeNext || (isSymmetric && start === end && prevChar === evt.key))) {
      return;
    }

    evt.preventDefault();
    textarea.selectionStart = textarea.selectionEnd = start;
    insertText(evt.key + closing);
    textarea.selectionStart = textarea.selectionEnd = start + 1;
  };

  textarea.addEventListener('keydown', handler);

  return () => {
    textarea.removeEventListener('keydown', handler);
  };
}
