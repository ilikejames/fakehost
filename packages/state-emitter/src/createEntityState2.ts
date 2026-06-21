import { At, DotNotation } from './types'
import {
    EntityFactory as EntityFactory,
    EntityState,
    IdFactory as IdFactory,
    InitialState,
} from './EntityState'
import { Key } from 'readline'

export const createEntityState2 = <T extends object>() => {
    return {
        idField: <K extends DotNotation<T, keyof T>>(id: K): EntityStateBuilder2<T, K> => {
            const entity = new EntityStateBuilder2<T, K>(id)
            return entity
        },
    }
}

type InitialState2<T extends object, TKey extends string> = T[] | Map<At<T, TKey>, T> | Set<T>

type TEntityStateBuilderRequiresEntityFactory<T extends object, TKey extends string> = {
    entityFactory: (
        factory: EntityFactory<T, TKey>,
    ) => Omit<TEntityStateBuilder<T, TKey, true>, 'entityFactory'>
}

type TEntityStateBuilder<
    T extends object,
    TKey extends string = DotNotation<T, keyof T>,
    TGenerator extends boolean = false,
    TState extends boolean = false,
> = {
    nextIdFactory(factory: IdFactory<T, TKey>): TEntityStateBuilder<T, TKey, TGenerator>
    ['entityFactory']: TGenerator extends true
        ? never
        : (factory: EntityFactory<T, TKey>) => TEntityStateBuilder<T, TKey, true, TState>
    ['initialState']: TState extends true
        ? never
        : (state: InitialState2<T, TKey>) => TEntityStateBuilder<T, TKey, TGenerator, true>
    ['initialCount']: TState extends true
        ? never
        : (
              count: number,
          ) => TGenerator extends false
              ? TEntityStateBuilderRequiresEntityFactory<T, TKey>
              : TEntityStateBuilder<T, TKey, TGenerator>
}
// | (TState extends true
//       ? never
//       : {
//             initialState: (
//                 state: InitialState2<T, TKey>,
//             ) => TEntityStateBuilder<T, TKey, TGenerator, true>
//         })
// & (TState extends true
//       ? never
//       : {
//             initialCount: (
//                 count: number,
//             ) => TGenerator extends false
//                 ? TEntityStateBuilderRequiresEntityFactory<T, TKey>
//                 : TEntityStateBuilder<T, TKey, TGenerator>
//         })

class EntityStateBuilder2<
    T extends object,
    TKey extends string,
    TGenerator extends boolean = false,
> {
    constructor(private idField: TKey) {}

    initialState(state: InitialState2<T, TKey>) {
        return this as any
    }

    initialItems(count: number) {
        return this as any
    }

    entityFactory(factory: EntityFactory<T, TKey>) {
        return this as any as TEntityStateBuilder<T, TKey, true>
    }

    nextIdFactory(factory: IdFactory<T, TKey>) {
        return this as any
    }
}

// - initialState
// - or createInitialItems // requires entityFactory, & idFactory

/*
 * .idField('a')
 * .createInitialItems(100) // requires entityFactory
 * .entityFactory(symbol => ({}))
 * .build() ?
 */

/*
 * .idField('a')
 * .initialState([{a: 1}, {a: 2}, {a: 3}])
 * .build) ?
 */

/*
 * .idField('a')
 * .initialState([{a: 1}, {a: 2}, {a: 3}])
 * .generate({interval: 1000, fn?: (state, counter) => ({}))
 * .build({start: true}) ?
 */

/*
.nextIdFactory((prev, index) => {
        // this should also pass the current count of items
        return `${prev}` + 1
    })
}
*/

type KeyValue = {
    key: string
    value: string
}

const state1 = createEntityState2<KeyValue>()
    .idField('key')
    .entityFactory(symbol => ({ key: symbol, value: '0' }))
