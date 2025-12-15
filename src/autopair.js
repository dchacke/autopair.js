export default function autopair(textarea, pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"'
}) {
  let handler = evt => {
    const { selectionStart: start, selectionEnd: end, value } = textarea;

    // Typethrough
    if (start === end) {
      const next = value[end];
      const isClosing = Object.values(pairs).includes(evt.key);

      if (isClosing && next === evt.key) {
        evt.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = end + 1;
        return;
      }
    }

    // Handle backspace inside a direct pair
    if (evt.key === 'Backspace' && start === end && start > 0) {
      const left = value[start - 1];
      const right = value[start];
      const opening = Object.keys(pairs).find(k => pairs[k] === right);
      if (left === opening) {
        evt.preventDefault();
        // Select the pair and delete in one go
        textarea.selectionStart = start - 1;
        textarea.selectionEnd = start + 1;
        document.execCommand('insertText', false, '');

        return;
      }

      return; // normal backspace
    }

    const closing = pairs[evt.key];
    if (!closing) return;

    const isWordChar = /[\w]/;
    const punctuation = /[;,.})\]]/;

    // Wrap selection if present
    if (start !== end) {
      evt.preventDefault();
      textarea.selectionStart = start;
      textarea.selectionEnd = end;
      document.execCommand('insertText', false, evt.key + value.slice(start, end) + closing);
      textarea.selectionStart = start + 1;
      textarea.selectionEnd = end + 1;
      return;
    }

    // Only autopair if next char is whitespace, punctuation, or a closing of the same type
    const nextChar = value[end] || '';
    const insidePair = closing === nextChar;
    const safeNext = !isWordChar.test(nextChar) || punctuation.test(nextChar);
    if (!insidePair && !safeNext) return;

    evt.preventDefault();
    textarea.selectionStart = textarea.selectionEnd = start;
    document.execCommand('insertText', false, evt.key + closing);
    textarea.selectionStart = textarea.selectionEnd = start + 1;
  };

  textarea.addEventListener('keydown', handler);

  return () => {
    textarea.removeEventListener('keydown', handler);
  };
}
