describe('autopair', () => {
  it('wraps selected text in parentheses when "(" is typed', () => {
    cy.visit('/index.html');

    // Type some text
    cy.get('textarea').type('hello');

    // Select all text
    cy.get('textarea').then($el => {
      $el[0].selectionStart = 0;
      $el[0].selectionEnd = $el.val().length;
    });

    // Type "(" to wrap selection
    cy.get('textarea').type('(');

    // Check result
    cy.get('textarea').should('have.value', '(hello)');
  });

  it('types through closing character', () => {
    cy.visit('/index.html');

    // Type a pair
    cy.get('textarea').type('()');

    // Move cursor between the parentheses
    cy.get('textarea').then($el => {
      $el[0].selectionStart = 1;
      $el[0].selectionEnd = 1;
    });

    // Type ")" to test typethrough
    cy.get('textarea').type(')');

    // Value should be unchanged, cursor moves past
    cy.get('textarea').then($el => {
      expect($el.val()).to.eq('()');
      expect($el[0].selectionStart).to.eq(2); // cursor after )
      expect($el[0].selectionEnd).to.eq(2);
    });
  });

  it('atomically deletes a pair', () => {
    cy.visit('/index.html');

    // Type a pair
    cy.get('textarea').type('()');

    // Move cursor between the parentheses
    cy.get('textarea').then($el => {
      $el[0].selectionStart = 1;
      $el[0].selectionEnd = 1;
    });

    // Press Backspace
    cy.get('textarea').type('{backspace}');

    // Both characters should be deleted
    cy.get('textarea').should('have.value', '');
  });

  it('automatically inserts closing parenthesis when "(" is typed', () => {
    cy.visit('/index.html');

    // Type opening parenthesis
    cy.get('textarea').type('(');

    // Should insert closing parenthesis and place cursor between
    cy.get('textarea').then($el => {
      expect($el.val()).to.eq('()');
      expect($el[0].selectionStart).to.eq(1);
      expect($el[0].selectionEnd).to.eq(1);
    });
  });

  it('autopairs before a whitelisted character', () => {
    cy.visit('/index.html');

    // Type a semicolon
    cy.get('textarea').type(';');

    // Move cursor before the semicolon
    cy.get('textarea').then($el => {
      $el[0].selectionStart = 0;
      $el[0].selectionEnd = 0;
    });

    // Type "("
    cy.get('textarea').type('(');

    // Should autopair
    cy.get('textarea').then($el => {
      expect($el.val()).to.eq('();');
      expect($el[0].selectionStart).to.eq(1);
    });
  });

  it('does not autopair before a non-whitelisted character', () => {
    cy.visit('/index.html');

    // Type a period
    cy.get('textarea').type('.');

    // Move cursor before the period
    cy.get('textarea').then($el => {
      $el[0].selectionStart = 0;
      $el[0].selectionEnd = 0;
    });

    // Type "("
    cy.get('textarea').type('(');

    // Should NOT autopair
    cy.get('textarea').then($el => {
      expect($el.val()).to.eq('(.');
      expect($el[0].selectionStart).to.eq(1);
    });
  });

  it('autopairs multiple opening parentheses correctly', () => {
    cy.visit('/index.html');

    // Type three opening parentheses
    cy.get('textarea').type('(((');

    // Should result in three closing parentheses as well
    cy.get('textarea').then($el => {
      expect($el.val()).to.eq('((()))');
      expect($el[0].selectionStart).to.eq(3); // cursor inside the innermost pair
    });
  });

  it('does not autopair symmetric characters after an existing pair', () => {
    cy.visit('/index.html');

    // Type a single quote
    cy.get('textarea').type("'");

    // Should autopair to ''
    cy.get('textarea').then($el => {
      expect($el.val()).to.eq("''");
      expect($el[0].selectionStart).to.eq(1); // cursor inside
    });

    // Move cursor to the end
    cy.get('textarea').then($el => {
      $el[0].selectionStart = $el.val().length;
      $el[0].selectionEnd = $el.val().length;
    });

    // Type another single quote
    cy.get('textarea').type("'");

    // Should NOT autopair again
    cy.get('textarea').then($el => {
      expect($el.val()).to.eq("'''");
      expect($el[0].selectionStart).to.eq(3); // cursor after last '
    });
  });

  it('handles custom pairing correctly', () => {
    cy.visit('/index.html');

    // Inject autopair immediately
    cy.document().then(doc => {
      const script = doc.createElement('script');
      script.type = 'module';
      script.textContent = `
        import autopair from './autopair.js';
        autopair(document.querySelector('textarea'), {
          '(': ')',
          '[': ']',
          '{': '}',
          "'": "'",
          '"': '"',
          '<': '>'
        });
      `;
      doc.body.appendChild(script);
    });

    // Type <
    cy.get('textarea').type('<');

    // Should autopair to <>
    cy.get('textarea').then($el => {
      expect($el.val()).to.eq('<>');
      expect($el[0].selectionStart).to.eq(1);
    });
  });

  it('supports undo and redo after typing a pair', () => {
    cy.visit('/index.html');

    // Type a pair
    cy.get('textarea').type('()');

    // Undo
    cy.get('textarea').then($el => {
      $el[0].ownerDocument.execCommand('undo');
    });
    cy.get('textarea').should('have.value', '');

    // Redo
    cy.get('textarea').then($el => {
      $el[0].ownerDocument.execCommand('redo');
    });
    cy.get('textarea').should('have.value', '()');
  });
});
