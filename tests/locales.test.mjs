"use strict";

import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { DynamicSymbolTable } from "../src/dst.mjs";
import { lexer, parser, FormCalculator } from "../src/interpreter.mjs";

describe('locales', () => {
  [
    [1, 'de'],
    [0, 'sv'],
  ].forEach((element) => it(`locales#${element[1]}`, () => {
    const lexResult = lexer.tokenize('"ä" < "z"');

    parser.input = lexResult.tokens;

    const cst = parser.formCalculation();
    const calculator = new FormCalculator(new DynamicSymbolTable(element[1]));
    const result = calculator.visit(cst);

    assert.strictEqual(result, element[0]);
  }))
});
