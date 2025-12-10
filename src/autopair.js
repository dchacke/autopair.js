function autopair(textarea, pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"',
}) {
  textarea.addEventListener('keydown', (evt) => {
    const { selectionStart: start, selectionEnd: end, value } = textarea;

    // Handle backspace
    if (evt.key === 'Backspace' && start === end && start > 0) {
      const left = value[start - 1];
      const right = value[start];
      const opening = Object.keys(pairs).find(k => pairs[k] === right);
      if (left === opening) {
        evt.preventDefault();
        textarea.value = value.slice(0, start - 1) + value.slice(start + 1);
        textarea.selectionStart = textarea.selectionEnd = start - 1;
        return;
      }
      // Otherwise let it behave normally in browser
      return;
    }

    const closing = pairs[evt.key];
    if (!closing) return;

    // Wrap selection if present
    if (start !== end) {
      evt.preventDefault();
      textarea.value = value.slice(0, start) + evt.key + value.slice(start, end) + closing + value.slice(end);
      textarea.selectionStart = start + 1;
      textarea.selectionEnd = end + 1;
      return;
    }

    // Only autopair if next char is whitespace or end of text
    const nextChar = value[end] || '';
    if (nextChar && !/\s/.test(nextChar)) return;

    evt.preventDefault();
    textarea.value = value.slice(0, start) + evt.key + closing + value.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + 1;
  });
}

// Export for Node / Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = autopair;
}

// Attach to window for browser
if (typeof window !== 'undefined') {
  window.autopair = autopair;
}
