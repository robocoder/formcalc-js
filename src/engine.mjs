"use strict";

import { DynamicSymbolTable } from "./dst.mjs";
import { allTokens, Lexer } from "./lexer.mjs";
import { Parser } from "./parser.mjs";
import { factory } from "./interpreter.mjs";

export class FormCalcEngine {
    constructor(host) {
        const $ = this;

        $.host = host;
        // @todo skipValidations: true
        $.lexer = new Lexer(allTokens, {traceInitPerf: false, skipValidations: false, ensureOptimizations: true, recoveryEnabled: false});
        $.parser = new Parser(allTokens, {traceInitPerf: false, skipValidations: false, outputCst: true});
        $.calculator = factory($.parser, $.host);
    }

    calculate(text) {
        const $ = this;

        $.host.reset();

        return $.#evaluate(text);
    }

    #evaluate(text) {
        const $ = this;
        const lexResult = $.lexer.tokenize(text);

        let errors = lexResult.errors;;
        let cst;
        let value;

        if ( ! errors?.length) {
            // setting a new input will RESET the parser instance's state
            $.parser.input = lexResult.tokens;

            // any top level rule may be used as an entry point
            cst = $.parser.formCalculation();
            errors = $.parser.errors;

            if ( ! errors?.length) {
                value  = $.calculator.visit(cst);
                errors = $.calculator.errors;
            }
        }

        return {
            cst: cst,
            errors: errors,
            value: value
        };
    }
}

export function calculate(text, host) {
    if (typeof(host) === 'undefined') {
        host = new DynamicSymbolTable;
    }

    const engine = new FormCalcEngine(host);

    return engine.calculate(text);
}
