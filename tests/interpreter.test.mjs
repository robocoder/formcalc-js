"use strict";

import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { DynamicSymbolTable } from "../src/dst.mjs";
import { lexer, parser, FormCalculator } from "../src/interpreter.mjs";

// helpers for data-driven tests
function expectEquals(expected, data) {
  const lexResult = lexer.tokenize(data);

  parser.input = lexResult.tokens;

  const cst = parser.formCalculation();
  const calculator = new FormCalculator(new DynamicSymbolTable);
  const result = calculator.visit(cst);

  assert.strictEqual(result, expected);
}

function expectThrows(expected, data) {
  const lexResult = lexer.tokenize(Array.isArray(data) ? data[0] : data);

  parser.input = lexResult.tokens;

  const cst = parser.formCalculation();
  const calculator = new FormCalculator(new DynamicSymbolTable);

  assert.throws(() => { calculator.visit(cst) }, expected);
}

describe('whitespace and comments', () => {
  let u;

  // non-conforming
  [
    [u, ''],
  ].forEach((element, i) => it(`it handles nul string#${i}`, () => expectEquals(element[0], element[1])));

  [
    [u, ' '],
    [u, '\n'],
    [u, '\r'],
    [u, '\t'],
    [u, '\f'],
  ].forEach((element, i) => it(`skips varied whitespace#${i}`, () => expectEquals(element[0], element[1])));

  [
    [u, '; comment'],
    [u, '// comment'],
    [u, '  ; comment'],
    [u, '  // comment'],
    [u, '; comment  '],
    [u, '// comment  '],
    [u, '  ; comment  '],
    [u, '  // comment  '],
  ].forEach((element, i) => it(`parses one line comments#${i}`, () => expectEquals(element[0], element[1])));
});

