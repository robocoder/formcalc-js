"use strict";

import * as FormCalc from "./parser.mjs";

// wrapping it all together

const lexer = new FormCalc.Lexer(FormCalc.allTokens, {traceInitPerf: false, skipValidations: false, ensureOptimizations: true, recoveryEnabled: false});
const parser = new FormCalc.Parser(FormCalc.allTokens, {traceInitPerf: false, skipValidations: false, outputCst: true});

export function parseFormCalc(text) {
    const lexResult = lexer.tokenize(text);

    // setting a new input will RESET the parser instance's state
    parser.input = lexResult.tokens;

    // any top level rule may be used as an entry point
    const cst = parser.formCalculation();

    /*
    console.log(cst);
    console.log(lexResult.errors);
    console.log(parser.errors);
    */

    if (lexResult.errors?.length) {
        throw new Error('Tokenization failed: ' + lexResult.errors[0].message);
    }

    if (parser.errors?.length) {
        throw new Error('Parsing failed: ' + parser.errors[0].message);
    }

    return cst;
}

const BaseVisitor = parser.getBaseCstVisitorConstructor();

// on 'exit'
class FormCalcExit extends Error {}

// on 'return'
class FormCalcReturn extends Error {}

// on 'continue'
class FormCalcContinue extends Error {}

// on 'break'
class FormCalcBreak extends Error {}

// evaluate formCalculation
export class FormCalculator extends BaseVisitor {
    constructor(environment, locales) {
        super();

        this.env = environment;
        this.locales = locales;

        this.validateVisitor();
    }

    formCalculation(ctx) {
        this.env.reset();
        const s = this.env.push();

        try {
            this.env.poke(this.visit(ctx.expressionList));
        } catch (err) {
            if ( ! (err instanceof FormCalcExit)) {
                throw err;
            }
        }

        return this.env.pop(s);
    }

    expressionList(ctx) {
        ctx.expression?.forEach((_) => {
            this.env.poke(this.visit(_));
        });

        return this.env.peek();
    }

    expression(ctx) {
        for (let _ in ctx) {
            switch (_) {
                case 'Break':
                    throw new FormCalcBreak;

                case 'Continue':
                    throw new FormCalcContinue;

                case 'Return':
                    throw new FormCalcReturn;

                case 'Exit':
                    throw new FormCalcExit;

                case 'Throw':
                    throw new Error('FormCalc exception', { cause: this.visit(ctx[_]) });
            }

            this.env.poke(this.visit(ctx[_]));
        }

        return this.env.peek();
    }

    simpleExpression(ctx) {
        return this.binaryExprUtility(ctx, 'logicalAndExpression', 'LogicalOrOperator', (lhs, operator, rhs) => {
            if (lhs == null && rhs == null) {
                return null;
            }

            lhs = this.promoteAnyToNumber(lhs);
            rhs = this.promoteAnyToNumber(rhs);

            return lhs || rhs ? 1 : 0;
        });
    }

    logicalAndExpression(ctx) {
        return this.binaryExprUtility(ctx, 'equalityExpression', 'LogicalAndOperator', (lhs, operator, rhs) => {
            if (lhs == null && rhs == null) {
                return null;
            }

            lhs = this.promoteAnyToNumber(lhs);
            rhs = this.promoteAnyToNumber(rhs);

            return lhs && rhs ? 1 : 0;
        });
    }

    equalityExpression(ctx) {
        return this.binaryExprUtility(ctx, 'relationalExpression', 'EqualityOperator', (lhs, operator, rhs) => {
            if (typeof(lhs) == 'string' && typeof(rhs) == 'string') {
                const c = lhs.localeCompare(rhs, this.locales);

                switch (operator) {
                    case 'EqualsEquals':
                    case 'EQ':
                        return c ? 0 : 1;

                    case 'NotEquals':
                    case 'NE':
                        return c ? 1 : 0;
                }
            }

            lhs = this.promoteNonNullToNumber(lhs);
            rhs = this.promoteNonNullToNumber(rhs);

            const c = lhs == rhs;

            switch (operator) {
                case 'EqualsEquals':
                case 'EQ':
                    return c ? 1 : 0;

                case 'NotEquals':
                case 'NE':
                    return c ? 0 : 1;
            }
        });
    }

