/*globals describe, it*/
var assert = require('assert');
var flat = require('../lib/flat');

describe('flat tests', function() {
  var customer_deep = {
    customer: {
      firstname: 'Chris',
      lastname: 'Brown',
    },
    purchases: [
      'Crackers',
      'Olive oil',
      'Grapefruit juice',
    ],
    age: 23,
  };

  var customer_flat = {
    'customer.firstname': 'Chris',
    'customer.lastname': 'Brown',
    'purchases[0]': 'Crackers',
    'purchases[1]': 'Olive oil',
    'purchases[2]': 'Grapefruit juice',
    'age': 23,
  };

  it('flatten() should produce prototypical flattening', function() {
    var flattened = flat.flatten(customer_deep);
    assert.deepEqual(flattened, customer_flat);
  });

  it('unflatten() should produce the deep object', function() {
    var unflattened = flat.unflatten(customer_flat);
    assert.deepEqual(unflattened, customer_deep);
  });
});
