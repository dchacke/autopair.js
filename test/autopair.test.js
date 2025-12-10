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
});
