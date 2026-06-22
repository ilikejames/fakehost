import { bufferCount, firstValueFrom } from 'rxjs'
import { describe, test, expect, beforeEach } from 'vitest'
import { EntityState } from './EntityState'
import { bigintGenerator, numberGenerator } from './generators'
import { DeepPartial } from './types'

// ── fixture types ─────────────────────────────────────────────────────────────

type Order = {
    id: number
    payload: {
        orderId: bigint
        name: string
        description?: string
        price?: number
    }
}

const makeOrder = (orderId: bigint, defaults?: DeepPartial<Order>): Order => ({
    id: Number(orderId),
    payload: {
        name: 'order-' + orderId,
        orderId,
        ...defaults?.payload,
    },
})

const makeNumberOrder = (id: number, defaults?: DeepPartial<Order>): Order => ({
    id,
    payload: {
        name: 'order-' + id,
        orderId: BigInt(id),
        ...defaults?.payload,
    },
})

// ── initial state ─────────────────────────────────────────────────────────────

describe('initialState', () => {
    test('count — numeric id', () => {
        const state = new EntityState<Order, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: makeNumberOrder,
            initialState: { count: 3 },
        })
        expect(state.size).toBe(3)
        expect(state.getAll().map(x => x.id)).toEqual([1, 2, 3])
    })

    test('count — bigint nested id', () => {
        const state = new EntityState<Order, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: makeOrder,
            initialState: { count: 3 },
        })
        expect(state.size).toBe(3)
        expect(state.getAll().map(x => x.payload.orderId)).toEqual([1n, 2n, 3n])
    })

    test('items — next create() continues from last loaded id', () => {
        const state = new EntityState<Order, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: makeOrder,
            initialState: {
                items: [makeOrder(1n), makeOrder(2n)],
            },
        })
        const { entity } = state.create()
        expect(entity.payload.orderId).toBe(3n)
        expect(state.getAll().map(x => x.payload.orderId)).toEqual([1n, 2n, 3n])
    })

    test('items — Map<id, T> loads values correctly', () => {
        const map = new Map<bigint, Order>([
            [1n, makeOrder(1n)],
            [2n, makeOrder(2n)],
        ])
        const state = new EntityState<Order, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: makeOrder,
            initialState: { items: map },
        })
        expect(state.size).toBe(2)
        expect(state.get(1n)).toEqual(makeOrder(1n))
        expect(state.get(2n)).toEqual(makeOrder(2n))
    })

    test('items — next create() continues from last loaded id (numeric)', () => {
        const state = new EntityState<Order, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: makeNumberOrder,
            initialState: {
                items: [makeNumberOrder(5), makeNumberOrder(10)],
            },
        })
        const { entity } = state.create()
        // lastId after addItems is 10 → numberGenerator()(10) = 11
        expect(entity.id).toBe(11)
    })
})

// ── querying ──────────────────────────────────────────────────────────────────

describe('querying', () => {
    let state: EntityState<Order, 'payload.orderId'>

    beforeEach(() => {
        state = new EntityState<Order, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: makeOrder,
            initialState: { count: 3 },
        })
    })

    test('size', () => expect(state.size).toBe(3))

    test('has', () => {
        expect(state.has(1n)).toBe(true)
        expect(state.has(99n)).toBe(false)
    })

    test('get — found', () => expect(state.get(1n)).toEqual(makeOrder(1n)))

    test('get — not found', () => expect(state.get(99n)).toBeUndefined())

    test('getAll', () =>
        expect(state.getAll()).toEqual([makeOrder(1n), makeOrder(2n), makeOrder(3n)]))

    test('filter', () => {
        const results = state.filter(x => x.payload.orderId > 1n)
        expect(results.map(x => x.payload.orderId)).toEqual([2n, 3n])
    })

    test('find', () => {
        const found = state.find(x => x.payload.orderId === 2n)
        expect(found).toEqual(makeOrder(2n))
    })
})

// ── create ────────────────────────────────────────────────────────────────────

describe('create', () => {
    let state: EntityState<Order, 'payload.orderId'>

    beforeEach(() => {
        state = new EntityState<Order, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: makeOrder,
            initialState: { count: 2 },
        })
    })

    test('returns created entity', () => {
        const { entity } = state.create({ payload: { name: 'custom' } })
        expect(entity.payload.orderId).toBe(3n)
        expect(entity.payload.name).toBe('custom')
    })

    test('entity is stored and retrievable', () => {
        const { entity } = state.create()
        expect(state.get(entity.payload.orderId)).toEqual(entity)
        expect(state.size).toBe(3)
    })

    test('emits create event on stream$', async () => {
        const eventPromise = firstValueFrom(state.stream$)
        const { entity } = state.create()
        expect(await eventPromise).toEqual(['create', entity])
    })

    test('throws KEY_ALREADY_EXISTS when id collides', () => {
        expect(() =>
            state.create({ payload: { orderId: 1n } }),
        ).toThrow('KEY_ALREADY_EXISTS')
    })

    test('entityFactory receives current state snapshot', () => {
        const factoryCalls: number[] = []

        const stateWithSpy = new EntityState<Order, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: (id, _defaults, currentState) => {
                factoryCalls.push(currentState.size)
                return makeOrder(id)
            },
            initialState: {
                items: [makeOrder(1n), makeOrder(2n)],
            },
        })

        stateWithSpy.create()
        // factory was called once; at that point the state held 2 pre-loaded items
        expect(factoryCalls).toEqual([2])
    })
})

// ── delete ────────────────────────────────────────────────────────────────────

