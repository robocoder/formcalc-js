"use strict";

import * as FormCalc from "./lexer.mjs";

// parser
// - https://www.w3.org/1999/05/XFA/xfa-formcalc.html#syntactic-grammar
export class Parser extends FormCalc.CstParser {
    constructor(tokenVocabulary = [], config = {}) {
        super(tokenVocabulary, config);

        // not mandatory, using $ (or any other sign) to reduce verbosity (this. this. this. this. .......)
        const $ = this;

        // caching arrays of alternatives
        // - https://chevrotain.io/docs/guide/performance.html#caching-arrays-of-alternatives
        $.c29 = undefined;
        $.c45 = undefined;
        $.c54 = undefined;
        $.c59 = undefined;

        // [27] FormCalculation ::= ExpressionList
        $.RULE("formCalculation", () => {
            $.SUBRULE($.expressionList);
        });

        // [28] ExpressionList ::= ( Expression )*
        $.RULE("expressionList", () => {
            $.MANY(() => {
                $.SUBRULE($.expression);
            });
        });

        // [29] Expression ::= IfExpression
        //                   | WhileExpression
        //                   | ForExpression
        //                   | ForEachExpression
        //                   | DeclarationExpression
        //                   | SimpleExpression
        //                   | 'continue'
        //                   | 'break'
        //                   | 'throw' SimpleExpression
        //                   | 'return'
        //                   | 'exit'
        $.RULE("expression", () => {
            $.OR($.c29 || ($.c29 = [
                { ALT:  () => $.SUBRULE($.ifExpression) },
                { ALT:  () => $.SUBRULE($.whileExpression) },
                { ALT:  () => $.SUBRULE($.forExpression) },
                { ALT:  () => $.SUBRULE($.forEachExpression) },
                { ALT:  () => $.SUBRULE($.declarationExpression) },
                { ALT:  () => $.SUBRULE($.simpleExpression) },
                { ALT:  () => $.SUBRULE($.blockExpression) },
                { ALT:  () => $.CONSUME(FormCalc.Continue) },
                { ALT:  () => $.CONSUME(FormCalc.Break) },
                { ALT:  () => { $.CONSUME(FormCalc.Throw); $.SUBRULE2($.simpleExpression); }},
                { ALT:  () => $.CONSUME(FormCalc.Return) },
                { ALT:  () => $.CONSUME(FormCalc.Exit) }
            ]));
        });

        // [30] SimpleExpression ::= LogicalOrExpression
        // [31] LogicalOrExpression ::= LogicalAndExpression
        //                            | LogicalOrExpression LogicalOrOperator LogicalAndExpression
        $.RULE("simpleExpression", () => {
            $.SUBRULE($.logicalAndExpression);
            $.MANY(() => {
                $.CONSUME(FormCalc.LogicalOrOperator);
                $.SUBRULE2($.logicalAndExpression);
            });
        });

        // [32] LogicalAndExpression ::= EqualityExpression
        //                             | LogicalAndExpression LogicalAndOperator EqualityExpression
        $.RULE("logicalAndExpression", () => {
            $.SUBRULE($.equalityExpression);
            $.MANY(() => {
                $.CONSUME(FormCalc.LogicalAndOperator);
                $.SUBRULE2($.equalityExpression);
            });
        });

        // [33] EqualityExpression ::= RelationalExpression
        //                           | EqualityExpression EqualityOperator RelationalExpression
        $.RULE("equalityExpression", () => {
            $.SUBRULE($.relationalExpression);
            $.MANY(() => {
                $.CONSUME(FormCalc.EqualityOperator);
                $.SUBRULE2($.relationalExpression);
            });
        });

        // [34] RelationalExpression ::= AdditiveExpression
        //                             | RelationalExpression RelationalOperator AdditiveExpression
        $.RULE("relationalExpression", () => {
            $.SUBRULE($.additiveExpression);
            $.MANY(() => {
                $.CONSUME(FormCalc.RelationalOperator);
                $.SUBRULE2($.additiveExpression);
            });
        });

        // [35] AdditiveExpression ::= MultiplicativeExpression
        //                           | AdditiveExpression AdditiveOperator MultiplicativeExpression
        $.RULE("additiveExpression", () => {
            $.SUBRULE($.multiplicativeExpression);
            $.MANY(() => {
                $.CONSUME(FormCalc.AdditiveOperator);
                $.SUBRULE2($.multiplicativeExpression);
            });
        });

        // [36] MultiplicativeExpression ::= UnaryExpression
        //                                 | MultiplicativeExpressiion MultiplicativeOperator UnaryExpression
        $.RULE("multiplicativeExpression", () => {
            $.SUBRULE($.unaryExpression);
            $.MANY(() => {
                $.CONSUME(FormCalc.MultiplicativeOperator);
                $.SUBRULE2($.unaryExpression);
            });
        });

        // [37] UnaryExpression ::= PrimaryExpression
        //                        | UnaryOperator UnaryExpression
        $.RULE("unaryExpression", () => {
            $.OR([
                { ALT: () => { $.CONSUME(FormCalc.UnaryOperator); $.SUBRULE($.unaryExpression); }},
                { ALT: () => $.SUBRULE($.primaryExpression) }
            ]);
        });

        // [38] LogicalOrOperator ::= '|' | 'or'
        // [39] LogicalAndOperator ::= '&' | 'and'
        // [40] EqualityOperator ::= '==' | '<>' | 'eq' | 'ne'
        // [41] RelationalOperator ::= '<=' | '>=' | '<' | '>'
        // [42] AdditiveOperator ::= '+' | '-'
        // [44] UnaryOperator ::= '-' | '+' | 'not'

        // [45] PrimaryExpression ::= Literal
        //                          | FunctionCall
        //                          | AssignmentExpression
        //                          | Accessor ( '.*' )?
        //                          | '(' SimpleExpression ')'
        $.RULE("primaryExpression", () => {
            $.OR($.c45 || ($.c45 = [
                {
                    ALT: () => $.CONSUME(FormCalc.Literal)
                },
                {
                    // both functionCall and accessor begin with Identifier
                    GATE: () => $.LA(1).tokenType == FormCalc.Identifier && $.LA(2).tokenType == FormCalc.LeftParentheses,
                    ALT:  () => $.SUBRULE($.functionCall)
                },
                {
                    ALT: () => {
                        $.SUBRULE($.accessor);
                        $.OR2([
                            // AssignmentExpression with highest operator precedence
                            {
                                GATE: () => $.LA(1).tokenType == FormCalc.Equals,
                                ALT: () => {
                                    $.CONSUME(FormCalc.Equals);
                                    $.SUBRULE($.simpleExpression, { LABEL: "rhs" });
                                }
                            },
                            // Accessor or Accessor.*
                            {
                                GATE: () => $.LA(1).tokenType != FormCalc.Equals,
                                ALT: () => { $.OPTION(() => $.CONSUME(FormCalc.PeriodAsterisk)) }
                            }
                        ])
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(FormCalc.LeftParentheses);
                        $.SUBRULE2($.simpleExpression);
                        $.CONSUME(FormCalc.RightParentheses);
                    }
                }
            ]));
        });

        // [46] IfExpression ::= 'if' '(' SimpleExpression ')' 'then'
        //                           ExpressionList
        //                     ( 'elseif' '(' SimpleExpression ')' 'then'
        //                           ExpressionList )*
        //                     ( 'else'
        //                           ExpressionList )?
        //                       'endif'
        $.RULE("ifExpression", () => {
            $.CONSUME(FormCalc.If);
            $.CONSUME(FormCalc.LeftParentheses);
            $.SUBRULE($.simpleExpression, { LABEL: "ifCondition" });
            $.CONSUME(FormCalc.RightParentheses);
            $.CONSUME(FormCalc.Then);
            $.SUBRULE($.expressionList, { LABEL: "ifExpression" });
            $.MANY(() => {
                $.CONSUME(FormCalc.ElseIf);
                $.CONSUME2(FormCalc.LeftParentheses);
                $.SUBRULE2($.simpleExpression, { LABEL: "elseIfCondition" });
                $.CONSUME2(FormCalc.RightParentheses);
                $.CONSUME2(FormCalc.Then);
                $.SUBRULE2($.expressionList, { LABEL: "elseIfBlock" });
            });
            $.OPTION(() => {
                $.CONSUME(FormCalc.Else);
                $.SUBRULE3($.expressionList, { LABEL: "elseBlock" });
            });
            $.CONSUME(FormCalc.EndIf);
        });

        // [47] WhileExpression ::= 'while' '(' SimpleExpression ')' 'do'
        //                              ExpressionList
        //                          'endwhile'
        $.RULE("whileExpression", () => {
            $.CONSUME(FormCalc.While);
            $.CONSUME(FormCalc.LeftParentheses);
            $.SUBRULE($.simpleExpression, { LABEL: "condition" });
            $.CONSUME(FormCalc.RightParentheses);
            $.CONSUME(FormCalc.Do);
            $.SUBRULE($.expressionList);
            $.CONSUME(FormCalc.EndWhile);
        });

        // [48] ForExpression ::= 'for' Assignment 'upto' SimpleExpression ( 'step' SimpleExpression )? 'do'
        //                            ExpressionList
        //                        'endfor'
        //                      | 'for' Assignment 'downto' SimpleExpression ( 'step' SimpleExpression )? 'do'
        //                            ExpressionList
        //                        'endfor'
        //
        //      Assignment ::= ( 'var' )? Variable '=' SimpleExpression
        $.RULE("forExpression", () => {
            $.CONSUME(FormCalc.For);
            $.OPTION(() => $.CONSUME(FormCalc.Var) );
            $.CONSUME(FormCalc.Identifier);
            $.CONSUME(FormCalc.Equals);
            $.SUBRULE($.simpleExpression, { LABEL: "startExpression" });
            $.OR([
                { ALT: () => $.CONSUME(FormCalc.UpTo, { LABEL: "upto"}) },
                { ALT: () => $.CONSUME(FormCalc.DownTo, { LABEL: "downto"}) }
            ]);
            $.SUBRULE2($.simpleExpression, { LABEL: "endExpression" });
            $.OPTION2(() => {
                $.CONSUME(FormCalc.Step);
                $.SUBRULE3($.simpleExpression, { LABEL: "step" });
            });
            $.CONSUME(FormCalc.Do);
            $.SUBRULE($.expressionList);
            $.CONSUME(FormCalc.EndFor);
        });

        // [49] ForEachExpression ::= 'foreach' Identifier 'in' '(' ArgumentList ')' 'do'
        //                                ExpressionList
        //                            'endfor'
        $.RULE("forEachExpression", () => {
            $.CONSUME(FormCalc.ForEach);
            $.CONSUME(FormCalc.Identifier);
            $.CONSUME(FormCalc.In);
            $.CONSUME(FormCalc.LeftParentheses);
            $.SUBRULE($.argumentList);
            $.CONSUME(FormCalc.RightParentheses);
            $.CONSUME(FormCalc.Do);
            $.SUBRULE($.expressionList);
            $.CONSUME(FormCalc.EndFor);
        });

        // [50] BlockExpression ::= 'do' ExpressionList 'end'
        $.RULE("blockExpression", () => {
            $.CONSUME(FormCalc.Do);
            $.SUBRULE($.expressionList);
            $.CONSUME(FormCalc.End);
        });

        // [53] ParameterList ::= Parameter ( ',' Parameter )*
        //
        //      Parameter ::= Identifier
        $.RULE("parameterList", () => {
            $.CONSUME(FormCalc.Identifier);

            while ($.LA(1).tokenType == FormCalc.Comma) {
                $.SKIP_TOKEN();
                $.CONSUME2(FormCalc.Identifier);
            }
        });

        // [54] DeclarationExpression ::= 'var' Variable
        //                              | 'var' Variable '=' SimpleExpression
        //                              | 'func' Identifier '(' ( ParameterList )? ')' 'do'
        //                                    ExpressionList
        //                                'endfunc'
        //
        //      Variable ::= Identifier
        $.RULE("declarationExpression", () => {
            $.OR($.c54 || ($.c54 = [
                {
                    ALT: () => {
                        $.CONSUME(FormCalc.Var);
                        $.CONSUME(FormCalc.Identifier);
                        $.OPTION(() => {
                            $.CONSUME(FormCalc.Equals);
                            $.SUBRULE($.simpleExpression);
                        });
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME(FormCalc.Func);
                        $.CONSUME2(FormCalc.Identifier);
                        $.CONSUME(FormCalc.LeftParentheses);
                        $.OPTION2(() => $.SUBRULE($.parameterList));
                        $.CONSUME(FormCalc.RightParentheses);
                        $.CONSUME(FormCalc.Do);
                        $.SUBRULE($.expressionList);
                        $.CONSUME(FormCalc.EndFunc);
                    }
                }
            ]));
        });

        // [55] AssignmentExpression ::= Accessor '=' SimpleExpression
        $.RULE("assignmentExpression", () => {
            $.SUBRULE($.accessor);
            $.CONSUME(FormCalc.Equals);
            $.SUBRULE($.simpleExpression, { LABEL: 'rhs' });
        });

        // [56] FunctionCall ::= Function '(' ( ArgumentList )? ')'
        // [57] Function ::= Identifier
        $.RULE("functionCall", () => {
            $.CONSUME(FormCalc.Identifier);
            $.CONSUME(FormCalc.LeftParentheses);
            $.OPTION(() => $.SUBRULE($.argumentList));
            $.CONSUME(FormCalc.RightParentheses);
        });

        // [58] Accessor ::= Container | Accessor [ '.' '..' '.#' ] Container
        $.RULE("accessor", () => {
            $.SUBRULE($.container);
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(FormCalc.PeriodPeriod, { LABEL: 'separator'}) },
                    { ALT: () => $.CONSUME(FormCalc.PeriodHash, { LABEL: 'separator'}) },
                    { ALT: () => $.CONSUME(FormCalc.Period, { LABEL: 'separator'}) }
                ]);
                $.SUBRULE2($.container, { LABEL: 'subContainer' });
            });
        });

        // [59] Container := Identifier
        //                 | Identifier '[' '*' ']'
        //                 | Identifier '[' SimpleExpression ']'
        //                 | MethodCall
        $.RULE("container", () => {
            $.OR($.c59 || ($.c59 = [
                {
                    // methodCall also begins with an Identifier
                    GATE: () => $.LA(2).tokenType == FormCalc.LeftParentheses,
                    ALT:  () => $.SUBRULE($.methodCall)
                },
                {
                    GATE: () => $.LA(2).tokenType == FormCalc.LeftBracket,
                    ALT:  () => $.SUBRULE($.indexedContainer)
                },
                { ALT: () => $.CONSUME(FormCalc.Identifier) }
            ]));
        });

        $.RULE("indexedContainer", () => {
            $.CONSUME(FormCalc.Identifier);
            $.CONSUME(FormCalc.LeftBracket);
            $.OR([
                { ALT: () => $.CONSUME(FormCalc.Asterisk) },
                { ALT: () => $.SUBRULE($.simpleExpression) },
            ]);
            $.CONSUME(FormCalc.RightBracket);
        });

        // [61] MethodCall ::= Method '(' ( ArgumentList )? ')'
        // [62] Method ::= Identifier
        $.RULE("methodCall", () => {
            $.CONSUME(FormCalc.Identifier);
            $.CONSUME(FormCalc.LeftParentheses);
            $.OPTION(() => $.SUBRULE($.argumentList));
            $.CONSUME(FormCalc.RightParentheses);
        });

        // [63] ArgumentList ::= SimpleExpression ( ',' SimpleExpression )*
        $.RULE("argumentList", () => {
            $.SUBRULE($.simpleExpression);

            while ($.LA(1).tokenType == FormCalc.Comma) {
                $.SKIP_TOKEN();
                $.SUBRULE2($.simpleExpression);
            }
        });

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        $.performSelfAnalysis();
    }
}
