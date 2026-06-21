import { bufferCount, firstValueFrom } from 'rxjs'
import { describe, test, expect } from 'vitest'
import { EntityState } from './EntityState'
import { bigintGenerator, numberGenerator } from './generators'
import { DeepPartial } from './types'

describe('EntityState', () => {
    test('initial with numeric id ', async () => {
        const state = new EntityState<Entity, 'id'>({
            idField: 'id',
            idFactory: numberGenerator(),
            entityFactory: createEntity,
            initialState: {
                count: 2,
            },
        })
        expect(state.getAll().length).toBe(2)
        expect(state.getAll().map(x => x.id)).toEqual([1, 2])
    })

    test('initial with nested bigint id ', async () => {
        const state = new EntityState<Entity, 'payload.orderId'>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: createBigIntEntity,
            initialState: {
                count: 2,
            },
        })
        expect(state.getAll().length).toBe(2)
        expect(state.getAll().map(x => x.payload.orderId)).toEqual([BigInt(1), BigInt(2)])
    })

    describe('methods', () => {
        const state = new EntityState<Entity, 'payload.orderId', true>({
            idField: 'payload.orderId',
            idFactory: bigintGenerator(),
            entityFactory: createBigIntEntity,
            initialState: {
                count: 2,
            },
        })

        test('by id', async () => {
            const entity = state.get(BigInt(1))
            expect(entity).toEqual(createBigIntEntity(BigInt(1)))
        })

        test('all', async () => {
            const entities = state.getAll()
            expect(entities).toEqual([createBigIntEntity(BigInt(1)), createBigIntEntity(BigInt(2))])
        })

        test('creates next id in order after initial items', async () => {
            const state = new EntityState<Entity, 'payload.orderId', true>({
                idField: 'payload.orderId',
                idFactory: bigintGenerator(),
                entityFactory: createBigIntEntity,
                initialState: {
                    items: [createBigIntEntity(BigInt(1)), createBigIntEntity(BigInt(2))],
                },
            })

            const { entity } = state.create({ payload: { name: 'new item' } })
            expect(entity).toBeDefined()
            expect(entity?.payload.orderId).toEqual(BigInt(3))
            expect(state.getAll().map(x => x.payload.orderId)).toEqual([BigInt(1), BigInt(2), BigInt(3)])
        })

        test('entityFactory can read current state via getAll() while creating', async () => {
            type PriceEntity = {
                id: number
                payload: {
                    orderId: bigint
                    name: string
                    price: number
                }
            }

            const createWithState = (
                orderId: bigint,
                defaults?: DeepPartial<PriceEntity>,
                state?: EntityState<PriceEntity, 'payload.orderId'>,
            ): PriceEntity => {
                const currentCount = state?.getAll().length ?? 0
                return {
                    id: Number(orderId),
                    payload: {
                        orderId,
                        name: defaults?.payload?.name ?? `item-${orderId}`,
                        price: currentCount,
                    },
                }
            }

            const state = new EntityState<PriceEntity, 'payload.orderId', true>({
                idField: 'payload.orderId',
                idFactory: bigintGenerator(),
                entityFactory: createWithState,
                initialState: {
                    items: [
                        { id: 1, payload: { orderId: BigInt(1), name: 'item-1', price: 10 } },
                        { id: 2, payload: { orderId: BigInt(2), name: 'item-2', price: 20 } },
                    ],
                },
            })

            const { entity } = state.create({ payload: { name: 'new item' } })
            expect(entity).toBeDefined()
            expect(entity?.payload.price).toBe(2)
        })

        test('creating', async () => {
            const eventPromise = firstValueFrom(state.stream$)
            const newItemName = `new item ${Date.now()}`
            const { entity } = state.create({ payload: { name: newItemName } })
            // newly create entity is returned
            expect(entity).toBeDefined()
            if (!entity) return

            // correctly typed identifier
            expect(typeof entity.payload.orderId).toBe('bigint')
            // it can be accessed
            expect(state.get(entity.payload.orderId)?.payload.name).toBe(newItemName)
            // it was broadcast on the event stream$
            expect(await eventPromise).toEqual(['create', entity])
            // its in the total list
            expect(state.getAll().map(x => x.payload.orderId)).contains(entity.payload.orderId)
        })

        test('creating with existing key', async () => {
            expect(() => state.create({ payload: { orderId: BigInt(1) } })).toThrow('KEY_ALREADY_EXISTS')
        })

        test('deleting', async () => {
            const { entity } = state.create({ payload: { name: 'item to delete' } })
            const eventPromise = firstValueFrom(state.stream$)

            expect(entity).toBeDefined()
            if (!entity) return

            const { entity: deletedItem } = state.delete(entity.payload.orderId)
            // deleted item is returned
            expect(deletedItem).toBeDefined()
            expect(deletedItem?.payload.orderId).toBe(entity.payload.orderId)
            // it can no longer be accessed
            expect(state.get(entity.payload.orderId)).toBeUndefined()
            // it was broadcast on the event stream$
            expect(await eventPromise).toEqual(['delete', entity])
            // it is no longer in the list
            expect(state.getAll().map(x => x.payload.orderId)).not.contains(entity.payload.orderId)
        })

        test('delete with unknown key', async () => {
            const { entity, error } = state.delete(BigInt(100))
            expect(entity).not.toBeDefined()
            expect(error).toBe('KEY_NOT_FOUND')
        })

        test('update', async () => {
            const before = state.get(BigInt(2))
            const eventPromise = firstValueFrom(state.stream$)
            const { entity: updated } = state.update({
                id: 100,
                payload: { orderId: BigInt(2), description: 'updated' },
            })
            expect(updated).toEqual({
                id: 100,
                payload: { orderId: BigInt(2), name: before?.payload.name, description: 'updated' },
            })
            // it was broadcast on the event stream$
            expect(await eventPromise).toEqual(['update', updated])
        })

        test('update with unknown key', async () => {
            const { entity, error } = state.update({
                id: 1,
                payload: { orderId: BigInt(200), description: 'updated' },
            })
            expect(entity).not.toBeDefined()
            expect(error).toBe('KEY_NOT_FOUND')
        })
    })

    describe('generating', () => {
        test('generating new items with custom generator', async () => {
            const state = new EntityState<Entity, 'id'>({
                idField: 'id',
                idFactory: numberGenerator(),
                entityFactory: createEntity,
                initialState: {
                    count: 2,
                },
            })
            const generatorPromise = firstValueFrom(state.stream$.pipe(bufferCount(2)))
            state.generator.set(200, state => state.create())
            const result = await generatorPromise
            expect(result.length).toBe(2)
            expect(result[0][0]).toBe('create')
            expect(result[1][0]).toBe('create')
        })
    })
})

type Entity = {
    id: number
    payload: {
        orderId: bigint
        name: string
        description?: string
    }
}

const createEntity = (id: number, defaults?: DeepPartial<Entity>): Entity => ({
    id,
    payload: {
        name: 'test-' + id,
        orderId: BigInt(id),
        ...defaults?.payload,
    },
})

const createBigIntEntity = (orderId: bigint, defaults?: DeepPartial<Entity>): Entity => ({
    id: Number(orderId),
    payload: {
        name: 'test-' + orderId,
        orderId: orderId,
        ...defaults?.payload,
    },
})
