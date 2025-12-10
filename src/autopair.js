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
    const nextChar = value[end] || ''; // character after the caret

    // Only autopair if next char is whitespace or end of text
    if (nextChar && !/\s/.test(nextChar)) return;

    evt.preventDefault();

    textarea.value = value.slice(0, start) + evt.key + closing + value.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + 1;
  });
}

module.exports = autopair;
