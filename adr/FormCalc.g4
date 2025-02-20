grammar FormCalc;

// syntactical grammar

formCalculation
    : expressionList EOF    
    ;

expressionList
    : expression+
    ;

expression
    : ifExpression
    | whileExpression
    | forExpression
    | forEachExpression
    | blockExpression
    | continueExpression
    | breakExpression
    | returnExpression
    | exitExpression
    | throwExpression
    | simpleExpression
    | declarationExpression
    ;

ifExpression
    : If LParen simpleExpression RParen Then
        expressionList
    ( ElseIf LParen simpleExpression RParen Then
        expressionList )*
    ( Else
        expressionList )?
      EndIf
    ;

whileExpression
    : While LParen simpleExpression RParen Do
        expressionList
      EndWhile
    ;

forExpression
    : For assignment UpTo simpleExpression ( Step simpleExpression )? Do
        expressionList
      EndFor
    | For assignment DownTo accessor ( Step simpleExpression )? Do
        expressionList
      EndFor
    ;

forEachExpression
    : ForEach variable In LParen argumentList RParen Do
        expressionList
      EndFor
    ;

blockExpression
    : Do
        expressionList
      End
    ;

continueExpression
    : Continue
    ;

breakExpression
    : Break
    ;

returnExpression
    : Return
    ;

throwExpression
    : Throw simpleExpression
    ;

exitExpression
    : Exit
    ;

simpleExpression
    : logicalOrExpression
    ;

logicalOrExpression
    : logicalAndExpression ( logicalOrOperator logicalAndExpression )*
    ;

logicalAndExpression
    : equalityExpression ( logicalAndOperator equalityExpression )*
    ;

equalityExpression
    : relationalExpression ( equalityOperator relationalExpression )*
    ;

relationalExpression
    : additiveExpression ( relationalOperator additiveExpression )*
    ;

additiveExpression
    : multiplicativeExpression ( additiveOperator multiplicativeExpression )*
    ;

multiplicativeExpression
    : unaryExpression ( multiplicativeOperator unaryExpression )*
    ;

unaryExpression
    : unaryOperator unaryExpression
    | primaryExpression
    ;

primaryExpression
    : literal
    | functionCall
    | assignmentExpression
    | accessor ( DotAsterisk )?
    | LParen simpleExpression RParen
    ;

declarationExpression
    : Var variable ( Assign simpleExpression )?
    | Func function LParen ( parameterList )? RParen Do
        expressionList
      EndFunc
    ;

parameterList
    : parameter ( Comma parameter )*
    ;

assignment
    : ( Var )? variable Assign simpleExpression
    ;

assignmentExpression
    : accessor Assign simpleExpression
    ;

functionCall
    : function LParen ( argumentList )? RParen
    ;

function
    : Identifier
    ;

parameter
    : Identifier
    ;

variable
    : Identifier
    ;

accessor
    : container ( ( Dot | DotDot | DotHash ) container )*
    ;

container
    : methodCall
    | indexedContainer
    | Identifier
    ;

indexedContainer
    : Identifier LBracket ( '*' | simpleExpression ) RBracket
    ;

methodCall
    : Identifier LParen ( argumentList )? RParen
    ;

argumentList
    : simpleExpression ( Comma simpleExpression )*
    ;

literal
    : numberLiteral
    | StringLiteral
    | nullLiteral
    ;

numberLiteral
    : NumberLiteral
    | True
    | False
    | NAN
    | Infinity
    ;

nullLiteral
     : Null
     ;

logicalOrOperator
    : BitOr
    | Or
    ;

logicalAndOperator
    : BitAnd
    | And
    ;

equalityOperator
    : Equals
    | NotEquals
    | EQ
    | NE
    ;

relationalOperator
    : LessThanEquals
    | GreaterThanEquals
    | LessThan
    | GreaterThan
    | LE
    | GE
    | LT
    | GT
    ;

additiveOperator
    : Plus
    | Minus
    ;

multiplicativeOperator
    : Multiply
    | Divide
    ;

unaryOperator
    : Minus
    | Plus
    | Not
    ;

keyword
    : If
    | Then
    | ElseIf
    | Else
    | EndIf
    | Or
    | And
    | Not
    | EQ
    | NE
    | LE
    | GE
    | LT
    | GT
    | True
    | False
    | Null
    | NAN
    | Infinity
    ;

reservedKeyword
    : While
    | Do
    | EndWhile
    | End
    | For
    | UpTo
    | DownTo
    | Step
    | EndFor
    | ForEach
    | In
    | Break
    | Continue
    | Var
    | Func
    | EndFunc
    | Throw
    | Return
    | Exit
    ;

// lexical grammar

LParen:            '(';
RParen:            ')';
LBracket:          '[';
RBracket:          ']';
Comma:             ',';
Dot:               '.';
DotDot:            '..';
DotHash:           '.#';
DotAsterisk:       '.*';
BitOr:             '|';
BitAnd:            '&';
Equals:            '==';
NotEquals:         '<>';
LessThanEquals:    '<=';
GreaterThanEquals: '>=';
LessThan:          '<';
GreaterThan:       '>';
Assign:            '=';
Plus:              '+';
Minus:             '-';
Multiply:          '*';
Divide:            '/';
If:                'if';
Then:              'then';
ElseIf:            'elseif';
Else:              'else';
EndIf:             'endif';
Or:                'or';
And:               'and';
Not:               'not';
EQ:                'eq';
NE:                'ne';
LE:                'le';
GE:                'ge';
LT:                'lt';
GT:                'gt';
True:              'true';
False:             'false';
Null:              'null';
NAN:               'nan';
Infinity:          'infinity';
While:             'while';
Do:                'do';
EndWhile:          'endwhile';
End:               'end';
For:               'for';
UpTo:              'upto';
DownTo:            'downto';
Step:              'step';
EndFor:            'endfor';
ForEach:           'foreach';
In:                'in';
Break:             'break';
Continue:          'continue';
Var:               'var';
Func:              'func';
EndFunc:           'endfunc';
Throw:             'throw';
Return:            'return';
Exit:              'exit';

WS: [ \t\u000b\u000c\n\r\u2028\u2029]+ -> skip;

fragment Character
    : [\u0009-\u000D]
    | [\u0020\u0021\u0023-\uD7FF]
    | [\uE000-\uFFFD]
    ;

Comment
    : ( ';' | '//' ) ~[\r\n\u2028\u2029]*  -> channel(HIDDEN)
    ;

fragment HexDigit
    : [0-9]
    | [a-f]
    | [A-F]
    ;

fragment EscapedCharacter
    : '""'
    | '\\' 'u' HexDigit HexDigit HexDigit HexDigit 
               HexDigit HexDigit HexDigit HexDigit
    | '\\' 'u' HexDigit HexDigit HexDigit HexDigit
    ;

StringLiteral
    : '"' ( Character | '""' | EscapedCharacter )* '"'
    ;

fragment Integer
    : [0-9]+
    ;

fragment Exponent
    : [Ee] [+-]? Integer
    ;

NumberLiteral
    : (Integer ( '.' [0-9]* )? | '.' Integer ) Exponent?
    ;

fragment AlphabeticCharacter
    : [\p{Alpha}]
    ;

fragment AlphanumericCharacter
    : [\p{Alnum}]
    ;

Identifier
    : ( AlphabeticCharacter | '_' | '$' | '!' )
      ( AlphanumericCharacter | '_' | '$' )*
    ;
