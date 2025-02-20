# formcalc-js

`formcalc-js` is an open-source, clean-room JavaScript implementation of the XFA-FormCalc language. The lexer, parser, and interpreter were built using [Chevrotain](https://github.com/chevrotain/chevrotain).

## Why?

Inspired by [htmx](https://htmx.org/) and the [locality of behavior](https://htmx.org/essays/locality-of-behaviour/) principle, I wanted to explore the adaptation of XFA-FormCalc for validation and calculated fields in HTML forms.

## Usage

```javascript
<script type="importmap">
{
  "imports": {
    "chevrotain": "https://unpkg.com/chevrotain/lib/chevrotain.mjs",
    "formcalc": "https://npmjs.com/formcalc/dist/formcalc.mjs"
  }
}
</script>

<script type="module">
    import { parseFormCalc } from "formcalc";

    const results = parseFormCalc('1 + 3')

    console.log(results.cst);
    console.log(results.lexErrors);
    console.log(results.parseErrors);
</script>
```

## References

* JetForm. [XFA-FormCalc 1.0](https://www.w3.org/1999/05/XFA/xfa-formcalc.html), 1999-05-14.
* Adobe. [XFA-FormCalc 3.3](https://helpx.adobe.com/content/dam/Adobe/specs/xfa_spec_3_3.pdf), 2012-01-09, pp 1049-1077.
* Adobe. [Designer FormCalc Reference: AEM 6.3 Forms](https://helpx.adobe.com/pdf/aem-forms/6-3/formcalc-reference.pdf), 2017-04-26.

## Accompanying Documentation

Subject to the [W3C Document Notice/License](https://www.w3.org/copyright/document-license-2023/), the lexical and syntactical grammar as implemented by `formcalc-js` can be found in the same repository:
* [Annotated Lexical and Syntactical Grammar](https://github.com/robocoder/formcalc-js/blob/main/adr/language-spec.md)

## License

[MIT License](LICENSE)
