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

  test('does not autopair in front of a word', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'word';
    textarea.selectionStart = textarea.selectionEnd = 0;

    autopair(textarea);

    const evt = new KeyboardEvent('keydown', { key: '(' });
    textarea.dispatchEvent(evt);

    expect(textarea.value).toBe('word'); // unchanged
  });

  test('autopairs before punctuation', () => {
    const textarea = document.createElement('textarea');
    textarea.value = ';';
    textarea.selectionStart = textarea.selectionEnd = 0;

    autopair(textarea);

    const evt = new KeyboardEvent('keydown', { key: '(' });
    textarea.dispatchEvent(evt);

    expect(textarea.value).toBe('();');
    expect(textarea.selectionStart).toBe(1);
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

  test('backspace deletes matching pair when caret is between them', () => {
    const textarea = document.createElement('textarea');
    textarea.value = '()';
    textarea.selectionStart = 1; // caret between the parentheses
    textarea.selectionEnd = 1;

    autopair(textarea);

    // Simulate pressing Backspace
    const evt = new KeyboardEvent('keydown', { key: 'Backspace' });
    textarea.dispatchEvent(evt);

    // Expect both parentheses removed
    expect(textarea.value).toBe('');
    // Cursor should be at start
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(0);
  });

  test('supports custom user-defined pairings', () => {
    const textarea = document.createElement('textarea');
    textarea.value = '';
    textarea.selectionStart = textarea.selectionEnd = 0;

    // Use custom pair: * => *
    autopair(textarea, { '*': '*' });

    // Simulate typing '*'
    const evt = new KeyboardEvent('keydown', { key: '*' });
    textarea.dispatchEvent(evt);

    expect(textarea.value).toBe('**');
    expect(textarea.selectionStart).toBe(1);
    expect(textarea.selectionEnd).toBe(1);
  });

  test('wraps selection with custom pairing', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'bold';
    textarea.selectionStart = 0;
    textarea.selectionEnd = 4;

    autopair(textarea, { '*': '*' });

    const evt = new KeyboardEvent('keydown', { key: '*' });
    textarea.dispatchEvent(evt);

    expect(textarea.value).toBe('*bold*');
    expect(textarea.selectionStart).toBe(1);
    expect(textarea.selectionEnd).toBe(5);
  });
});
