'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { checkout } = require('../src/checkout');

test('adds tax to the subtotal', () => {
  const result = checkout({ items: [{ price: 20, quantity: 2 }] });
  assert.equal(result.subtotal, 40);
  assert.equal(result.total, 43.2);
});