describe('delete', () => {
    let state: EntityState<Order, 'payload.orderId'>

    beforeEach(() => {
        state = new EntityState<Order, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: makeOrder,
            initialState: { count: 3 },
        })
    })

    test('returns deleted entity', () => {
        const result = state.delete(2n)
        expect('entity' in result && result.entity.payload.orderId).toBe(2n)
    })

    test('entity is removed from collection', () => {
        state.delete(2n)
        expect(state.has(2n)).toBe(false)
        expect(state.size).toBe(2)
    })

    test('emits delete event on stream$', async () => {
        const eventPromise = firstValueFrom(state.stream$)
        state.delete(1n)
        const [event, entity] = await eventPromise
        expect(event).toBe('delete')
        expect(entity.payload.orderId).toBe(1n)
    })

    test('returns KEY_NOT_FOUND for unknown id', () => {
        const result = state.delete(99n)
        expect('error' in result && result.error).toBe('KEY_NOT_FOUND')
    })
})

// ── update ────────────────────────────────────────────────────────────────────

describe('update', () => {
    let state: EntityState<Order, 'payload.orderId'>

    beforeEach(() => {
        state = new EntityState<Order, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: makeOrder,
            initialState: { count: 3 },
        })
    })

    test('merges delta and returns updated entity', () => {
        const result = state.update({ payload: { orderId: 2n, description: 'updated' } })
        expect('entity' in result).toBe(true)
        if (!('entity' in result)) return
        expect(result.entity.payload.description).toBe('updated')
        expect(result.entity.payload.name).toBe('order-2')
    })

    test('updated entity is persisted', () => {
        state.update({ payload: { orderId: 2n, description: 'persisted' } })
        expect(state.get(2n)?.payload.description).toBe('persisted')
    })

    test('emits update event on stream$ with merged entity', async () => {
        const eventPromise = firstValueFrom(state.stream$)
        state.update({ payload: { orderId: 1n, description: 'changed' } })
        const [event, entity] = await eventPromise
        expect(event).toBe('update')
        expect(entity.payload.description).toBe('changed')
        expect(entity.payload.name).toBe('order-1')
    })

    test('returns KEY_NOT_FOUND for unknown id', () => {
        const result = state.update({ payload: { orderId: 99n } })
        expect('error' in result && result.error).toBe('KEY_NOT_FOUND')
    })
})

// ── events (on / off) ─────────────────────────────────────────────────────────

describe('on / off', () => {
    test('on create fires handler', () => {
        const state = new EntityState<Order, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: makeOrder,
        })
        const received: Order[] = []
        state.on('create', e => received.push(e))
        state.create()
        expect(received).toHaveLength(1)
        expect(received[0].payload.orderId).toBe(1n)
    })

    test('off removes handler', () => {
        const state = new EntityState<Order, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: makeOrder,
        })
        const received: Order[] = []
        const handler = (e: Order) => received.push(e)
        state.on('create', handler)
        state.off('create', handler)
        state.create()
        expect(received).toHaveLength(0)
    })
})

// ── reset ─────────────────────────────────────────────────────────────────────

describe('reset', () => {
    test('restores initial count state', () => {
        const state = new EntityState<Order, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: makeNumberOrder,
            initialState: { count: 2 },
        })
        state.create()
        expect(state.size).toBe(3)
        state.reset()
        expect(state.size).toBe(2)
        expect(state.getAll().map(x => x.id)).toEqual([1, 2])
    })

    test('fires reset listener', () => {
        const state = new EntityState<Order, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: makeNumberOrder,
            initialState: { count: 1 },
        })
        let fired = false
        state.on('reset', () => { fired = true })
        state.reset()
        expect(fired).toBe(true)
    })

    test('on("delete") fires for items removed by reset()', () => {
        const state = new EntityState<Order, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: makeNumberOrder,
            initialState: { count: 2 },
        })
        state.create() // id 3 — will be removed on reset
        const deleted: number[] = []
        state.on('delete', e => deleted.push(e.id))
        state.reset()
        expect(deleted).toContain(3)
    })

    test('next create() after reset gets id starting from 1', () => {
        const state = new EntityState<Order, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: makeNumberOrder,
        })
        state.create() // id 1
        state.create() // id 2
        state.reset()
        const { entity } = state.create()
        expect(entity.id).toBe(1)
    })
})

// ── generator (start / stop / setGenerator) ───────────────────────────────────

describe('generator', () => {
    test('setGenerator emits creates on interval', async () => {
        const state = new EntityState<Order, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: makeNumberOrder,
        })
        const collected = firstValueFrom(state.stream$.pipe(bufferCount(3)))
        state.setGenerator(50, s => s.create())
        const events = await collected
        expect(events.every(([evt]) => evt === 'create')).toBe(true)
        state.stop()
    })

    test('stop() pauses the generator', async () => {
        const state = new EntityState<Order, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: makeNumberOrder,
            generator: { interval: 50, fn: s => s.create(), started: true },
        })
        state.stop()
        await new Promise(r => setTimeout(r, 150))
        expect(state.size).toBe(0)
    })

    test('started: false — does not generate until start() is called', async () => {
        const state = new EntityState<Order, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: makeNumberOrder,
            generator: { interval: 50, fn: s => s.create(), started: false },
        })
        await new Promise(r => setTimeout(r, 150))
        expect(state.size).toBe(0)

        const collected = firstValueFrom(state.stream$.pipe(bufferCount(2)))
        state.start()
        await collected
        expect(state.size).toBeGreaterThanOrEqual(2)
        state.stop()
    })

    test('isGenerating reflects enabled state', () => {
        const state = new EntityState<Order, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: makeNumberOrder,
            generator: { interval: 200, fn: s => s.create() },
        })
        expect(state.isGenerating).toBe(true)
        state.stop()
        expect(state.isGenerating).toBe(false)
        state.start()
        expect(state.isGenerating).toBe(true)
        state.stop()
    })
})
