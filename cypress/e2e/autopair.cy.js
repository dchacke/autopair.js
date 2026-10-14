const type = keys => cy.get('textarea').type(keys);

// Sets the caret, or the selection from start to end
const select = (start, end = start) => {
  cy.get('textarea').then($el => {
    $el[0].selectionStart = start;
    $el[0].selectionEnd = end;
  });
};

// Replaces the text without autopairing, then sets the caret or selection
const setText = (text, start, end = start) => {
  cy.get('textarea').focus();
  cy.get('textarea').then($el => $el.val(text));
  select(start, end);
};

// Checks the text and the caret, or the selection from start to end
const expectText = (text, start, end = start) => {
  cy.get('textarea').then($el => {
    expect($el.val()).to.eq(text);
    expect($el[0].selectionStart).to.eq(start);
    expect($el[0].selectionEnd).to.eq(end);
  });
};

const undo = () => cy.document().then(doc => doc.execCommand('undo'));
const redo = () => cy.document().then(doc => doc.execCommand('redo'));

describe('autopair', () => {
  it('wraps selected text in parentheses when "(" is typed', () => {
    cy.visit('/index.html');

    type('hello');
    select(0, 5);
    type('(');

    expectText('(hello)', 1, 6);
  });

  it('types through closing character', () => {
    cy.visit('/index.html');

    type('()');
    select(1);
    type(')');

    // Value is unchanged, cursor moves past )
    expectText('()', 2);
  });

  it('atomically deletes a pair', () => {
    cy.visit('/index.html');

    type('()');
    select(1);
    type('{backspace}');

    // Both characters are deleted
    cy.get('textarea').should('have.value', '');
  });

  it('automatically inserts closing parenthesis when "(" is typed', () => {
    cy.visit('/index.html');

    type('(');

    expectText('()', 1);
  });

  it('autopairs before a whitelisted character', () => {
    cy.visit('/index.html');

    type(';');
    select(0);
    type('(');

    expectText('();', 1);
  });

  it('does not autopair before a non-whitelisted character', () => {
    cy.visit('/index.html');

    type('.');
    select(0);
    type('(');

    expectText('(.', 1);
  });

  it('autopairs multiple opening parentheses correctly', () => {
    cy.visit('/index.html');

    type('(((');

    // Cursor inside the innermost pair
    expectText('((()))', 3);
  });

  it('does not autopair symmetric characters after an existing pair', () => {
    cy.visit('/index.html');

    type("'");
    expectText("''", 1);

    // Another quote at the end doesn't autopair again
    select(2);
    type("'");
    expectText("'''", 3);
  });

  it('autopairs existing custom quotes “ and ”', () => {
    cy.visit('/index.html');

    type('“');

    expectText('“”', 1);
  });

  it('supports undo and redo after typing a pair', () => {
    cy.visit('/index.html');

    type('()');

    undo();
    cy.get('textarea').should('have.value', '');

    redo();
    cy.get('textarea').should('have.value', '()');
  });

  it('restores the cursor inside a pair on redo', () => {
    cy.visit('/index.html');

    type('(');
    undo();
    redo();

    expectText('()', 1);
  });

  it('restores the wrapped selection on redo', () => {
    cy.visit('/index.html');

    type('hello');
    select(0, 5);
    type('(');
    undo();
    redo();

    expectText('(hello)', 1, 6);
  });

  it('restores the cursor inside a deleted pair on undo', () => {
    cy.visit('/index.html');

    type('({backspace}');
    undo();

    expectText('()', 1);
  });

  it('does not autopair a symmetric character behind a word character', () => {
    cy.visit('/index.html');

    type('hello');
    type("'");

    expectText("hello'", 6);
  });

  it('does autopair a symmetric character behind a non-word character', () => {
    cy.visit('/index.html');

    type('hello.');
    type("'");

    expectText("hello.''", 7);
  });

  it('does autopair a symmetric character behind a newline', () => {
    cy.visit('/index.html');

    type('\n');
    type("'");

    expectText("\n''", 2);
  });

  it('does autopair an asymmetric character behind a word character', () => {
    cy.visit('/index.html');

    type('hello');
    type('(');

    expectText('hello()', 6);
  });

  it('does not autopair a curly brace before a semicolon', () => {
    cy.visit('/index.html');

    type(';');
    select(0);
    type('{{}');

    expectText('{;', 1);
  });

  it('does not autopair a quote before a semicolon', () => {
    cy.visit('/index.html');

    type(';');
    select(0);
    type('"');

    expectText('";', 1);
  });

  it('autopairs a quote before an angle bracket', () => {
    cy.visit('/index.html');

    type('>');
    select(0);
    type('"');

    expectText('"">', 1);
  });

  it('does not delete a pair on backspace with a modifier', () => {
    cy.visit('/index.html');

    type('(');
    type('{ctrl}{backspace}');

    cy.get('textarea').should('have.value', ')');
  });

  [
    ['only wraps with asterisks when configured', '/index.html', '*'],
    ['only wraps with underscores when configured', '/index.html', '_'],
    ['only wraps with asterisks by default', '/index.html?defaults', '*']
  ].forEach(([name, page, char]) => {
    it(name, () => {
      cy.visit(page);

      // No autoclose
      type(char);
      cy.get('textarea').should('have.value', char);

      type('{backspace}hello');
      select(0, 5);

      // Wrap
      type(char);
      expectText(`${char}hello${char}`, 1, 6);
    });
  });

  it('does not autopair a backtick inside a code fence when configured', () => {
    cy.visit('/index.html');

    type('```\n`');

    cy.get('textarea').should('have.value', '```\n`');
  });

  it('does not autopair a backtick inside a code span when configured', () => {
    cy.visit('/index.html');

    setText('`code  tail`', 6);
    type('`');

    expectText('`code ` tail`', 7);
  });

  it('autopairs asterisks configured with a different closing character', () => {
    cy.visit(`/index.html?pairs=${encodeURIComponent(JSON.stringify({ '*': '+' }))}`);

    type('*');

    expectText('*+', 1);
  });

  it('autopairs backticks and types through them', () => {
    cy.visit('/index.html?defaults');

    type('`');
    expectText('``', 1);

    type('code`');
    expectText('`code`', 6);
  });

  it('does not autopair a backtick behind a word character', () => {
    cy.visit('/index.html?defaults');

    type('hello`');

    cy.get('textarea').should('have.value', 'hello`');
  });

  it('does not autopair a backtick inside a double-backtick code span', () => {
    cy.visit('/index.html?defaults');

    setText('``code  tail``', 7);
    type('`');

    expectText('``code ` tail``', 8);
  });

  it('types through the closing backticks of a double-backtick code span', () => {
    cy.visit('/index.html?defaults');

    setText('``code``', 6);
    type('`');

    expectText('``code``', 7);
  });

  [
    ['a single-backtick code span', '`code  tail`', 6],
    ['a double-backtick code span', '``code  tail``', 7],
    ['a triple-backtick code span', 'x ```code  tail```', 10],
    ['a triple-backtick code span at the start of a line', '```code  tail```', 8],
    ['a quadruple-backtick code span', 'x ````code  tail````', 11]
  ].forEach(([span, text, caret]) => {
    it(`types two backticks inside ${span} without autopairing`, () => {
      cy.visit('/index.html?defaults');

      setText(text, caret);
      type('``');

      expectText(`${text.slice(0, caret)}\`\`${text.slice(caret)}`, caret + 2);
    });
  });

  it('types a code fence and does not autopair backticks inside it', () => {
    cy.visit('/index.html?defaults');

    type('```\n`');

    cy.get('textarea').should('have.value', '```\n`');
  });

  it('does not treat a code span at the start of a line as a code fence', () => {
    cy.visit('/index.html?defaults');

    setText('```code```\n', 11);
    type('`');

    expectText('```code```\n``', 12);
  });

  it('autopairs a backtick after a code span at the start of a line', () => {
    cy.visit('/index.html?defaults');

    setText('```code``` ', 11);
    type('`');

    expectText('```code``` ``', 12);
  });

  it('types through the closing backticks of a code span at the start of a line', () => {
    cy.visit('/index.html?defaults');

    setText('```code```', 7);
    type('`');

    expectText('```code```', 8);
  });
});
