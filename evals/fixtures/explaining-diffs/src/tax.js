'use strict';

const TAX_RATE = 0.08;

function addTax(amount) {
  return Math.round(amount * (1 + TAX_RATE) * 100) / 100;
}

module.exports = { addTax, TAX_RATE };
