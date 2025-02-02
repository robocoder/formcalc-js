# Lexer-Parser

## Status

Accepted

## Context

The first step is implementing a lexer and parser for the XFA-FormCalc grammar.

## Decision

Realistically, we have two choices:
* write our own recursive-descent parser from scratch
* generate a lexer/parser from an EBNF grammar

We've done the first before. It was an interesting exercise but not fun. So, going with the second option, we selected [Chevrotain](https://github.com/Chevrotain/chevrotain).

Chevrotain is a "Parser Building Toolkit" that allows us to develop the lexer and parser using JavaScript.

## Consequences

There may be "better" parser generators, libraries, etc out there but Chevrotain ticks a lot of our checkboxes. As a developer, we like:

* ready-to-use component (i.e., `import`) that doesn't require setting up the build toolchain
* [performant](https://chevrotain.io/performance/) code
* adequate [documentation](https://chevrotain.io/docs/) and examples to hit the ground running
* active development and maintenance

The only downside is chevrotain's distribution currently hovers around 137 kB (minified). There are/were efforts to reduce the footprint size:

* [Smaller web bundle size](https://github.com/Chevrotain/chevrotain/issues/1697)
* [Extract diagrams to a separate sub-package](https://github.com/Chevrotain/chevrotain/issues/1395)