    relationalExpression(ctx) {
        return this.binaryExprUtility(ctx, 'additiveExpression', 'RelationalOperator', (lhs, operator, rhs) => {
            if (typeof(lhs) == 'string' && typeof(rhs) == 'string') {
                const c = lhs.localeCompare(rhs, this.locales);

                switch (operator) {
                    case 'LessThanEquals':
                    case 'LE':
                        return c <= 0 ? 1 : 0;

                    case 'GreaterThanEquals':
                    case 'GE':
                        return c >= 0 ? 1 : 0;

                    case 'LessThan':
                    case 'LT':
                        return c < 0 ? 1 : 0;

                    case 'GreaterThan':
                    case 'GT':
                        return c > 0 ? 1 : 0;
                }
            }

            lhs = this.promoteNonNullToNumber(lhs);
            rhs = this.promoteNonNullToNumber(rhs);

            switch (operator) {
                case 'LessThanEquals':
                case 'LE':
                    return lhs > rhs ? 0 : 1;

                case 'GreaterThanEquals':
                case 'GE':
                    return lhs < rhs ? 0 : 1;

                case 'LessThan':
                case 'LT':
                    return lhs < rhs ? 1 : 0;

                case 'GreaterThan':
                case 'GT':
                    return lhs > rhs ? 1 : 0;
            }
        });
    }

    additiveExpression(ctx) {
        return this.binaryExprUtility(ctx, 'multiplicativeExpression', 'AdditiveOperator', (lhs, operator, rhs) => {
            if (lhs == null && rhs == null) {
                return null;
            }

            lhs = this.promoteAnyToNumber(lhs);
            rhs = this.promoteAnyToNumber(rhs);

            switch (operator) {
                case 'Plus':
                    return lhs + rhs;

                case 'Minus':
                    return lhs - rhs;
            }
        });
    }

    multiplicativeExpression(ctx) {
        return this.binaryExprUtility(ctx, 'unaryExpression', 'MultiplicativeOperator', (lhs, operator, rhs) => {
            if (lhs == null && rhs == null) {
                return null;
            }

            lhs = this.promoteAnyToNumber(lhs);
            rhs = this.promoteAnyToNumber(rhs);

            switch (operator) {
                case 'Asterisk':
                    return lhs * rhs;

                case 'Slash':
                    if ( ! rhs) {
                        throw new Error('Divide by zero');
                    }

                    return lhs / rhs;
            }
        });
    }

    unaryExpression(ctx) {
        if (ctx.primaryExpression) {
            return this.visit(ctx.primaryExpression);
        }

        let operand = this.visit(ctx.unaryExpression);
        const operator = ctx.UnaryOperator[0].tokenType.name;

        if (operand == null && operator != 'Not') {
            return null;
        }

        operand = this.promoteAnyToNumber(operand);

        return this.unaryOpUtility(operator, operand);
    }

    ifExpression(ctx) {
        let expressionList;
        let condition = this.visit(ctx.ifCondition);

        if (typeof(condition) == 'number' && condition) {
            expressionList = ctx.ifExpression[0];
        }

        if ( ! expressionList && ctx.elseIfCondition) {
            for (let i in ctx.elseIfCondition) {
                condition = this.visit(ctx.elseIfCondition[i]);

                if (typeof(condition) == 'number' && condition) {
                    expressionList = ctx.elseIfBlock[i];
                    break;
                }
            }
        }

        if ( ! expressionList && ctx.elseBlock) {
            expressionList = ctx.elseBlock[0];
        }

        if (expressionList) {
            const s = this.env.push();

            this.env.poke(this.visit(expressionList));

            return this.env.pop(s);
        }

        return this.env.peek();
    }

    declarationExpression(ctx) {
        if (ctx.Var) {
            const depth = this.env.depth();

            return this.env.set(ctx.Identifier[0].image, ctx.Equals ? this.visit(ctx.simpleExpression) : '', depth);;
        }

        // defers visit of expressionList until function is called
        const func = {
            type: 'function/formcalc',
            parameters: this.visit(ctx.parameterList),
            expressionList: ctx.expressionList
        };

        this.env.register(ctx.Identifier[0].image, func);
    }

    assignmentExpression(ctx) {
        const accessor = this.visit(ctx.accessor);
        const result = this.visit(ctx.rhs);

        this.storeValue(accessor, result);

        return result;
    }

