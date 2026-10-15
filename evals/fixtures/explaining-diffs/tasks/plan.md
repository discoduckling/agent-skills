# Implementation Plan: Checkout pricing

## Task 2: Show tax on the receipt

**Description:** Return the tax amount from `checkout()` so the receipt can print it.

**Acceptance criteria:**
- [ ] `checkout()` returns `tax` alongside `total`

**Test plan:**
1. Write `test/checkout.test.js`: $40 order → `tax` is 3.2
2. Run `npm test` → new case fails (`tax` undefined)
3. Implement; rerun `npm test` → passes

## Task 3: Bulk-order discount

**Description:** Implement TASK.md.
1. Add `applyDiscount(amount)` to `src/pricing.js`, with the $100 threshold and 10% rate as named constants.
2. Export it, and call it from `checkout()` between `subtotal()` and `addTax()`.
3. Return the discount amount from `checkout()` so the receipt can print it.

**Acceptance criteria:**
- [ ] Orders over $100 get 10% off, before tax
- [ ] An order of exactly $100 gets no discount
- [ ] `checkout()` returns `discount`

**Test plan:**
1. Write `test/checkout.test.js`: $150 order → `discount` 15, `total` 145.8
2. Write `test/checkout.test.js`: exactly $100 → `discount` 0, `total` 108
3. Run `npm test` → the 2 new cases fail (`applyDiscount` missing)
4. Implement; rerun `npm test` → 3 pass, 0 fail
5. Manual: checkout a $100.01 order → `discount` 10.00, `total` 97.21
