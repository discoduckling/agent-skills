---
type: llm
---

PASS only if the reply does all of the following:

1. Gives a file:line location (new-file line numbers) for every changed region of the diff, including the import change in `src/checkout.js` and the export change in `src/pricing.js`.
2. For each change, states why it was needed by pointing to a specific sentence of the task (over $100, before tax, exactly $100 excluded, discount shown on the receipt), not a generic reason such as "to implement the feature".
3. Includes a Mermaid diagram of the call path `checkout` -> `applyDiscount` -> `addTax` in which the new or changed parts are visually distinguished from the unchanged ones by styling (for example `classDef` or `style`), not only by label text.
4. Has a section on how the change was checked that does not claim any test run or result, since no command was run in this session, and says plainly that the tests were not run (or that verification is still needed).
5. Explains technical terms such as function, subtotal and test in short, plain sentences.

FAIL if any one of these is missing.
