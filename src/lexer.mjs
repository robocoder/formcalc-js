"use strict";

import { createToken, Lexer, CstParser } from "chevrotain";

export { Lexer, CstParser };

// lexer
// - https://www.w3.org/1999/05/XFA/xfa-formcalc.html#lexical-grammar (1999-05-14)
// - https://helpx.adobe.com/content/dam/Adobe/specs/xfa_spec_3_3.pdf (2012-01-09)

// [1] Input ::= WhiteSpace | LineTerminator | Comment | Token
// [2] Character ::=  [#x9#xB#xC] | [#x20-#xD7FF] | [#xE000-#xFFFD]
//
// Combine these for performance:
// [3] WhiteSpace ::=  #x9 | #xB | #xC | #x20
// [4] LineTerminator ::=  #xA | #xD
export const WhiteSpace = createToken({
    name: "WhiteSpace",
    //pattern: /[ \t\f\v\r\n]+/,
    pattern: /\s+/,
    group: Lexer.SKIPPED
});

// [5] Comment ::= ';' ( Character - LineTerminator )*
//               | '//' ( Character - LineTerminator )*
export const Comment = createToken({
    name: "Comment",
    pattern: /(;|[/][/])[^\r\n]*/,
    group: "singleLineComments"
});

// [13] Literal ::= StringLiteral | NumberLiteral | NullLiteral
export const Literal = createToken({ name: "Literal", pattern: Lexer.NA });

// [6] HexDigit ::= [0-9] | [a-f] | [A-F]
// [7] EscapedCharacter ::= '"' '"'
//                        | '\' 'u' HexDigit HexDigit HexDigit HexDigit
//                        | '\' 'u' HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit

// [8] StringLiteral ::= '"' ( Character - '"' | EscapedCharacter )* '"'
export const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"([\t\f\v\u0020\u0021\u0023-\uD7FF\uE000-\uFFFD]|""|\\u[0-9a-fA-F]{4}[0-9a-fA-f]{4}?)*"/,
    categories: Literal
});

// [9] Integer ::= [0-9]+
//
// "Integer" is a misnomer; a more accurate name would be "WholeNumber"
//const Integer = createToken({ name: "Integer", pattern: /[0-9]+/ });

// [10] Exponent ::= [Ee] [+-]? Integer
// [11] NumberLiteral ::= Integer '.' [0-9]* Exponent?
//                      | '.' Integer Exponent?
//                      | Integer Exponent?
//                      | 'nan' | 'infinity'
export const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /(\d+\.\d*|\d+|\.\d+)([Ee][+-]?[0-9]+)?/,
    categories: Literal
});

// [14] Identifier ::= ( AlphabeticCharacter | '_' | '$' | '!')
//                         ( AlphaNumericCharacter | '_' | '$' )*
//
// "FormCalc identifiers are case sensitive".
// However, "The names of the FormCalc functions are case insensitive, but are not reserved."
// "Case insensitivity of built-in function names is mandated by FormCalc's historical legacy."
export const Identifier = createToken({
    name: "Identifier",
    //pattern: /[a-zA-Z_$!][a-zA-Z0-9_$]*/
    pattern: /[a-zA-Z_$!\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376-\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06E5-\u06E6\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4-\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u09FC\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60-\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0CF1-\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E46\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5-\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183-\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3006\u3031-\u3035\u303B-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A-\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7B9\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD-\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5-\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC][a-zA-Z0-9_$\u00B2-\u00B3\u00B5\u00B9-\u00BA\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376-\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u0660-\u0669\u066E-\u066F\u0671-\u06D3\u06D5\u06E5-\u06E6\u06EE-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07C0-\u07EA\u07F4-\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0966-\u096F\u0971-\u0980\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09E6-\u09F1\u09F4-\u09F9\u09FC\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A66-\u0A6F\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0AE6-\u0AEF\u0AF9\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B66-\u0B6F\u0B71-\u0B77\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0BE6-\u0BF2\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60-\u0C61\u0C66-\u0C6F\u0C78-\u0C7E\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0CE6-\u0CEF\u0CF1-\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D58-\u0D61\u0D66-\u0D78\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DE6-\u0DEF\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E46\u0E50-\u0E59\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F20-\u0F33\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F-\u1049\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u1090-\u1099\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1369-\u137C\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A16\u1A20-\u1A54\u1A80-\u1A89\u1A90-\u1A99\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B50-\u1B59\u1B83-\u1BA0\u1BAE-\u1BE5\u1C00-\u1C23\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5-\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2070-\u2071\u2074-\u2079\u207F-\u2089\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2150-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2-\u2CF3\u2CFD\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u3192-\u3195\u31A0-\u31BA\u31F0-\u31FF\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7B9\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA830-\uA835\uA840-\uA873\uA882-\uA8B3\uA8D0-\uA8D9\uA8F2-\uA8F7\uA8FB\uA8FD-\uA8FE\uA900-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF-\uA9D9\uA9E0-\uA9E4\uA9E6-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5-\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]*/
});

// [12] NullLiteral ::= 'null'

