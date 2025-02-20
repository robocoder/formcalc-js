# Language Spec

## Status

Accepted

## Context

Which version of the XFA-FormCalc spec will we implement and to what extent?

## Decision

There are two notable versions of the XFA-FormCalc spec:

* [1.0](https://www.w3.org/1999/05/XFA/xfa-formcalc.html#lexical-grammar) - submitted by JetForm to W3C on 1999-05-14
* [3.3](https://helpx.adobe.com/content/dam/Adobe/specs/xfa_spec_3_3.pdf) - last revised by Adobe on 2012-01-09

in addition to the supplemental [AEM 6.3 Forms: Designer FormCalc Reference](https://helpx.adobe.com/pdf/aem-forms/6-3/formcalc-reference.pdf).

For "completeness", we will implement the lexer and parser corresponding to the (lexical and syntactic) grammar specified in XFA-FormCalc 3.3.

For a leaner implementation, the core interpreter excludes:

* [built-in functions](https://helpx.adobe.com/pdf/aem-forms/6-3/formcalc-reference.pdf) for math, string, formatting, time/date, financial, etc operations
* [scripting support](https://helpx.adobe.com/livecycle/help/mobile-forms/scripting-support.html) objects or apis (e.g., `$event` or `app.eval()`)

We plan to provide a mechanism for form designers and developers to plug-in their own function libraries, written in FormCalc and/or native JavaScript.

For historical reference, a consolidated (pre-implementation) grammar can be found here:

* [syntax diagram](https://github.com/robocoder/formcalc-js/blob/main/adr/syntax-diagram.html)
* [FormCalc.g4](https://github.com/robocoder/formcalc-js/blob/main/adr/FormCalc.g4)

## Consequences

### Non-Conformance

In XFA-FormCalc, a `Comment` is not considered a value, so commenting out ALL the FormCalc calculations for an event will generate an error. The suggested workaround is (debateably) not dev-friendly, i.e.,

* remove all the commented code AND add an expression that returns a value, e.g., '0' or '$.rawValue = $.rawValue'

In addition, XFA-FormCalc 3.3 specifies an `ExpressionList` as one or more `Expression`:

```
[28] ExpressionList ::=
         Expression ( Expression )*
```

Implementer's Note:

* permit all FormCalc calculations to be commented out
* permit `ExpressionList` to be zero or more `Expression`
* in the event of the above, return "undefined" to the host application

```
     ExpressionList ::=
         ( Expression )*
```

### Scripting Object Model

The XFA's Scripting Object Model (SOM) has an expressive syntax that will be unfamiliar to Web designers/developers more accustomed to CSS and/oor jQuery selectors.

Implementer's Note:

* we would like to proffer a built-in function that uses the native querySelector() or querySelectorAll()

The interpreter currently passes an accessor object (representing the SOM expression) to the host application to resolve.

Implementer's Note:

* we have not yet implemented such a resolver

### Left Recursion

XFA-FormCalc 3.3's grammar redefined many of the rules from XFA-FormCal 1.0 using left recursion. Examples:

```
[31] LogicalOrExpression ::=
         LogicalAndExpression |
         LogicalOrExpression LogicalOrOperator LogicalAndExpression

[32] LogicalAndExpression ::=
         EqualityExpression |
         LogicalAndExpression LogicalAndOperator EqualityExpression

[33] EqualityExpression ::=
         RelationalExpression |
         EqualityExpression EqualityOperator RelationalExpression

[34] RelationalExpression ::=
         AdditiveExpression |
         RelationalExpression RelationalOperator AdditiveExpression

[35] AdditiveExpression ::=
         MultiplicativeExpression |
         AdditiveExpression AdditiveOperator MultiplicativeExpression

[36] MultiplicativeExpression ::=
         UnaryExpression |
         MultiplicativeExpression MultiplicativeOperator UnaryExpression
```

vs

```
[24] LogicalOrExpression ::=
         LogicalAndExpression
         ( LogicalOrOperator LogicalAndExpression )*

[25] LogicalAndExpression ::=
         EqualityExpression
         ( LogicalAndOperator EqualityExpression )*

[26] EqualityExpression ::=
         RelationalExpression
         ( LogicalAndOperator RelationalExpression )*

[27] RelationalExpression ::=
         AdditiveExpression
         ( RelationalOperator AdditiveExpression )*

[28] AdditiveExpression ::=
         MultiplicativeExpression
         ( AdditiveOperator MultiplicativeExpression )*

[29] MultiplicativeExpression ::=
         UnaryExpression
         ( MultiplicativeOperator UnaryExpression )*
```

Implementer's Note:

* the XFA-FormCalc 1.0 grammar is more straight-forward when implementing the parser using Chevrotain, a LL(K) parser building toolkit.

### Inlining Parsing Rules

As a [minor runtime optimization](https://chevrotain.io/docs/guide/performance.html#minor-runtime-optimizations), the parser implementation inlines parsing rules which only parse a single Terminal.

For example:

```
    SimpleExpression ::=
        LogicalOrExpression

    LogicalOrExpression ::=
        LogicalAndExpression ( LogicalOrOperator LogicalAndExpression )*
```

becomes:

```
    SimpleExpression ::=
        LogicalAndExpression ( LogicalOrOperator LogicalAndExpression )*
```

Similarly for:

* `ContinueExpresion`
* `BreakExpression`
* `ThrowExpression`
* `ReturnExpression`
* `ExitExpression`
* `Function`
* `Method`
* `Assignment`

### Identifier

In XFA-FormCalc 1.0, an `Identifier` is described ambiguously as:

    An alphabetic character is any Unicode character classified as a letter. An alphanumeric character is any Unicode character classified as either a letter, or a digit.

In XFA-FormCalc 3.3, an `Identifier` is constrained to the BMP (U+0000 .. U+FFFF) but still vague about "digit".

    An alphabetic character is any Unicode character classified as a letter in the Basic Multilingual Plane (BMP). An alphanumeric character is any Unicode character classified as either a letter or digit in the BMP.

Implementer's Note:

* the lexer implementation uses Unicode character classes L and N (which correspond to the POSIX character classes alpha and alnum, respectively)

### SimpleExpression

In XFA-FormCalc 1.0, the `SimpleExpression` production is incorrect:

```
[23] SimpleExpression ::
         LogicalOrOperator
```

should be:

```
     SimpleExpression ::=
         LogicalOrExpression
```

Implementer's Note:

* the above was corrected in XFA-FormCalc 3.3

### EqualityExpression

In XFA-FormCalc 1.0, the `EqualityExpression` production uses the wrong operator:

```
[26] EqualityExpression ::=
         RelationalExpression
         ( LogicalAndOperator RelationalExpression )*
```

It should be:

```
     EqualityExpression ::=
         RelationalExpression
         ( EqualityOperator RelationalExpression )*
```

Implementer's Note:

* the above was corrected in XFA-FormCalc 3.3

```
[33] EqualityExpression ::= RelationalExpression |
         EqualityExpression EqualityOperator RelationalExpression
```

### Character

In XFA-FormCalc 3.3, the `Character` incorrectly includes the `LineTerminator` terminal symbols. This creates a conflict with the `Comment` production.

```
[2] Character ::= [#x9-#xD] | [#x20-#xD7FF] | [#xE000-#xFFFD]

[4] LineTerminator ::= #xA | #xD

[5] Comment ::= ';' ( Character \– LineTerminator )* |
        '/' '/' ( Character \– LineTerminator )*
```

`Character` should be reverted to:

```
    Character ::= [#x9 #xB #xC] | [#x20-#xD7FF] | [#xE000-#xFFFD]
```

### HexDigit

In XFA-FormCalc 3.3, the `HexDigit` production is incorrect.

```
[6] HexDigit ::= ['0'-'9'] | ['m'-'f'] | ['A'-'F']
```

should be:

```
    HexDigit ::= ['0'-'9'] | ['a'-'f'] | ['A'-'F']
```

### EscapedCharacter

In XFA-FormCalc 3.3, the `EscapedCharacter` production has an incorrect Unicode escape sequence:

```
[7] EscapedCharacter ::= '"' '"' |
        '\' 'U' HexDigit HexDigit HexDigit HexDigit |
        '\' 'U' HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit
```

should be:

```
    EscapedCharacter ::= '"' '"' |
        '\' 'u' HexDigit HexDigit HexDigit HexDigit |
        '\' 'u' HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit
```

### NumberLiteral

In XFA-FormCalc 3.3, the `NumberLiteral` production misnames the `infinity` literal:

```
[11] NumberLiteral ::= Integer '.' ['0'-'9']* Exponent? | '.' Integer Exponent? |
         Integer Exponent? | 'nan' | 'inf'
```

should be:

```
     NumberLiteral ::= Integer '.' ['0'-'9']* Exponent? | '.' Integer Exponent? |
         Integer Exponent? | 'nan' | 'infinity'
```

Implementer's Note:

* in JavaScript, Infinity is a reserved keyword.

### This

In XFA 3.3, the Scripting Object Model (SOM) states `this` and `$` are both variables that point to the field object. However, XFA-FormCalc claims `this` as a keyword.

Implementer's Note:

* the lexer does not recognize `this` as a keyword token
* it is at the discretion (and if so choosing, the subsequent responsibility) of the host application to set both `this` and `$` variables

### Boolean Keywords

In XFA-FormCalc 3.3, `true` and `false` are used as operands in a boolean expression (Example 25.8).

Thus, `Keyword` should include the booleans:

```
     Keyword ::= 'if' | 'then' | 'elseif' | 'else' | 'endif' | 'or' | 'and' |
                 'not' | 'eq' | 'ne' | 'le' | 'ge' | 'lt' | 'gt' | 'this' | 'null' | 'nan' |
                 'infinity' | 'true' | 'false'
```

### Expression

In XFA-FormCalc3.3, the `Expression` contains `AssignmentExpression` which doesn't jive with the operator precedence rules.

Implementer's Note:

* move `AssignmentExpression` from `Expression` to `PrimaryExpression`

```
    PrimaryExpression ::= Literal |
        Accessor ( '.*' )? |
        AssignmentExpression |
        FunctionCall |
        '(' SimpleExpression ')'
```

* we use lookahead tokens to disambiguate between FunctionCall, Accessor, and AssignmentExpression since they may all start with an Identifier.
* we use lookahead tokens to disambiguate between Accessor and AssignmentExpression since they both start with an Accessor.

### Control Expressions

In XFA-FormCalc 3.3, the tokens `continue`, `break`, `throw`, `return`, and `exit` are defined but aren't reachable in the syntactical grammar. In the case of "User-Defined Functions", the spec does say:

    The value returned from the function is the last value calculated by the function. That is, there is not (sic) return statement, as with C-language functions.

In addition, the `BlockExpression` production is unreachable in the grammar.

Implementer's Note:

* subject to inline optimizations, flesh out the grammar as follows:

```
    Expression ::= IfExpression |
        WhileExpression |
        ForExpression |
        ForEachExpression |
        ContinueExpression |
        BreakExpression |
        ThrowExpression |
        ReturnExpression |
        ExitExpression |
        DeclarationExpression |
        SimpleExpression |
        BlockExpression

    ThrowExpression ::= 'throw' SimpleExpression

    ReturnExpression ::= 'return'

    ExitExpression ::= 'exit'
```

### ForExpression

In XFA-FormCalc 3.3, the `ForExpression` production refers to `Assignment`, and omits the optional `var` (shown in Example 25.27) or numeric constants for the end expression (show in Example 25.28):

```
[48] ForExpression ::=
         'for' Assignment 'upto' Accessor ( 'step' SimpleExpression )?
             'do' ExpressionList 'endfor' |
         'for' Assignment 'downto' Accessor ( 'step' SimpleExpression )?
             'do' ExpressionList 'endfor'
```

We presume this should be;

```
     ForExpression ::=
         'for' ( Assignment 'upto' SimpleExpression ( 'step' SimpleExpression )?
             'do' ExpressionList 'endfor' |
         'for' Assignment 'downto' SimpleExpression ( 'step' SimpleExpression )?
             'do' ExpressionList 'endfor'

     Assignment ::= ( 'var' )? Identifier '=' SimpleExpresion
```

### ForEachExpression

In XFA-FormCalc 3.3, the `ForEachExpression` refers to an `ArgumentList`, downplaying its significance.

```
[49] ForEachExpression ::= 'foreach' Identifier 'in' '(' ArgumentList ')' 'do'
                                ExpressionList
                           'endfor'
```

The specification says the `ForEachExpression` returns zero if the loop was never entered, and at the same time, `ArgumentList` cannot be empty. Furthermore, multiple examples show arguments of the form `Identifier[*]` which refer to EVERY occurrence of the identified object. Thus, we deduce that the `ForEachExpression` isn't iterating through the list of arguments. Rather, the argument list is similar to a jQuery selector list, and the loop iterates through the matched objects.

```
    var total = 0.0
    foreach expense in ( travel_exp[*], living_exp[*], parking_exp[*] ) do
        total = total + expense
    endfor
```

### ParameterList

In XFA-FormCalc 3.3, the `ParameterList` is incomplete (i.e., missing its definition):

```
[53] ParameterList
```

will be assumed to be:

```
     ParameterList ::= Parameter (',' Parameter)*

     Parameter ::= Identifier
```

### DeclarationExpression

In XFA-FormCalc 3.3, the `DeclarationExpression` has multiple problems. First, `Variable` is not defined. Second, it requires functions to be defined with a non-empty `ParameterList`. This conflicts with `FunctionCall` where the `ArgumentList` is optional:

```
[54] DeclarationExpression ::=
         'var' Variable |
         'var' Variable '=' SimpleExpression |
         'Func' Identifier '(' ParameterList ')' do ExpressionList 'endfunc'

[56] FunctionCall ::= Function '(' ( ArgumentList )? ')'
```

We propose the following corrections:

```
[54] DeclarationExpression ::=
         'var' Variable |
         'var' Variable '=' SimpleExpression |
         'func' Identifier '(' ( ParameterList )? ')' do ExpressionList 'EndFunc'

     Variable ::= Identifier
```

### ContainerList

The `ContainerList` production in XFA-FormCalc 3.3 is unreachable and we are unable to intuit where it fits.
