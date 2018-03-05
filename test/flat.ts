import {deepEqual} from 'assert'
import 'mocha'

import {flatten, unflatten} from '../lib/flat'

describe('flat tests', function() {
  var deepCustomer = {
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
  }

  var flatCustomer = {
    'customer.firstname': 'Chris',
    'customer.lastname': 'Brown',
    'purchases[0]': 'Crackers',
    'purchases[1]': 'Olive oil',
    'purchases[2]': 'Grapefruit juice',
    'age': 23,
  }

  it('flatten() should produce prototypical flattening', function() {
    var flattened = flatten(deepCustomer)
    deepEqual(flattened, flatCustomer)
  })

  it('unflatten() should produce the deep object', function() {
    var unflattened = unflatten(flatCustomer)
    deepEqual(unflattened, deepCustomer)
  })
})