// [22] AdditiveOperator ::= '+' | '-'
export const AdditiveOperator = createToken({ name: 'AdditiveOperator', pattern: Lexer.NA });

// [23] MultiplicativeOperator ::= '*' | '/'
export const MultiplicativeOperator = createToken({ name: 'MultiplicativeOperator', pattern: Lexer.NA });

// [18] LogicalOrOperator ::= '|' | 'or'
export const LogicalOrOperator = createToken({ name: 'LogicalOrOperator', pattern: Lexer.NA });

// [19] LogicalAndOperator ::= '&' | 'and'
export const LogicalAndOperator = createToken({ name: 'LogicalAndOperator', pattern: Lexer.NA });

// [20] EqualityOperator ::= '==' | '<>' | 'eq' | 'ne'
export const EqualityOperator = createToken({ name: 'EqualityOperator', pattern: Lexer.NA });

// [21] RelationalOperator ::= '<=' | '>=' | '<' | '>' | 'le' | 'ge' | 'lt' | 'gt'
export const RelationalOperator = createToken({ name: 'RelationalOperator', pattern: Lexer.NA });

// [24] UnaryOperator ::= '-' | '+' | 'not'
export const UnaryOperator = createToken({ name: 'UnaryOperator', pattern: Lexer.NA });

// [15] Keyword ::= 'if' | 'then' | 'elseif' | 'else' | 'endif'
//                | 'or' | 'and' | 'not' | 'eq' | 'ne'
//                | 'le' | 'ge' | 'lt' | 'gt'
//                | 'null' | 'this' | 'nan' | 'infinity' | 'true' | 'false'
// [16] ReservedKeyword := | 'while' | 'do' | 'endwhile' | 'end'
//                         | 'for' | 'upto' | 'downto' | 'step' | 'endfor'
//                         | 'foreach' | 'in' | 'break' | 'continue' |
//                         | 'var' | 'func' | 'endfunc' | 'throw' | 'return' | 'exit'
//
// "Keywords in FormCalc are reserved words and are case insensitive."
export const If = createToken({ name: 'If', pattern: /if/i, longer_alt: Identifier });
export const Then = createToken({ name: 'Then', pattern: /then/i, longer_alt: Identifier });
export const ElseIf = createToken({ name: 'ElseIf', pattern: /elseif/i, longer_alt: Identifier });
export const Else = createToken({ name: 'Else', pattern: /else/i, longer_alt: Identifier });
export const EndIf = createToken({ name: 'EndIf', pattern: /endif/i, longer_alt: Identifier });
export const Or = createToken({ name: 'Or', pattern: /or/i, longer_alt: Identifier, categories: LogicalOrOperator });
export const And = createToken({ name: 'And', pattern: /and/i, longer_alt: Identifier, categories: LogicalAndOperator });
export const Not = createToken({ name: 'Not', pattern: /not/i, longer_alt: Identifier, categories: UnaryOperator });
export const EQ = createToken({ name: 'EQ', pattern: /eq/i, longer_alt: Identifier, categories: EqualityOperator });
export const NE = createToken({ name: 'NE', pattern: /ne/i, longer_alt: Identifier, categories: EqualityOperator });
export const LE = createToken({ name: 'LE', pattern: /le/i, longer_alt: Identifier, categories: RelationalOperator });
export const GE = createToken({ name: 'GE', pattern: /ge/i, longer_alt: Identifier, categories: RelationalOperator });
export const LT = createToken({ name: 'LT', pattern: /lt/i, longer_alt: Identifier, categories: RelationalOperator });
export const GT = createToken({ name: 'GT', pattern: /gt/i, longer_alt: Identifier, categories: RelationalOperator });
export const Null = createToken({ name: 'Null', pattern: /null/i, longer_alt: Identifier, categories: Literal });
export const NAN = createToken({ name: 'NAN', pattern: /nan/i, longer_alt: Identifier, categories: Literal });
export const PositiveInfinity = createToken({ name: 'Infinity', pattern: /infinity/i, longer_alt: Identifier, categories: Literal });
export const True = createToken({ name: 'True', pattern: /true/i, longer_alt: Identifier, categories: Literal });
export const False = createToken({ name: 'False', pattern: /false/i, longer_alt: Identifier, categories: Literal });
export const While = createToken({ name: 'While', pattern: /while/i, longer_alt: Identifier });
export const Do = createToken({ name: 'Do', pattern: /do/i, longer_alt: Identifier });
export const EndWhile = createToken({ name: 'EndWhile', pattern: /endwhile/i, longer_alt: Identifier });
export const End = createToken({ name: 'End', pattern: /end/i, longer_alt: Identifier });
export const For = createToken({ name: 'For', pattern: /for/i, longer_alt: Identifier });
export const UpTo = createToken({ name: 'UpTo', pattern: /upto/i, longer_alt: Identifier });
export const DownTo = createToken({ name: 'DownTo', pattern: /downto/i, longer_alt: Identifier });
export const Step = createToken({ name: 'Step', pattern: /step/i, longer_alt: Identifier });
export const EndFor = createToken({ name: 'EndFor', pattern: /endfor/i, longer_alt: Identifier });
export const ForEach = createToken({ name: 'ForEach', pattern: /foreach/i, longer_alt: Identifier });
export const In = createToken({ name: 'In', pattern: /in/i, longer_alt: Identifier });
export const Break = createToken({ name: 'Break', pattern: /break/i, longer_alt: Identifier });
export const Continue = createToken({ name: 'Continue', pattern: /continue/i, longer_alt: Identifier });
export const Var = createToken({ name: 'Var', pattern: /var/i, longer_alt: Identifier });
export const Func = createToken({ name: 'Func', pattern: /func/i, longer_alt: Identifier });
export const EndFunc = createToken({ name: 'EndFunc', pattern: /endfunc/i, longer_alt: Identifier });
export const Throw = createToken({ name: 'Throw', pattern: /throw/i, longer_alt: Identifier });
export const Return = createToken({ name: 'Return', pattern: /return/i, longer_alt: Identifier });
export const Exit = createToken({ name: 'Exit', pattern: /exit/i, longer_alt: Identifier });

