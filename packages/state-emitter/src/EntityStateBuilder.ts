import {
    EntityFactory as EntityFactory,
    EntityState,
    IdFactory as IdFactory,
    InitialState,
} from './EntityState'
import { GeneratorFunction } from './Generator'
import { createNumberIdGenerator } from './helper'
import { At } from './types'

type CreationOptions = { create: number }

type GeneratorIntervalOptions<T, K extends string> = GeneratorFunction<T, K>

type GeneratorOptions<T, K extends string> = [
    number,
    GeneratorIntervalOptions<T, K> | CreationOptions,
]

export class EntityStateBuilder<T, K extends string> {
    private _initialState?: InitialState<T, K>
    private _entityFactory?: EntityFactory<T, K>
    private _generatorOptions?: GeneratorOptions<T, K>

    private idFactory: IdFactory<T, K>

    constructor(private idField: K) {
        this.idFactory = createNumberIdGenerator(0) as unknown as () => At<T, K>
    }

    public initialState(state: InitialState<T, K>) {
        this._initialState = state
        return this
    }

    public entityFactory(factory: EntityFactory<T, K>) {
        this._entityFactory = factory
        return this
    }

    public nextIdFactory(factory: IdFactory<T, K>) {
        this.idFactory = factory
        return this
    }

    public generate(interval: number, type: GeneratorIntervalOptions<T, K> | CreationOptions) {
        this._generatorOptions = [interval, type]
        return this
    }

    public build() {
        if (!this.idFactory) {
            console.warn('No idGenerator supplied. Using number generator')
            this.idFactory = createNumberIdGenerator(0) as unknown as () => At<T, K>
        }

        if (!this._entityFactory) {
            throw new Error('No entity generator supplied')
        }

        const state = new EntityState<T, K>({
            idField: this.idField,
            idFactory: this.idFactory,
            entityFactory: this._entityFactory,
            initialState: this._initialState,
        })

        if (this._generatorOptions) {
            if ('create' in this._generatorOptions[1]) {
                const count = this._generatorOptions[1].create
                state.generator.set(this._generatorOptions[0], state => {
                    Array.from({ length: count }).forEach(() => state.create())
                })
            } else {
                state.generator.set(this._generatorOptions[0], this._generatorOptions[1])
            }
        }

        return state
    }
}
