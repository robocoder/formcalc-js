"use strict";

import { DynamicSymbolTable } from "./dst.mjs";
import { allTokens, Lexer } from "./lexer.mjs";
import { Parser } from "./parser.mjs";
import { factory } from "./interpreter.mjs";

export class FormCalcEngine {
    constructor(host, lexerOptions, parserOptions) {
        const $ = this;

        $.host = host;
        $.lexer = new Lexer(allTokens, lexerOptions);
        $.parser = new Parser(allTokens, parserOptions);
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

        let errors = lexResult.errors;
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

export function calculate(text, host, lexerOptions, parserOptions) {
    if (typeof(host) === 'undefined') {
        host = new DynamicSymbolTable;
    }

    if (typeof(lexerOptions) === 'undefined') {
        // @todo skipValidations: true
        lexerOptions = {traceInitPerf: false, skipValidations: false, ensureOptimizations: true, recoveryEnabled: false};
    }

    if (typeof(parserOptions) === 'undefined') {
        // @todo skipValidations: true
        parserOptions = {traceInitPerf: false, skipValidations: false, outputCst: true};
    }

    const engine = new FormCalcEngine(host, lexerOptions, parserOptions);

    return engine.calculate(text);
}
