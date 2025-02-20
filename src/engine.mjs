"use strict";

import { DynamicSymbolTable } from "./dst.mjs";
import { lexer, parser, FormCalculator } from "./interpreter.mjs";

export function calculate(text, host) {
    const lexResult = lexer.tokenize(text);

    let errors = lexResult.errors;;
    let cst;
    let result;

    if ( ! errors?.length) {
        // setting a new input will RESET the parser instance's state
        parser.input = lexResult.tokens;

        // any top level rule may be used as an entry point
        cst = parser.formCalculation();
        errors = parser.errors;

        if ( ! errors?.length) {
            if (typeof(host) === 'undefined') {
                host = new DynamicSymbolTable;
            }

            // @todo inject the host environment
            const calculator = new FormCalculator(host);

            result = calculator.visit(cst);
            errors = calculator.errors;
        }
    }

    return {
        cst: cst,
        errors: errors,
        result: result
    };
}
