import { At, DotNotation } from './types'
import {
    EntityFactory as EntityFactory,
    EntityState,
    IdFactory as IdFactory,
    InitialState,
} from './EntityState'
import { K } from 'vitest/dist/types-198fd1d9'

type InitialState2<T extends object, TKey extends string> = T[] | Map<At<T, TKey>, T> | Set<T>

// type Methods = 'idField' | 'entityFactory' | 'initialState' | 'initialCount'

type RequiredFields = {
    key: true
    factory: boolean
} & {}

type StateConstraints<T extends object> = {
    key?: boolean
    factory?: boolean
    state?: boolean
}

type InitialStateConstraints<T extends object> = {
    key: false
    factory: false
    state: false
}

type Assign<A, B> = Omit<A, keyof B> & B

type RemoveNever<T> = {
    [K in keyof T as T[K] extends never ? never : K]: T[K]
}

type KeyValue = {
    key: string
    value: string
}

type isValid<
    T extends object,
    TState extends StateConstraints<T>,
    TRequired extends RequiredFields,
> = Prettify<{
    [Key in keyof TRequired]: TRequired[Key] extends true
        ? Key extends keyof TState
            ? TState[Key] extends true
                ? true
                : `Missing ${Key & string}`
            : true
        : true
}>

type Validate<T extends object> = T[keyof T] extends infer Value
    ? Value extends true
        ? never
        : Value
    : never

type Prettify<T> = {
    [Key in keyof T]: T[Key]
} & {}

// type InitialCount = (count: number) =>

type FactoryProps<T extends object> = {
    T: T
    TKey: string
    TState: StateConstraints<T>
    TRequired: RequiredFields
}

type Factory2<T extends object, TProps extends FactoryProps<T> = FactoryProps<T>> = {
    ['entityFactory']: TProps['TState']['factory'] extends true
        ? never
        : (
              factory: EntityFactory<T, TProps['TKey']>,
          ) => Factory2<T, Assign<TProps, { TState: Assign<TProps['TState'], { factory: true }> }>>
}

type Factory<
    T extends object,
    TKey extends string,
    TState extends StateConstraints<T>,
    TRequired extends RequiredFields = RequiredFields,
> = RemoveNever<{
    idField: TState['key'] extends true
        ? never
        : (id: TKey) => Factory<T, TKey, Assign<TState, { key: true }>, TRequired>
    entityFactory: TState['factory'] extends true
        ? never
        : (
              factory: EntityFactory<T, TKey>,
          ) => Factory<T, TKey, Assign<TState, { factory: true }>, TRequired>
    initialCount: TState['state'] extends true
        ? never
        : (
              count: number,
          ) => Factory<
              T,
              TKey,
              Assign<TState, { state: true }>,
              Assign<TRequired, { factory: true }>
          >
    initialItems: TState['state'] extends true
        ? never
        : (item: InitialState2<T, TKey>) => Factory<T, TKey, Assign<TState, { state: true }>>
    build: Validate<isValid<T, TState, TRequired>> extends true
        ? () => void
        : Validate<isValid<T, TState, TRequired>>
}>

type ErrorMessages = {
    missingEntityFactory: 'Missing entityFactory'
    nextIdGenerator: 'Missing nextIdGenerator'
}

export declare function createState<
    T extends object,
    TKey extends string = DotNotation<T, keyof T>,
>(key: TKey): Factory<T, TKey, InitialStateConstraints<T>>

const state1 = createState<KeyValue>('key')
    .initialCount(100)
    .idField('key')
    .entityFactory(id => ({ key: `${id}`, value: `${id}` }))
    .build()
