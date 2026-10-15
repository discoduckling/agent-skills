---
description: A pasted diff and its task, with a request to explain the change for a non-technical reader. The explaining-diffs skill should fire, and the reply should explain each change with file:line, a traced why, a call-path diagram, and an honest account of what was checked.
expected_outcome: A plain-language explainer of the discount change, with file:line locations for every hunk, reasons traced to the task, a Mermaid diagram of checkout -> applyDiscount -> addTax with the changed parts distinguished, and a checks section that says the tests were not run in this session.
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

I need to verify this change and then explain it to my product manager, who isn't technical. Explain the diff for me.

The task it implements: "Orders whose subtotal is over $100 get 10% off. The discount is applied before tax, so customers are not taxed on money they did not pay. An order of exactly $100 does not qualify. The checkout result must show the discount amount so the receipt can print it."

```diff
diff --git a/src/checkout.js b/src/checkout.js
--- a/src/checkout.js
+++ b/src/checkout.js
@@ -1,11 +1,16 @@
 'use strict';

-const { subtotal } = require('./pricing');
+const { subtotal, applyDiscount } = require('./pricing');
 const { addTax } = require('./tax');

 function checkout(cart) {
   const base = subtotal(cart.items);
-  return { subtotal: base, total: addTax(base) };
+  const discounted = applyDiscount(base);
+  return {
+    subtotal: base,
+    discount: base - discounted,
+    total: addTax(discounted),
+  };
 }

 module.exports = { checkout };
diff --git a/src/pricing.js b/src/pricing.js
--- a/src/pricing.js
+++ b/src/pricing.js
@@ -1,7 +1,17 @@
 'use strict';

+const DISCOUNT_THRESHOLD = 100;
+const DISCOUNT_RATE = 0.1;
+
 function subtotal(items) {
   return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
 }

-module.exports = { subtotal };
+function applyDiscount(amount) {
+  if (amount > DISCOUNT_THRESHOLD) {
+    return amount * (1 - DISCOUNT_RATE);
+  }
+  return amount;
+}
+
+module.exports = { subtotal, applyDiscount };
diff --git a/test/checkout.test.js b/test/checkout.test.js
--- a/test/checkout.test.js
+++ b/test/checkout.test.js
@@ -9,3 +9,16 @@ test('adds tax to the subtotal', () => {
   assert.equal(result.subtotal, 40);
   assert.equal(result.total, 43.2);
 });
+
+test('takes 10% off orders over $100 before adding tax', () => {
+  const result = checkout({ items: [{ price: 75, quantity: 2 }] });
+  assert.equal(result.subtotal, 150);
+  assert.equal(result.discount, 15);
+  assert.equal(result.total, 145.8);
+});
+
+test('does not discount an order of exactly $100', () => {
+  const result = checkout({ items: [{ price: 50, quantity: 2 }] });
+  assert.equal(result.discount, 0);
+  assert.equal(result.total, 108);
+});
```
