import {deepEqual} from 'assert'
import 'mocha'

import {flatten, unflatten} from '../lib/flat'

describe('flat tests', () => {
  const deepCustomer = {
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

  const flatCustomer = {
    'customer.firstname': 'Chris',
    'customer.lastname': 'Brown',
    'purchases[0]': 'Crackers',
    'purchases[1]': 'Olive oil',
    'purchases[2]': 'Grapefruit juice',
    'age': 23,
  }

  it('flatten() should produce prototypical flattening', () => {
    const flattened = flatten(deepCustomer)
    deepEqual(flattened, flatCustomer)
  })

  it('unflatten() should produce the deep object', () => {
    const unflattened = unflatten(flatCustomer)
    deepEqual(unflattened, deepCustomer)
  })
})