function autopair(textarea, pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"',
}) {
  textarea.addEventListener('keydown', (evt) => {
    const closing = pairs[evt.key];
    if (!closing) return;

    const { selectionStart: start, selectionEnd: end, value } = textarea;

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

module.exports = autopair;