    whileExpression(ctx) {
        const s = this.env.push();

        this.env.poke(this.loopUtility(ctx, (_) => this.visit(_.condition), () => {}));

        return this.env.pop(s);
    }

    forExpression(ctx) {
        const s = this.env.push();

        const id = ctx.Identifier[0].image;
        let iterator = this.visit(ctx.startExpression);

        this.env.set(id, iterator, ctx.Var ? s : undefined);

        let conditional;
        let step;

        if (ctx.upto) {
            conditional = () => iterator <= this.visit(ctx.endExpression);
            step = ctx.step ? this.visit(ctx.step) : 1;
        } else {
            conditional = () => iterator >= this.visit(ctx.endExpression);
            step = ctx.step ? this.visit(ctx.step) : -1;
        }

        this.env.poke(this.loopUtility(ctx, () => conditional(), () => { iterator += step; this.storeValue(id, iterator); }));

        return this.env.pop(s);
    }

    forEachExpression(ctx) {
        // create Generator object which transforms argumentList to matched list of objects
        function* generator($, args) {
            for (let i in args) {
                if ($.env.isCollection(args[i])) {
                    for (let j in args[i]) {
                        let v = $.env.nth(args[i], j);

                        if (typeof(v) != 'undefined') {
                            yield v;
                        }
                    }
                    continue;
                }

                if (typeof(args[i]) != 'undefined') {
                    yield args[i];
                }
            }
        }

        const s = this.env.push();
        const id = ctx.Identifier[0].image;
        const gen = generator(this, this.visit(ctx.argumentList));

        this.env.set(id, '', s);

        this.env.poke(this.loopUtility(ctx, () => {
            let obj = gen.next();

            if (obj.done) {
                return false;
            }

            this.env.set(id, obj.value);

            return true;
        }, () => {}));

        return this.env.pop(s);
    }

    blockExpression(ctx) {
        const s = this.env.push();

        this.env.poke(this.visit(ctx.expressionList));

        return this.env.pop(s);
    }

    accessor(ctx) {
        const list = new Array();

        list.push(this.visit(ctx.container));

        for (let i in ctx.subContainer) {
            let obj = this.visit(ctx.subContainer[i]);

            obj.separator = ctx.separator[i].image;

            list.push(obj);
        }

        return {
            type: 'accessor',
            objs: list
        };
    }

    container(ctx) {
        if (ctx.indexedContainer) {
            return this.visit(ctx.indexedContainer);
        }

        if (ctx.methodCall) {
            return this.visit(ctx.methodCall);
        }

        return {
            type: 'id',
            name: ctx.Identifier[0].image
        };
    }

    indexedContainer(ctx) {
        return {
            type: 'index',
            name:  ctx.Identifier[0].image,
            index: ctx.simpleExpression ? this.visit(ctx.simpleExpression) : ctx.Asterisk[0].image
        };
    }

    methodCall(ctx) {
        return {
            type: 'call',
            name: ctx.Identifier[0].image,
            args: this.visit(ctx.argumentList)
        };
    }

    functionCall(ctx) {
        const name = ctx.Identifier[0].image;
        const func = this.env.find(name);
        const args = this.visit(ctx.argumentList);

        if ( ! func) {
            throw new Error(`function "${name}" not declared`);
        }

        // here's the hook for native function calls (i.e., bridge to javascript)
        if (func.type == 'function/native') {
            this.env.poke(func.callback.apply(args));

            return this.env.pop(s);
        }

        if (func.type != 'function/formcalc') {
            throw new Error(`function "${name}" of type "${func.type}" is not supported`);
        }

        if (args?.length != func.parameters?.length) {
            throw new Error(`function "${name}" expects ${func.parameters.length} parameters but called with ${args.length} arguments`);
        }

        const s = this.env.push();

        for (let i in func.parameters) {
            this.env.set(func.parameters[i], args[i], s);
        }

        try {
            this.env.poke(this.visit(func.expressionList));
        } catch (err) {
            if ( ! (err instanceof FormCalcReturn)) {
                throw err;
            }
        }

        return this.env.pop(s);
    }

    parameterList(ctx) {
        return ctx.Identifier.map((_) => _.image);
    }

    argumentList(ctx) {
        return ctx.simpleExpression.map((_) => this.visit(_));
    }

