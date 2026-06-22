# @fakehost/entity-store

Typed entity collection for building fakes that need CRUD operations and observable mutation events.

### Example usage

```ts
import { EntityState, DeepPartial } from '@fakehost/entity-store'
import { numberGenerator } from '@fakehost/entity-store'

type Order = {
    orderId: number
    symbol: string
    price: number
    status: 'open' | 'partial' | 'filled'
}

const createOrder = (orderId: number, defaults?: DeepPartial<Order>): Order => ({
    orderId,
    symbol: 'AAPL',
    price: 100,
    status: 'open',
    ...defaults,
})

const orderState = new EntityState<Order, 'orderId'>({
    // the unique identifier field — supports dot notation e.g. 'payload.id'
    idField: 'orderId',
    // how to generate the next id (numberGenerator, bigintGenerator, uuidLikeGenerator are provided)
    idFactory: numberGenerator(),
    // factory for creating new entities
    entityFactory: createOrder,
    // seed the collection on construction
    initialState: { count: 10 },
    // emit a new order every second, paused until start() is called
    generator: { interval: 1_000, fn: state => state.create(), started: false },
})
```

The `state` object has the following methods and properties:

- `get(id): T | undefined` — get entity by id
- `getAll(): ReadonlyArray<T>` — all entities
- `filter(predicate): T[]` — filter entities
- `find(predicate): T | undefined` — find an entity
- `has(id): boolean` — check existence
- `size: number` — current collection size
- `createdCount: number` — total created since last reset (including deleted)
- `create(defaults?): { entity: T }` — create a new entity with an auto-generated id
- `update(delta): { entity: T } | { error: 'KEY_NOT_FOUND' }` — deep-merge a delta onto an existing entity; the id field is required in the delta
- `delete(id): { entity: T } | { error: 'KEY_NOT_FOUND' }` — remove an entity
- `reset(): void` — restore to initial state
- `stream$: Observable<['create' | 'update' | 'delete', T]>` — RxJS stream of mutation events
- `on(event, handler)` / `off(event, handler)` — subscribe to `'create'`, `'update'`, `'delete'`, or `'reset'` events
- `setGenerator(interval, fn)` — install or replace the interval-based generator
- `start()` — enable generator ticks
- `stop()` — pause generator ticks
- `isGenerating: boolean`

### entityFactory

The factory receives the auto-generated id, any caller-supplied defaults, and a read-only view of the current collection. The collection view can be used to derive values relative to existing entities (e.g. price momentum, sequential numbering).

```ts
import { DeepPartial, EntityStateView } from '@fakehost/entity-store'

const createOrder = (
    orderId: number,
    defaults: DeepPartial<Order> | undefined,
    state: EntityStateView<Order, 'orderId'>,
): Order => ({
    orderId,
    symbol: 'AAPL',
    // base price on the last created order
    price: state.getAll().at(-1)?.price ?? 100,
    status: 'open',
    ...defaults,
})
```

### Generator

The generator calls a function on an interval with the live state and a monotonic counter. Construct with `started: false` to keep generation paused until the fake service is ready.

```ts
const state = new EntityState<Order, 'orderId'>({
    // ...
    generator: {
        interval: 500,
        fn: (state, counter) => {
            // update existing orders
            state.filter(o => o.status !== 'filled').forEach(order => {
                state.update({ orderId: order.orderId, status: 'partial' })
            })
            // add a new order every 5 ticks
            if (counter % 5 === 0) state.create()
        },
        started: false,
    },
})

state.start() // begin generating
state.stop()  // pause
```

### initialState

Pre-seed the collection from a count (uses the entityFactory) or from a pre-built list:

```ts
// generate N entities via the factory
initialState: { count: 100 }

// load a pre-built array — items should be in ascending id order
initialState: { items: existingOrders }
```

When loading from items, pass `idFactory: numberGenerator(maxExistingId)` so that subsequent `create()` calls continue from the right id.

### License

`@fakehost/entity-store` is licensed under the [MIT License](https://mit-license.org/)
