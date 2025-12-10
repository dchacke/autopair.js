const autopair = require('../src/autopair');

describe('Autopair insertion', () => {
  let textarea;

  beforeEach(() => {
    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.value = '';
    textarea.selectionStart = textarea.selectionEnd = 0;
    autopair(textarea);
  });

  afterEach(() => {
    document.body.removeChild(textarea);
  });

  test('inserts matching closing parenthesis for (', () => {
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: '(' }));
    expect(textarea.value).toBe('()');
    expect(textarea.selectionStart).toBe(1);
  });

  test('inserts matching closing bracket for [', () => {
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: '[' }));
    expect(textarea.value).toBe('[]');
    expect(textarea.selectionStart).toBe(1);
  });

  test('inserts matching closing brace for {', () => {
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: '{' }));
    expect(textarea.value).toBe('{}');
    expect(textarea.selectionStart).toBe(1);
  });

  test('inserts matching double quote for "', () => {
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: '"' }));
    expect(textarea.value).toBe('""');
    expect(textarea.selectionStart).toBe(1);
  });

  test('inserts matching single quote for \'', () => {
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: '\'' }));
    expect(textarea.value).toBe("''");
    expect(textarea.selectionStart).toBe(1);
  });

  test('does not autopair when caret is in front of a word', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'word';
    textarea.selectionStart = textarea.selectionEnd = 0;

    autopair(textarea);

    // Simulate typing '('
    const evt = new KeyboardEvent('keydown', { key: '(' });
    textarea.dispatchEvent(evt);

    expect(textarea.value).toBe('word'); // should remain unchanged
  });

  test('wraps selected text with autopair', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'hello';
    // select the word 'ell'
    textarea.selectionStart = 1;
    textarea.selectionEnd = 4;

    autopair(textarea);

    // Simulate typing '('
    const evt = new KeyboardEvent('keydown', { key: '(' });
    textarea.dispatchEvent(evt);

    // Expect the selection to be wrapped
    expect(textarea.value).toBe('h(ell)o');
    // Cursor should be after the opening paren
    expect(textarea.selectionStart).toBe(2);
    expect(textarea.selectionEnd).toBe(5);
  });
});
