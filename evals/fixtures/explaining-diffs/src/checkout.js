'use strict';

const { subtotal } = require('./pricing');
const { addTax } = require('./tax');

function checkout(cart) {
  const base = subtotal(cart.items);
  return { subtotal: base, total: addTax(base) };
}

module.exports = { checkout };
