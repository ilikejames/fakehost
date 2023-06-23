# @fakehost/state-emitter

<!-- [![NPM Version][npm-image]][npm-url] -->


Useful pattern for building fakes that have a collection of items, especially for endpoints that notify of CRUD events to the collection.

### Example Setup

```ts
type Order = {
    orderId: bigint,
    payload: {
        name: string
    }
}

const orderState = createEntityState<Order>()
    // Required: the property that is the unique identifier for the object. Accepts dot notation e.g. "payload.id":
    .idField('orderId') 
    // Required: factory method for creating new items:
    .entityFactory(createEntity)
    // Required: how to generate the next id (numberGenerator (1, 2, ...), bigintGenerator (1n, 2n, ...), uuidLikeGenerator are supplied):
    .nextIdFactory(bigintGenerator())
    // how many to create initially:
    .initialState({ count: 2 })
    // create "1" new entity every "10_000"ms. See [Generate](#generate).
    .generate(10_000, { create: 1 })
    // generate the state object:
    .build()
```


The `orderState` object then has the following methods & properties:

- `get(id): T | undefined`: get the entity with the id.
- `getAll(): T[]`: get all the entities.
- `filter(predicate): T[]`: filter the entities
- `find(predicate): T | undefined`: find an entity
- `create(delta?): T`: create a new entity, with any possible values you need.
- `delete(id): T`: delete the entity.
- `update(partialEntityWithIdField): T`: updates the entity. Note, the identifier (set from `idField`) is required to be set.
- `reset(): void`: resets the state to the initial state
- `stream$: Observable(['create' | 'update' | 'delete',  T]) `: stream of events from the state, notifying `create`, `update`, and `delete` of entities.
- `generate`: See [Generator](#generator). 

**See a full setup [packages/signalr/signalr-test-fake-svc/src/state/orderState.ts](https://github.com/ilikejames/fakehost/blob/master/packages/signalr/signalr-test-fake-svc/src/state/orderState.ts)**

### entityFactory

```ts
import { DeepPartial } from '@fakehost/state-emitter'
import faker from '@faker-js/faker'

// ...

const createEntity = (orderId: bigint, delta: DeepPartial<Entity>): Entity => {
    // Set the faker seed. 
    // This will ensure the exact same fake data is generated for the same id
    faker.seed(Number(orderId))

    return {
        orderId,
        payload: {
            name: faker.company.companyName(),
            ...delta.payload,
        }
    }
}
```

### generator

Using the builder, to create 2 new entities every 1 second:

```ts
const state = createEntityState<Entity>()
    // ...
    .generate(1_000, { create: 2 })
    .build()
```

Or, for a fixed list (e.g. stock symbol prices we can update the prices every 0.5s)

```ts
const symbolState =  createEntityState<Symbol>()
    .initialState({ count: 100 })
    .generator(500, (state, counter) => {
        // ensure consistent sequence of changes
        faker.seed(counter)
        state.getAll().forEach(symbol => {
            // update half of prices
            if(!faker.datatype.boolean()) return
            // get the price delta, a max 1% up/down
            const delta = faker.datatype.number({
                min: symbol.price / 100 * -1,
                max: symbol.price / 100, 
                precision: 0.0001
            })
            const newPrice = symbol.price + delta
            state.update({
                ...symbol,
                price: newPrice > 0 ? newPrice : 0
            })
        })
    })
```

The `EntityState` has a `generator` property:

- `enabled`: readonly boolean
- `stop()`: stop generation, it is useful in tests to not have generation happening by default. 
- `start()`: reset any generation. By default the generator will be running.
- `set(interval: number, fn: (state: EntityState) => void)`: set a new function to generate.


## License

`@fakehost/state-emitter` is licensed under the [MIT License](https://mit-license.org/).




<!-- [npm-image]: https://img.shields.io/npm/v/ag-grid-column-builder.svg
[npm-url]: https://npmjs.org/package/ag-grid-column-builder -->