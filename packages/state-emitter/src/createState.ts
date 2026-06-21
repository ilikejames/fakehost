import { DotNotation } from './types'
import { EntityStateBuilder } from './EntityStateBuilder'

export const createEntityState = <T>() => {
    return {
        idField: <K extends DotNotation<T, keyof T>>(id: K): EntityStateBuilder<T, K> => {
            const entity = new EntityStateBuilder<T, K>(id)
            return entity
        },
    }
}

type KeyValue = {
    key: string
    value: number
}

const state0 = createEntityState<KeyValue>().idField('key')
type Test0 = typeof state0

const state1 = createEntityState<KeyValue>()
    .idField('key')
    .createInitialItems(100)
    .entityFactory((symbol, defaults, state) => ({ key: symbol, value: 0 }))

const state2 = createEntityState<KeyValue>()
    .idField('key')
    .entityFactory((symbol, defaults, state) => ({ key: symbol, value: 0 }))

type Test2 = typeof state2
