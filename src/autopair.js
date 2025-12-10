// src/autopair.js
function autopair(textarea, pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"'
}) {
  textarea.addEventListener('keydown', (evt) => {
    const closing = pairs[evt.key];
    if (!closing) return; // skip keys we don't handle

    evt.preventDefault();

    const { selectionStart: start, selectionEnd: end, value } = textarea;

    // Insert the pair
    textarea.value = value.slice(0, start) + evt.key + closing + value.slice(end);

    // Place cursor between the pair
    textarea.selectionStart = textarea.selectionEnd = start + 1;
  });
}

module.exports = autopair;
