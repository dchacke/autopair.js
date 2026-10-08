# autopair.js

Lightweight autopairing + typethrough behavior for HTML `input[type=text]` and `textarea`. No dependencies. Preserves the undo/redo stack, including the cursor position.

Behaves like Sublime Text's auto-pairing in Markdown mode.

## Features

1. Automatically closes parentheses, brackets, curly braces, single quotes, double quotes, and backticks.

   Like in Sublime Text, a pair is only closed before whitespace, a closing bracket, or the end of the line. Quotes and backticks are not closed right after a letter or digit, so typing `don't` doesn't add a stray quote. Backticks are not closed inside code spans or fenced code blocks.

   ![Automatically close parentheses](./images/autoclose.gif)

2. Wraps selected text. For example, selecting a word and hitting `(` will wrap the word in parentheses. By default, asterisks and underscores only wrap selected text; they are not closed automatically.

   ![Wrap selected text](./images/wrap.gif)

3. Atomically removes pairings. For example, when hitting backspace inside `()`, both characters are removed.

   ![Atomically remove pairings](./images/remove.gif)

4. Types through closing characters. For example, hitting `)` in front of an already typed `)` simply moves the cursor past it.

   ![Type through closing characters](./images/typethrough.gif)

## Installation

```bash
npm install autopair
```

## Usage

Call `autopair` once per element.

```html
<textarea id="editor"></textarea>

<script type="module">
  import autopair from '/path/to/autopair.js';

  autopair(document.getElementById('editor'));
</script>
```

### Default pairings

```js
{
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"',
  '`': '`',
  '*': '*', // Wrap only
  '_': '_'  // Wrap only
}
```

### Custom pairings

Custom pairings replace the defaults, so include the ones you want to keep. They also override Sublime's Markdown rules: backticks, asterisks and underscores then close automatically like quotes.

```js
autopair(textarea, {
  '(': ')',
  '[': ']',
  '{': '}',
  "'": "'",
  '"': '"',
  '`': '`',
  '*': '*',
  '_': '_',
  '‘': '’', // Curly quotes
  '“': '”'
});
```

### Teardown

`autopair` returns a function that removes autopair.js functionality from the element.

```js
const teardown = autopair(textarea);

teardown();
```

## Contributing

Report issues on the [Veritula issue tracker](https://veritula.com/discussions/autopair-js). Do not submit issues on GitHub.

## Bug bounty program

There’s a [Veritula bug bounty program](https://veritula.com/bounties/10) for autopair.js. Report bugs there, not on GitHub.

## Development

Run a webserver and open `index.html`, which uses custom pairings. Open `index.html?defaults` for the default pairings.
