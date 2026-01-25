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
    cy.get('textarea').then($el => {
      expect($el.val()).to.eq('(hello)');
      expect($el[0].selectionStart).to.eq(1);
      expect($el[0].selectionEnd).to.eq(6);
    });
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
      expect($el[0].selectionEnd).to.eq(1);
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
      expect($el[0].selectionEnd).to.eq(1);
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
      expect($el[0].selectionEnd).to.eq(3);
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
      expect($el[0].selectionEnd).to.eq(1);
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
      expect($el[0].selectionEnd).to.eq(3);
    });
  });

  it('autopairs existing custom quotes “ and ”', () => {
    cy.visit('/index.html');

    // Type opening custom quote
    cy.get('textarea').type('“');

    // Should autopair to “”
    cy.get('textarea').then($el => {
      expect($el.val()).to.eq('“”');
      expect($el[0].selectionStart).to.eq(1); // cursor inside
      expect($el[0].selectionEnd).to.eq(1);
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

  it('does not autopair a symmetric character behind a word character', () => {
    cy.visit('/index.html');

    cy.get('textarea').type('hello');
    cy.get('textarea').type("'");

    cy.get('textarea').then($el => {
      expect($el.val()).to.eq("hello'");
      expect($el[0].selectionStart).to.eq(6);
      expect($el[0].selectionEnd).to.eq(6);
    });
  });

  it('does autopair a symmetric character behind a non-word character', () => {
    cy.visit('/index.html');

    cy.get('textarea').type('hello.');
    cy.get('textarea').type("'");

    cy.get('textarea').then($el => {
      expect($el.val()).to.eq("hello.''");
      expect($el[0].selectionStart).to.eq(7);
      expect($el[0].selectionEnd).to.eq(7);
    });
  });

  it('does autopair a symmetric character behind a newline', () => {
    cy.visit('/index.html');

    cy.get('textarea').type('\n');
    cy.get('textarea').type("'");

    cy.get('textarea').then($el => {
      expect($el.val()).to.eq("\n''");
      expect($el[0].selectionStart).to.eq(2);
      expect($el[0].selectionEnd).to.eq(2);
    });
  });

  it('does autopair an asymmetric character behind a word character', () => {
    cy.visit('/index.html');

    cy.get('textarea').type('hello');
    cy.get('textarea').type("(");

    cy.get('textarea').then($el => {
      expect($el.val()).to.eq("hello()");
      expect($el[0].selectionStart).to.eq(6);
      expect($el[0].selectionEnd).to.eq(6);
    });
  });
 });
