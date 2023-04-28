import { describe, test, expect, vi } from 'vitest'
import { createEntityState } from './createState'
import { DeepPartial } from './types'
import { bigintGenerator } from './generators'
import { firstValueFrom } from 'rxjs'

describe('createEntityState', () => {
    const state = createEntityState<Entity>()
        .idField('orderId')
        .entityFactory(createEntity)
        .nextIdFactory(bigintGenerator())
        .initialState({ count: 2 })
        .generate(1000, { create: 1 })
        .build()

    test('getAll', () => {
        expect(state.getAll().length).toBe(2)
        expect(state.getAll().map(x => x.orderId)).toEqual([BigInt(1), BigInt(2)])
    })

    test('create', async () => {
        const eventPromise = firstValueFrom(state.stream$)
        const entity = state.create({ payload: { name: 'new item' } })
        // returns the newly created entity
        expect(entity).toBeDefined()
        expect(typeof entity.orderId).toBe('bigint')
        expect(state.get(entity.orderId)?.payload.name).toBe('new item')
        // it is in the list
        expect(state.getAll().length).toBe(3)
        expect(state.getAll().map(x => x.orderId)).toEqual([BigInt(1), BigInt(2), entity.orderId])
        // the creation was broadcast on the event stream$
        expect(await eventPromise).toEqual(['create', entity])
    })

    test('reset', async () => {
        state.create({ payload: { name: 'new item 1' } })
        state.create({ payload: { name: 'new item 2' } })
        expect(state.getAll().length).toBeGreaterThan(2)

        // resetting state
        state.reset()
        // state is reset to the initial state
        expect(state.getAll().length).toBe(2)
        expect(state.getAll().map(x => x.orderId)).toEqual([BigInt(1), BigInt(2)])
        // new items are created with the correct id
        state.create({ payload: { name: 'new item' } })
        expect(state.getAll().map(x => x.orderId)).toEqual([BigInt(1), BigInt(2), BigInt(3)])
    })

    test('get', async () => {
        const entity = state.create({ payload: { name: 'new item' } })
        const found = state.get(entity.orderId)
        expect(found).toMatchObject(entity)
        // @ts-expect-error cannot "get" with wrong type
        const mismatchedType = state.get(1)
        expect(mismatchedType).toBeUndefined()
    })

    test('update', async () => {
        const entity = state.create({ payload: { name: 'new item' } })
        const eventPromise = firstValueFrom(state.stream$)

        const updated = state.update({ orderId: entity.orderId, payload: { name: 'updated' } })

        // updated entity is returned
        expect(updated).toMatchObject({ ...entity, payload: { name: 'updated' } })
        // it can be retrieved directly
        expect(state.get(entity.orderId)?.payload.name).toBe('updated')
        // update was broadcast on the event stream$
        expect(await eventPromise).toEqual(['update', updated])
    })

    test('event: reset', () => {
        const resetSpy1 = vi.fn()
        state.on('reset', resetSpy1)
        const resetSpy2 = vi.fn()
        state.on('reset', resetSpy2)
        state.reset()
        expect(resetSpy1).toHaveBeenCalledTimes(1)
        expect(resetSpy2).toHaveBeenCalledTimes(1)

        state.off('reset', resetSpy1)
        state.reset()
        expect(resetSpy1).toHaveBeenCalledTimes(1)
        expect(resetSpy2).toHaveBeenCalledTimes(2)
    })
})

const createEntity = (id: bigint, defaults?: DeepPartial<Entity>): Entity => ({
    id: Number(id),
    orderId: id,
    ...defaults,
    payload: {
        name: 'test-' + id,
        ...defaults?.payload,
    },
})

type Entity = {
    id: number
    orderId: bigint
    payload: {
        name: string
    }
}