// [17] Operator ::= '=' | '|' | '&' | '==' | '<>' | '<='
//                 | '>=' | '<' | '>' | '+' | '-' | '*' | '/'
export const Equals = createToken({ name: 'Equals', pattern: /=/ });
export const Pipe = createToken({ name: 'Pipe', pattern: /[|]/, categories: LogicalOrOperator });
export const Ampersand = createToken({ name: 'Ampersand', pattern: /[&]/, categories: LogicalAndOperator });
export const EqualsEquals = createToken({ name: 'EqualsEquals', pattern: /==/, categories: EqualityOperator });
export const NotEquals = createToken({ name: 'NotEquals', pattern: /<>/, categories: EqualityOperator });
export const LessThanEquals = createToken({ name: 'LessThanEquals', pattern: /<=/, categories: RelationalOperator });
export const GreaterThanEquals = createToken({ name: 'GreaterThanEquals', pattern: />=/, categories: RelationalOperator });
export const LessThan = createToken({ name: 'LessThan', pattern: /</, categories: RelationalOperator });
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/, categories: RelationalOperator });
export const Plus = createToken({ name: 'Plus', pattern: /[+]/, categories: [AdditiveOperator, UnaryOperator] });
export const Minus = createToken({ name: 'Minus', pattern: /[-]/, categories: [AdditiveOperator, UnaryOperator] });
export const Asterisk = createToken({ name: 'Asterisk', pattern: /[*]/, categories: MultiplicativeOperator });
export const Slash = createToken({ name: 'Slash', pattern: /[/]/, categories: MultiplicativeOperator });

// [25] Separator ::= '(' | ')' | '[' | ']' | ',' | '.' | '..' | '.#' | '.*'
export const LeftParentheses = createToken({ name: 'LeftParentheses', pattern: /[(]/ });
export const RightParentheses =  createToken({ name: 'RightParentheses', pattern: /[)]/ });
export const LeftBracket = createToken({ name: 'LeftBracket', pattern: /\[/ });
export const RightBracket = createToken({ name: 'RightBracket', pattern: /\]/ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Period = createToken({ name: 'Period', pattern: /[.]/ });
export const PeriodPeriod = createToken({ name: 'PeriodPeriod', pattern: /[.]{2}/ });
export const PeriodHash = createToken({ name: 'PeriodHash', pattern: /[.][#]/ });
export const PeriodAsterisk = createToken({ name: 'PeriodAsterisk', pattern: /[.][*]/ });

// [26] Token ::= Literal | Keyword | Identifier | Operator | Separator

export const allTokens = [
    // putting this first generally speeds up lexing
    WhiteSpace,

    Comment,

    NumberLiteral,
    StringLiteral,

    // keywords
    If,
    Then,
    ElseIf,
    Else,
    EndIf,
    Or,
    And,
    Not,
    EQ,
    NE,
    LE,
    GE,
    LT,
    GT,
    Null,
    NAN,
    PositiveInfinity,
    True,
    False,
    While,
    EndWhile,
    UpTo,
    DownTo,
    Step,
    EndFor,
    ForEach,
    In,
    Break,
    Continue,
    Var,
    Func,
    EndFunc,
    Throw,
    Return,
    Exit,
    For,
    Do,
    End,

    // Identifier token must appear after all the keyword tokens
    Identifier,

    Pipe,
    Ampersand,
    NotEquals,
    EqualsEquals,
    Equals,
    LessThanEquals,
    LessThan,
    GreaterThanEquals,
    GreaterThan,
    Plus,
    Minus,
    Asterisk,
    Slash,
    LeftParentheses,
    RightParentheses,
    LeftBracket,
    RightBracket,
    Comma,
    PeriodAsterisk,
    PeriodHash,
    PeriodPeriod,
    Period,

    Literal,
    AdditiveOperator,
    MultiplicativeOperator,
    LogicalOrOperator,
    LogicalAndOperator,
    EqualityOperator,
    RelationalOperator,
    UnaryOperator
];
