export default function autopair(textarea, pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"'
}) {
  let openings = Object.keys(pairs);
  let closings = Object.values(pairs);

  let insertText = text => document.execCommand('insertText', false, text);
  let setCursor = pos => {
    textarea.selectionStart = textarea.selectionEnd = pos;
  };

  let handler = evt => {
    let { selectionStart: start, selectionEnd: end, value } = textarea;

    // Typethrough
    if (start === end && closings.includes(evt.key) && value[end] === evt.key) {
      evt.preventDefault();
      setCursor(end + 1);
      return;
    }

    // Handle backspace inside a direct pair
    if (evt.key === 'Backspace' && start === end && start > 0) {
      let left = value[start - 1];
      let right = value[start];
      let opening = openings.find(k => pairs[k] === right);

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

    let closing = pairs[evt.key];
    if (!closing) return;

    // Wrap selection if present
    if (start !== end) {
      evt.preventDefault();

      insertText(evt.key + value.slice(start, end) + closing);

      textarea.selectionStart = start + 1;
      textarea.selectionEnd = end + 1;

      return;
    }

    let nextCharWhitelist = /[\s;})\]]/;
    let nextChar = value[end] || '';
    let prevChar = value[start - 1] || '';
    let insidePair = closing === nextChar;
    let safeNext = nextChar === '' || nextCharWhitelist.test(nextChar);
    let isSymmetric = evt.key === closing;

    // Autoclose only when allowed
    if (!insidePair && (!safeNext || (isSymmetric && (prevChar === evt.key || /\w/.test(prevChar))))) {
      return;
    }

    evt.preventDefault();

    insertText(evt.key + closing);
    setCursor(start + 1);
  };

  textarea.addEventListener('keydown', handler);

  return () => {
    textarea.removeEventListener('keydown', handler);
  };
}
