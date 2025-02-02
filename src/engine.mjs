"use strict";

import { DynamicSymbolTable } from "./dst.mjs";
import { FormCalculator, parseFormCalc } from "./interpreter.mjs";

let locales;
/*
const locales = typeof(navigator) == 'undefined'
    ? (new Intl.ListFormat).resolvedOptions().locale
    : navigator?.languages || navigator.language;
*/

const calculator = new FormCalculator(new DynamicSymbolTable, locales);

export function calculate(text) {
    const cst = parseFormCalc(text);
    const result = calculator.visit(cst);

    console.log(result);

    return result;
};
