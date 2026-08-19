# svg-parser changelog

## 2.0.5 (2026-08-19)

**svg-parser is alive again!** After a long quiet period, maintenance has resumed with refreshed tooling and a modern release process.

- Add continuous integration across every supported Node.js release, from Node.js 8 through Node.js 24.
- Add trusted npm publishing with package provenance.
- Replace the legacy build and lint toolchain with tsdown, oxlint, and oxfmt.
- Update the documentation with clearer installation, usage, output, and API examples.
- Update development dependencies and override vulnerable transitive dependencies while retaining Node.js 8 compatibility for package consumers.

There are no intentional parser API or behavior changes in this patch release.

## 2.0.3

- Fix reported error location ([#9](https://github.com/Rich-Harris/svg-parser/issues/9))

## 2.0.2

- Allow underscores in attribute names ([#4](https://github.com/Rich-Harris/svg-parser/issues/4))

## 2.0.1

- Fix empty/space attributes

## 2.0.0

- Migrate to HAST

## 1.0.6

- Remove unused dependency

## 1.0.5

- Handle doctype and CDATA

## 1.0.4

- Handle unexpected end of input

## 1.0.3

- Prevent infinite loops on bad final closing tag

## 1.0.2

- Prevent `""=true` attributes

## 1.0.1

- Allow attributes with numbers (e.g. `x1`)
- Fix error messages

## 1.0.0

- First release