describe('literals', () => {
  [
    [1, '1'],
    [-1, '-1'],
    [100, '1e+2'],
    [100, '1e2'],
    [2, '2e+0'],
    [2, '2e0'],
    [2, '2e-0'],
    [0.1, '1e-1'],
    [-2.22, '-22.2e-1'],
    [-2.3, '-.23e+1'],
    [-230, '-23.e+1'],
  ].forEach((element, i) => it(`NumberLiteral#${i}`, () => expectEquals(element[0], element[1])));

  const backslash = String.fromCodePoint(92);

  [
    ['foo', '"foo"'],
    ['foo"bar', '"foo""bar"'],
    ['無名', '"' + backslash + 'u7121' + backslash + 'u540D"'],
  ].forEach((element, i) => it(`StringLiteral#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, 'true'],
    [0, 'false'],
  ].forEach((element, i) => it(`Boolean#${i}`, () => expectEquals(element[0], element[1])));

  [
    [null, 'null'],
  ].forEach((element, i) => it(`null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [Number.POSITIVE_INFINITY, 'infinity'],
  ].forEach((element, i) => it(`infinity#${i}`, () => expectEquals(element[0], element[1])));

  [
    [Number.NaN, 'NAN'],
  ].forEach((element, i) => it(`NaN#${i}`, () => expectEquals(element[0], element[1])));
});

describe('var declarations', () => {
  [
    ['', 'var a'],
  ].forEach((element, i) => it(`with declarations only#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, 'var a = 1'],
    [3, 'var a = 1 + 2'],
  ].forEach((element, i) => it(`with assignments#${i}`, () => expectEquals(element[0], element[1])));

  [
    'a',
  ].forEach((element, i) => it(`not in scope#${i}`, () => expectThrows(/not found/i, element)));
});

describe('functions', () => {
  let u;

  [
    [u, 'func foo () do endfunc'],
  ].forEach((element, i) => it(`declaration only#${i}`, () => expectEquals(element[0], element[1])));

  [
    [u, 'func foo () do endfunc foo()'],
    [1, 'func foo () do 1 endfunc foo()'],
    [4, 'func foo (p) do 2 * p endfunc foo(2)'],
    [6, 'func foo (p) do 2 * p 3 * p endfunc foo(2)'],
  ].forEach((element, i) => it(`declare and call#${i}`, () => expectEquals(element[0], element[1])));

  [
    [9, 'func foo (p) do 2 * p 3 * p endfunc foo(2 + 1)'],
  ].forEach((element, i) => it(`evaluates arguments#${i}`, () => expectEquals(element[0], element[1])));

  [
    [10, `var a = 1
          var b = 2
          var c = 3
          func foo(a, b) do
            a + b + c
          endfunc
          foo(3, 4)`],
    [10, `var a = 1
          var b = 2
          var c = 3
          func foo(a, b) do
            a + b + c
            return
            a * b * c
          endfunc
          foo(3, 4)`],
    [12, `var a = 1
          var b = 2
          var c = 3
          func foo(a, b) do
            a + b + c
            12
          endfunc
          foo(3, 4)`],
    [12, `var a = 1
          var b = 2
          var c = 3
          func foo(a, b) do
            a + b + c
            a = 12
          endfunc
          foo(3, 4)`],
    [1,  `var a = 1
          var b = 2
          var c = 3
          func foo(a, b) do
            a + b + c
            a = 12
          endfunc
          foo(3, 4)
          a`],
  ].forEach((element, i) => it(`scope#${i}`, () => expectEquals(element[0], element[1])));

  [
    [4, 'func foo (p) do 2 * p return 3 * p endfunc foo(2)'],
  ].forEach((element, i) => it(`early return#${i}`, () => expectEquals(element[0], element[1])));

  [
    'foo("bar")',
  ].forEach((element, i) => it(`undeclared function#${i}`, () => expectThrows(/not found/, element)));

  [
    'return',
    `while (1) do
       return
       break
     endwhile`,
  ].forEach((element, i) => it(`unexpected return#${i}`, () => expectThrows(/outside of function/, element)));
});

describe('logical or', () => {
  [
    [null, 'null | null'],
    [null, 'null or null'],
  ].forEach((element, i) => it(`both operands are null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, 'null | 1'],
    [1, '1 | null'],
    [1, 'null or true'],
    [1, 'true or null'],
    [0, 'null | 0'],
    [0, '0 | null'],
    [0, 'null or false'],
    [0, 'false or null'],
  ].forEach((element, i) => it(`one of the operands is null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, '0 or 0'],
    [1, '1 or 0'],
    [1, '0 or 1'],
    [1, '1 or 1'],
    [0, '0 | 0'],
    [1, '1 | 0'],
    [1, '0 | 1'],
    [1, '1 | 1'],
    [1, '0 | 100'],
    [1, '100 | 100'],
  ].forEach((element, i) => it(`none of the operands are null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, '0 | nan'],
    [0, '0 | infinity'],
    [1, '1 | nan'],
    [1, '1 | infinity'],
    [1, '0 | "1"'],
    [1, '"1" or 0'],
  ].forEach((element, i) => it(`promote operand to number#${i}`, () => expectEquals(element[0], element[1])));
});

describe('logical and', () => {
  [
    [null, 'null & null'],
    [null, 'null and null'],
  ].forEach((element, i) => it(`both of the operands are null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, 'null & 1'],
    [0, '1 & null'],
    [0, 'null and true'],
    [0, 'true and null'],
    [0, 'null & 0'],
    [0, '0 & null'],
    [0, 'null and false'],
    [0, 'false and null'],
  ].forEach((element, i) => it(`one of the operands is null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, '0 and 0'],
    [0, '1 and 0'],
    [0, '0 and 1'],
    [1, '1 and 1'],
    [0, '0 & 0'],
    [0, '1 & 0'],
    [0, '0 & 1'],
    [1, '1 & 1'],
    [0, '0 & 100'],
    [1, '100 & 100'],
  ].forEach((element, i) => it(`none of the operands are null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, '0 & nan'],
    [0, '0 & infinity'],
    [0, '1 & nan'],
    [0, '1 & infinity'],
    [0, '0 & "1"'],
    [0, '"1" and 0'],
  ].forEach((element, i) => it(`promote operand to number#${i}`, () => expectEquals(element[0], element[1])));
});

describe('equality', () => {
  [
    [1, 'null eq null'],
    [1, 'null == null'],
    [0, 'null ne null'],
    [0, 'null <> null'],
  ].forEach((element, i) => it(`both of the operands are null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, 'null eq true'],
    [0, 'null eq false'],
    [0, 'null eq 1'],
    [0, 'null eq 0'],
  ].forEach((element, i) => it(`one of the operands is null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, '"test" eq "test"'],
    [1, '"test" == "test"'],
    [0, '"test" ne "test"'],
    [0, '"test" <> "test"'],
    [0, '"tset" eq "test"'],
    [0, '"tset" == "test"'],
    [1, '"tset" ne "test"'],
    [1, '"tset" <> "test"'],
    [0, '"1" eq "1.0"'],
  ].forEach((element, i) => it(`string operands#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, '1 == 1.0'],
    [1, '1 eq 0.000000000000001e15'],
    [1, '1 <> 0'],
    [1, '1 ne 0'],
    [0, '2 eq 3'],
    [0, '1 == 0'],
    [0, '1 ne 1'],
    [0, '0 <> 0'],
  ].forEach((element, i) => it(`numeric operands#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, '1 == "1"'],
    [1, '0 == "abc"'],
  ].forEach((element, i) => it(`promote operands to numbers#${i}`, () => expectEquals(element[0], element[1])));
});

describe('relational', () => {
  [
    [1, 'null le null'],
    [1, 'null <= null'],
    [1, 'null ge null'],
    [1, 'null >= null'],
    [0, 'null lt null'],
    [0, 'null <  null'],
    [0, 'null gt null'],
    [0, 'null >  null'],
  ].forEach((element, i) => it(`both of the operands are null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, '1 le null'],
    [0, '1 <= null'],
    [1, '1 ge null'],
    [1, '1 >= null'],
    [0, '1 lt null'],
    [0, '1 <  null'],
    [1, '1 gt null'],
    [1, '1 >  null'],
    [1, 'null le 1'],
    [1, 'null <= 1'],
    [0, 'null ge 1'],
    [0, 'null >= 1'],
    [1, 'null lt 1'],
    [1, 'null <  1'],
    [0, 'null gt 1'],
    [0, 'null >  1'],
  ].forEach((element, i) => it(`one of the operands is null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, '"test" le "test"'],
    [1, '"test" <= "test"'],
    [1, '"test" ge "test"'],
    [1, '"test" >= "test"'],
    [0, '"test" lt "test"'],
    [0, '"test" <  "test"'],
    [0, '"test" gt "test"'],
    [0, '"test" >  "test"'],
    [0, '"tset" le "test"'],
    [0, '"tset" <= "test"'],
    [1, '"tset" ge "test"'],
    [1, '"tset" >= "test"'],
    [0, '"tset" lt "test"'],
    [0, '"tset" <  "test"'],
    [1, '"tset" gt "test"'],
    [1, '"tset" >  "test"'],
    [1, '"2" > "100"'],
  ].forEach((element, i) => it(`string operands#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, '1 <= 0'],
    [1, '1 <= 1'],
    [1, '1 <= 2'],
    [0, '1 le 0'],
    [1, '1 le 1'],
    [1, '1 le 2'],
    [0, '1 < 0'],
    [0, '1 < 1'],
    [1, '1 < 2'],
    [0, '1 lt 0'],
    [0, '1 lt 1'],
    [1, '1 lt 2'],
    [0, '0 >= 1'],
    [1, '1 >= 1'],
    [1, '2 >= 1'],
    [0, '0 ge 1'],
    [1, '1 ge 1'],
    [1, '2 ge 1'],
    [0, '0 > 1'],
    [0, '1 > 1'],
    [1, '2 > 1'],
    [0, '0 gt 1'],
    [0, '1 gt 1'],
    [1, '2 gt 1'],
  ].forEach((element, i) => it(`numeric operands#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, '0 <= "abc"'],
    [1, '1 > "abc"'],
    [0, '1 >= "2"'],
    [1, '1 < "2"'],
    [0, '"true" < "false"'],
    ].forEach((element, i) => it(`promote operands to numbers#${i}`, () => expectEquals(element[0], element[1])));
});

describe('additive', () => {
  [
    [null, 'null + null'],
    [null, 'null - null'],
  ].forEach((element, i) => it(`both of the operands are null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, 'null + 1'],
    [1, '1 + null'],
    [-1, 'null - true'],
    [1, 'true - null'],
    [0, 'null + 0'],
    [0, '0 + null'],
    [0, 'null - false'],
    [0, 'false - null'],
  ].forEach((element, i) => it(`one of the operands is null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, '0 - 0'],
    [1, '1 - 0'],
    [-1, '0 - 1'],
    [0, '1 - 1'],
    [0, '0 + 0'],
    [1, '1 + 0'],
    [1, '0 + 1'],
    [2, '1 + 1'],
    [100, '0 + 100'],
    [200, '100 + 100'],
  ].forEach((element, i) => it(`none of the operands are null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, '0 + nan'],
    [0, '0 + infinity'],
    [1, '1 + nan'],
    [1, '1 + infinity'],
    [1, '0 + "1"'],
    [1, '"1" - 0'],
  ].forEach((element, i) => it(`promote operand to number#${i}`, () => expectEquals(element[0], element[1])));
});

describe('multiplicative', () => {
  [
    [null, 'null * null'],
    [null, 'null / null'],
  ].forEach((element, i) => it(`both of the operands are null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, 'null * 0'],
    [0, 'null * 1'],
    [0, 'null * false'],
    [0, '0 * null'],
    [0, '1 * null'],
    [0, 'true * null'],
    [0, 'null / 1'],
    [0, 'null / true'],
  ].forEach((element, i) => it(`one of the operands is null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, '0 * 1'],
    [6, '2 * 3'],
    [3, '0.5 * 6'],
    [4, '8. * .5'],
    [2.5, '5 * .5'],
    [-2.5, '-5 * .5'],
    [-2.5, '5 * -.5'],
    [2.5, '-5 * -.5'],
    [4, '8 / 2'],
    [3, '6.0 / 2.'],
    [1.5, '3. / 2'],
    [-1.5, '-3. / 2'],
    [-1.5, '3. / -2'],
    [1.5, '-3. / -2'],
    [1, '1 / 1'],
    [0, '0 / 1'],
  ].forEach((element, i) => it(`none of the operands are null#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, '0 * nan'],
    [0, '0 * infinity'],
    [0, '1 * nan'],
    [0, '1 * infinity'],
    [20, '2 * "10"'],
    [5, '"10" / 2'],
  ].forEach((element, i) => it(`promote operand to number#${i}`, () => expectEquals(element[0], element[1])));

  [
    '1 / 0',
    '1 / false',
    '1 / null',
    '1 / nan',
    '1 / infinity',
  ].forEach((element, i) => it(`divide by falsy#${i}`, () => expectThrows(/divide by zero/i, element)));
});

describe('unary', () => {
  [
    [null, '-null'],
    [null, '+null'],
    [1, 'not null'],
  ].forEach((element, i) => it(`operand is null#${i}}`, () => expectEquals(element[0], element[1])));

  [
    [-17, '-(17)'],
    [17, '-(-17)'],
    [17, '+(17)'],
    [-17, '+(-17)'],
    [0, 'not(1)'],
    [2, '- -2'],
    [-2, '+ -2'],
    [-2, '- +2'],
    [-2, '- 2'],
    [1, 'not false'],
    [0, 'not true'],
  ].forEach((element, i) => it(`numeric operand#${i}`, () => expectEquals(element[0], element[1])));

  [
    [-2, '-"2"'],
    [2, '-"-2"'],
    [-2, '+"-2"'],
    [2, '+"+2"'],
    [1, 'not "0"'],
    [0, 'not "1"'],
    [1, 'not "abc"'],
    [1, 'not("true")'],
  ].forEach((element, i) => it(`promote operand to number#${i}`, () => expectEquals(element[0], element[1])));
});

// operators in order from highest precedence to lowest precedence:
//   =
//   (unary) - + not
//    * /
//   + -
//   < <= > >= lt le gt ge
//   == <> eq ne
//   & and
//   | or
describe('operator precedence', () => {
  [
    [6, '1 + 2 + 3'],
    [-4, '1 - 2 - 3'],
    [2, '1 - 2 + 3'],
    [6, '1 * 2 * 3'],
    [1.5, '1 / 2 * 3'],
    [7, '1 + 2 * 3'],
    [7, '1 + 3 * 2'],
    [7, '2 * 3 + 1'],
    [7, '3 * 2 + 1'],
    [9, '(1 + 2) * 3'],
    [6.8, '2 * 3 + 4 / 5'],
    [2.8, '2 * (3 + 4) / 5'],
    [7.6, '2 * (3 + 4 / 5)'],
    [2, '(2 * 3 + 4) / 5'],
    [-5.2, '-2 * 3 + 4 / 5'],
    [-2.8, '-2 * (3 + 4) / 5'],
    [-7.6, '-2 * (3 + 4 / 5)'],
    [-0.4, '(-2 * 3 + 4) / 5'],
    [-2, '-(2 * 3 + 4) / 5'],
    [-5.2, '2 * -3 + 4 / 5'],
    [0.4, '2 * (-3 + 4) / 5'],
    [-4.4, '2 * (-3 + 4 / 5)'],
    [-0.4, '(2 * -3 + 4) / 5'],
  ].forEach((element, i) => it(`simple arithmetic expression#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, '0 and 1 or 2 > 1'],
    [1, '(0 and 1) or (2 > 1)'],
    [0, '2 < 3 not 1 == 1'],
    [0, '(2 < 3) not (1 == 1)'],
  ].forEach((element, i) => it(`logical expression#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, '5 + 5 == "10"'],
    [0, '5 + 5 <> "10"'],
  ].forEach((element, i) => it(`equality, relational#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, `
        var a
        var b

        a = 2 * 3 + 4 - 5 / 6 <= 7 == 6 - -1 & 0 or 1 + b = 2
    `],
  ].forEach((element, i) => it(`convoluted#${i}`, () => expectEquals(element[0], element[1])));
});

describe('do', () => {
  let u;

  [
    [u, 'do end'],
    [u, `do
         ; comment
         end`],
    [u, `do
         // comment
         end`],
  ].forEach((element, i) => it(`empty expressionList#${i}`, () => expectEquals(element[0], element[1])));

  [
    ['', 'do var i end'],
    [1, 'do var i = 1 end'],
    [2, 'do 2 end'],
  ].forEach((element, i) => it(`simple expressionList#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, `var a = 1
         do
           var a = 2
         end
         a`],
    [2, `var a = 1
         do
           a = 2
         end
         a`],
  ].forEach((element, i) => it(`scope#${i}`, () => expectEquals(element[0], element[1])));

  [
    `var a = 1
     do
       var b = 2
     end
     b`,
  ].forEach((element, i) => it(`not in scope#${i}`, () => expectThrows(/not found/i, element)));
});

describe('if', () => {
  let u;

  // non-conforming
  // spec says that the value of the entered expression list is returned; in the case of else but no else-part, return 0
  // implementer's note: ignoring given that we allow for empty expressionList; if you want a zero, be explicit
  [
    [u, `if (0) then
         endif`],
    [u, `if (0) then
           1
         endif`],
    [u, `if (false) then
           1
         elseif (1 - 1) then
           2
         endif`],
    [u, `if (false) then
           1
         elseif (1 - 1) then
           2
         else
         endif`],
  ].forEach((element, i) => it(`unreachables#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, `var a = 0
         if (a == 0) then
           1
         elseif (a > 0) then
           2
         else
           3
         endif`],
    [2, `var a = 1
         if (a == 0) then
           1
         elseif (a > 0) then
           2
         else
           3
         endif`],
    [3, `var a = -1
         if (a == 0) then
           1
         elseif (a > 0) then
           2
         else
           3
         endif`],
  ].forEach((element, i) => it(`reachables#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, `var a = 0
         if (a == 0) then
           a = 1
         elseif (a > 0) then
           a = 2
         else
           a = 3
         endif
         a`],
    [2, `var a = 1
         if (a == 0) then
           a = 1
         elseif (a > 0) then
           a = 2
         else
           a = 3
         endif
         a`],
    [3, `var a = -1
         if (a == 0) then
           a = 1
         elseif (a > 0) then
           a = 2
         else
           a = 3
         endif
         a`],
    [0, `var a = 0
         if (a == 0) then
           var a = 1
         elseif (a > 0) then
           var a = 2
         else
           var a = 3
         endif
         a`],
    [1, `var a = 1
         if (a == 0) then
           var a = 1
         elseif (a > 0) then
           var a = 2
         else
           var a = 3
         endif
         a`],
    [-1, `var a = -1
          if (a == 0) then
            var a = 1
          elseif (a > 0) then
            var a = 2
          else
            var a = 3
          endif
          a`],
  ].forEach((element, i) => it(`scope#${i}`, () => expectEquals(element[0], element[1])));
});

describe('while', () => {
  let u;

  [
    [u, `while (false) do
           20
         endwhile`],
  ].forEach((element, i) => it(`never enters#${i}`, () => expectEquals(element[0], element[1])));

  [
    [0, `var a = 2
         while (a > 0) do
           a = a - 1
         endwhile`],
    [3, `var a = 2
         while (a > 0) do
           a = a - 1
         endwhile
         3`],
    [4, `var a = 2
         while (a > 0) do
           a = a - 1
           if (a == 0) then
             a = -1
           endif
           4
         endwhile`],
  ].forEach((element, i) => it(`loops#${i}`, () => expectEquals(element[0], element[1])));

  [
    // non-conforming
    // spec says the value of the continue expression is always the value zero
    [-1, `var a = 2
          while (a > 0) do
            a = a - 1
            if (a == 0) then
              a = -1
              continue
            endif
            4
          endwhile`],
    // non-conforming
    // spec says the value of the break expression is always the value zero
    [1, `var a = 2
         while (a > 0) do
           a = a - 1
           if (a == 1) then
             true
             break
           endif
           false
         endwhile`],
    // implementer's note: conformant termination of above loop would entail more steps, e.g.,
    [1, `var a = 2
         var found
         while (a > 0) do
           a = a - 1
           if (a == 1) then
             found = true
             break
           endif
           found = false
         endwhile
         found`],
  ].forEach((element, i) => it(`interrupted loops#${i}`, () => expectEquals(element[0], element[1])));
});

describe('for', () => {
  let u;

  [
    [u, `for var i = 0 upto -1 step 1 do
            i
          endfor`],
    [u,  `for var i = 10 downto 20 step -1 do
            i
          endfor`],
  ].forEach((element, i) => it(`never enters#${i}`, () => expectEquals(element[0], element[1])));

  [
    [10, `for var i = 0 upto 10 step 1 do
            i
          endfor`],
    [0,  `for var i = 10 downto 0 step -1 do
            i
          endfor`],
  ].forEach((element, i) => it(`loops#${i}`, () => expectEquals(element[0], element[1])));

  [
    [4, `for var i = 0 upto 10 step 1 do
           if (i == 5) then
              break
           endif
           i
         endfor`],
    [6, `var i
         for i = 10 downto 0 step -1 do
           if (i == 5) then
               break
           endif
           i
         endfor`],
    [1, `var i
         for i = 10 downto 0 step -1 do
           if (i == 0) then
               continue
           endif
           i
         endfor`],
  ].forEach((element, i) => it(`interrupted loop#${i}`, () => expectEquals(element[0], element[1])));

  [
    // non-conforming?
    `for var i = 0 upto 10 step -1 do
       ; nothing
     endfor`,
    `for var i = 10 downto 0 step 1 do
       ; nothing
     endfor`,
  ].forEach((element, i) => it(`guards#${i}`, () => expectThrows(/must be a (positive|negative) value/i, element)));

  [
    `func foo() do
       break
     endfunc
     for var i = 0 upto 101 do
       foo()
     endfor`,
    `func foo() do
       continue
     endfunc
     for var i = 10 downto 0  do
       foo()
     endfor`,
  ].forEach((element, i) => it(`unexpected break/continue#${i}`, () => expectThrows(/outside of loop/, element)));
});

describe('foreach', () => {
  let u;

  [
    [u,  `func foo() do endfunc
          foreach i in ( foo() ) do
            i
          endfor`],
    [u,  `func foo() do endfunc
          foreach i in ( foo() ) do
            throw 42
          endfor`],
  ].forEach((element, i) => it(`never enters#${i}`, () => expectEquals(element[0], element[1])));

  [
    [42, `foreach i in ( 42 ) do
            i
          endfor`],
    [3,  `func foo() do 3 endfunc
          var bar = 1
          foreach i in ( "a", "b", bar, 2 + 2, foo() ) do
            i
          endfor`],
  ].forEach((element, i) => it(`loops#${i}`, () => expectEquals(element[0], element[1])));

  [
    [1, `func foo() do 3 endfunc
         var bar = 1
         foreach i in ( "a", "b", bar, 2 + 2, foo() ) do
           if (i < 3) then
             continue
           elseif (i > 3) then
             break;
           endif
           i
         endfor`],
    [4, `func foo() do 3 endfunc
         var bar = 1
         foreach i in ( "a", "b", bar, 2 + 2, foo() ) do
           if (i < 3) then
             continue
           elseif (i > 3) then
             i
             break;
           endif
           i
         endfor`],
  ].forEach((element, i) => it(`interrupted loops#${i}`, () => expectEquals(element[0], element[1])));
});

describe('exit', () => {
  let u;

  [
    [u,  'exit'],
    [u,  `// comment
          exit`],
    ['', `var a
          exit`],
    [2,  '2 exit'],
  ].forEach((element, i) => it(`data set#${i}`, () => expectEquals(element[0], element[1])));
});
