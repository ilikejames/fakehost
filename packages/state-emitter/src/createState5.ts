import {
    At,
    DotNotation,
    Assign,
    RemoveFromUnion,
    AddToUnion,
    Prettify,
    RemoveNever,
} from './types'
import {
    EntityFactory,
    EntityState,
    IdFactory as IdFactory,
    IdFactory2,
    InitialState,
} from './EntityState'

type StateConstraints = {
    idFactory?: boolean
    key?: boolean
    factory?: boolean
    state?: boolean
}

type RequiredFields = StateConstraints & {}

// const Errors = {
//     FactoryFromCreate: 'Missing `entityFactory(…)` needed by `initialCount(…)`',
//     FactoryFromGenerateInterval: 'Missing `entityFactory(…)` needed by `initialCount(…)`',
//     KeyIsNotANumber: 'Key is not a number and needs a `nextIdFactory(…)`',
// }

namespace Errors {
    export type FactoryFromCreate = 'Missing `entityFactory(…)` needed by `initialCount(…)`'
    export type FactoryFromGenerateInterval =
        'Missing `entityFactory(…)` needed by `initialCount(…)`'
    export type KeyIsNotANumber = 'Key is not a number and needs a `nextIdFactory(…)`'
}

type ErrorType =
    | Errors.FactoryFromCreate
    | Errors.FactoryFromGenerateInterval
    | Errors.KeyIsNotANumber

type Factory<
    T extends object,
    TKey extends string,
    TState extends StateConstraints = StateConstraints,
    TErrors extends ErrorType = never,
> = {
    nextIdFactory: TState['idFactory'] extends true
        ? never
        : (
              factory: IdFactory2<T, TKey>,
          ) => Factory<
              T,
              TKey,
              TState & { idFactory: true },
              RemoveFromUnion<TErrors, Errors.KeyIsNotANumber>
          >
    entityFactory: TState['factory'] extends true
        ? never
        : (
              factory: EntityFactory<T, TKey>,
          ) => Factory<
              T,
              TKey,
              TState & { factory: true },
              ValidGenerator<T, TKey, TState> extends true
                  ? RemoveGeneratorErrors<TErrors>
                  : AddToUnion<RemoveGeneratorErrors<TErrors>, Errors.KeyIsNotANumber>
          >
    initialCount: TState['state'] extends true
        ? never
        : (
              count: number,
          ) => Factory<
              T,
              TKey,
              TState & { state: true },
              TState['factory'] extends true
                  ? TErrors
                  : AddToUnion<TErrors, Errors.FactoryFromCreate>
          >
    build: () => TErrors
}

/**
 * idFactory has been assigned, or the key is a number so we can use the default generator
 */
type ValidGenerator<
    T extends object,
    TKey extends string,
    TState extends StateConstraints,
> = TState['idFactory'] extends true ? true : At<T, TKey> extends number ? true : false

type RemoveGeneratorErrors<TErrors> = RemoveFromUnion<
    TErrors,
    Errors.FactoryFromCreate | Errors.FactoryFromGenerateInterval
>

// export declare function createState<
//     T extends object,
//     TKey extends string = DotNotation<T, keyof T>,
// >(key: TKey): Factory<T, TKey>

type CreateStateReturn<T extends object> = {
    idField: <K extends DotNotation<T, keyof T>>(id: K) => Factory<T, K>
}

export declare function createState<T extends object>(): CreateStateReturn<T>

type KeyValue = {
    key: string
    value: string
}

const state1 = createState<KeyValue>()
    .idField('key')
    .initialCount(100)
    .nextIdFactory(({ created }) => `${created}` + 1) // TODO: do we even need this or just extend entityFactory to include this?
    .entityFactory(id => ({ key: `${id}`, value: `${id}` }))
    // TODO: createInterval(ms: number, fn?: (state, created) => void)
    // .createInterval(1000),
    // .
    .build()
// .initialCount(100)
// .nextIdFactory((key) => `${key}`+1)
// // .idField('key')
// .entityFactory(id => ({ key: `${id}`, value: `${id}` }))
// .build()