    primaryExpression(ctx) {
        if (ctx.Literal) {
            const image = ctx.Literal[0].image;

            switch (ctx.Literal[0].tokenType.name) {
                case 'NumberLiteral':
                    return image.match(/^[0-9]+([.]0*)?$/) ? parseInt(image) : parseFloat(image);
                case 'StringLiteral':
                    // trim surrounding double quotes and unescape embedded double quotes;
                    // javascript only supports up to 6 hex-digits
                    return image.slice(1, -1)
                                .replaceAll('""', '"')
                                .replaceAll(/\\u[0-9a-fA-F]{8}/g, (_) => String.fromCodePoint(Number('0x' + _.slice(4))))
                                .replaceAll(/\\u[0-9a-fA-F]{4}/g, (_) => String.fromCodePoint(Number('0x' + _.slice(2))));
                case 'Null':     return null;
                case 'NAN':      return Number.NaN;
                case 'Infinity': return Number.POSITIVE_INFINITY;
                case 'True':     return 1;
                case 'False':    return 0;
            }

            throw new Error(`Unknown literal "${ctx.Literal[0].tokenType.name}"`);
        }

        if (ctx.accessor) {
            const accessor = this.visit(ctx.accessor);

            if (ctx.Equals) {
                return this.assignmentExpression(ctx);
            }

            // refers to the collection of sub-objects of the object identified by the accessor
            const subObjects = ctx.PeriodAsterisk?.length > 0;

            return this.fetchValue(accessor, subObjects);
        }

        if (ctx.functionCall) {
            return this.visit(ctx.functionCall);
        }

        return this.visit(ctx.simpleExpression);
    }

    /**************************************************************************
     * Utility functions
     *************************************************************************/

    fetchValue(accessor, subObjects) {
        if (typeof(accessor) == 'string') {
            return this.env.get(accessor);
        }

        if (typeof(accessor) == 'object') {
            if ( ! subObjects && accessor.objs.length == 1 && ! accessor.objs[0].subObjects && accessor.objs[0].type == 'id') {
                return this.env.get(accessor.objs[0].name);
            }

            return this.env.get(accessor, subObjects);
        }

        throw new Error(`Unsupported accessor "${typeof(accessor)}"`);
    }

    storeValue(accessor, value) {
        if (typeof(accessor) == 'string') {
            this.env.get(accessor);

            return this.env.set(accessor, value);
        }

        if (typeof(accessor) == 'object') {
            if (accessor.objs.length == 1 && accessor.objs[0].type == 'id') {
                this.env.get(accessor.objs[0].name);

                return this.env.set(accessor.objs[0].name, value);
            }

            return this.env.set(accessor, value);
        }

        throw new Error(`Unsupported accessor "${typeof(accessor)}"`);
    }

    promoteNonNullToNumber(value) {
        return value == null ? null : this.promoteAnyToNumber(value);
    }

    promoteAnyToNumber(value) {
        if (typeof(value) == 'number') {
            return Number.isFinite(value) ? value : 0;
        }

        let tmp = parseFloat(value);

        if (typeof(tmp) == 'number') {
            return Number.isFinite(tmp) ? tmp : 0;
        }

        return 0;
    }

    unaryOpUtility(operator, operand) {
        switch (operator) {
            case 'Plus':
                return operand;

            case 'Minus':
                return -operand;

            case 'Not':
                return ! operand ? 1 : 0;
        }

        throw new Error(`Unsupported unary operator "${operator}"`);
    }

    binaryExprUtility(ctx, exprName, opName, binaryOpCallback) {
        let lhs = this.visit(ctx[exprName][0]);

        if ( ! ctx[opName]) {
            return lhs;
        }

        for (let i = 0; i < ctx[opName].length;) {
            let op = ctx[opName][i++].tokenType.name;
            let rhs = this.visit(ctx[exprName][i]);

            lhs = binaryOpCallback(lhs, op, rhs);
        }

        return lhs;
    }

    loopUtility(ctx, iterable, increment) {
        while (iterable(ctx)) {
            try {
                this.env.poke(this.visit(ctx.expressionList));
            } catch (err) {
                if (err instanceof FormCalcContinue) {
                    continue;
                }

                if (err instanceof FormCalcBreak) {
                    break;
                }

                throw err;
            }

            increment(ctx);
        }

        return this.env.peek();
    }
};
