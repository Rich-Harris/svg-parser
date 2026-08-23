# svg-parser

A small, dependency-light SVG parser that turns an SVG string into a JSON-friendly [HAST](https://github.com/syntax-tree/hast) tree.

## Features

- Parses complete SVG documents and standalone SVG elements
- Supports nested and self-closing elements
- Supports quoted, unquoted, empty, and boolean attributes
- Preserves text and CDATA content
- Retains XML declarations, doctypes, and other content before the root `<svg>` element as metadata
- Reports malformed input with line, column, and source context
- Works with ES modules, CommonJS, and browser bundlers

## Installation

```sh
npm install svg-parser
```

## Usage

```js
import { parse } from 'svg-parser';

const tree = parse(`
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="40" />
  </svg>
`);

console.log(tree);
```

The result is a HAST root node:

```js
{
  type: 'root',
  children: [
    {
      type: 'element',
      tagName: 'svg',
      metadata: '\n  ',
      properties: {
        viewBox: '0 0 100 100',
        'aria-hidden': 'true'
      },
      children: [
        {
          type: 'element',
          tagName: 'circle',
          properties: {
            cx: 50,
            cy: 50,
            r: 40
          },
          children: []
        }
      ]
    }
  ]
}
```

Numeric attribute values are converted to numbers. Other attribute values remain strings, and attributes without a value are represented by `true`.

### CommonJS

```js
const { parse } = require('svg-parser');

const tree = parse('<path d="M0 0h10v10z" />');
```

## API

### `parse(source)`

Parses an SVG string and returns a HAST root node whose `children` array contains the parsed top-level element.

```js
const tree = parse('<text>Hello!</text>');
```

Text content is represented by HAST text nodes:

```js
{
  type: 'root',
  children: [
    {
      type: 'element',
      tagName: 'text',
      properties: {},
      children: [{ type: 'text', value: 'Hello!' }]
    }
  ]
}
```

### Parsing behavior

- Whitespace-only text between elements is omitted.
- Comments are ignored.
- CDATA content is added directly to the containing element's `children` array as a string.
- Content before a root `<svg>` element, including an XML declaration or doctype, is available on that element's `metadata` property.
- The parser is designed for input containing one top-level element.

Malformed input throws an `Error` with its zero-based line and column location and a source snippet:

```js
parse('<svg><path></svg>');
// Error: Expected closing tag </svg> to match opening tag <path> (0:16)
//
// <svg><path></svg>
//                 ^
```

Source snippets include at most one surrounding line on each side and are cropped to 80 columns. Ellipses indicate omitted content. Empty or whitespace-only input throws `Error: SVG input is empty`.

## Scope

`svg-parser` is a lightweight, purpose-built parser rather than a validating XML parser or DOM implementation. It is useful when you need a serializable syntax tree for common SVG markup. If you need full XML validation or browser DOM behavior, use a dedicated XML parser instead.

## Development

```sh
npm install
npm test       # build and run the test suite
npm run lint   # check source and formatting
npm run build  # rebuild dist/
```

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting instructions.

## License

MIT
