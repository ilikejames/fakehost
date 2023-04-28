import { Subject, share } from 'rxjs'
import { Generator, GeneratorFunction } from './Generator'
import { getValueByDotNotation } from './helper'
import { merge } from './merge'
import { At, DotNotation, DeepPartial, RequiredFromDotNotation } from './types'

export type EntityFactory<T, K extends string> = (id: At<T, K>, defaults?: DeepPartial<T>) => T

export type IdFactory<T, K extends string> = (prev?: At<T, K>) => At<T, K>

export type InitialState<T, K extends string = DotNotation<T, keyof T>> =
    | { count: number }
    | { items: T[] | Map<At<T, K>, T> | Set<T> }

const mutationEvents = ['create', 'update', 'delete'] as const
export type MutationEvents = (typeof mutationEvents)[number]
const otherEvents = ['reset'] as const
type OtherEvents = (typeof otherEvents)[number]
type EntityStateEvents = MutationEvents | OtherEvents

type EventHandler<T> = ((data?: T) => void) | (() => void)

export type EntityStateOptions<T, K extends string> = {
    idField: K
    idFactory: IdFactory<T, K>
    entityFactory: EntityFactory<T, K>
    initialState?: InitialState<T, K>
    generator?: { interval: number; fn: GeneratorFunction<T, K> }
}
export class EntityState<T, K extends string> {
    private state = new Map<At<T, K>, T>()
    private lastId: At<T, K> | undefined
    private mutation = new Subject<[MutationEvents, T]>()
    private mutation$ = this.mutation.pipe(share())
    private listeners = new Map<EntityStateEvents, Array<EventHandler<T>>>()
    public readonly generator: Generator<T, K> = new Generator(this)

    constructor(private options: EntityStateOptions<T, K>) {
        this.reset()
        if (options.generator) {
            this.generator.set(options.generator.interval, options.generator.fn)
        }
    }

    on(event: MutationEvents, handler: (data: T) => void): void
    on(event: OtherEvents, handler: () => void): void
    on(event: EntityStateEvents, handler: EventHandler<T>) {
        const listeners = this.listeners.get(event) ?? []
        this.listeners.set(event, [...listeners, handler])
    }

    off(event: MutationEvents, handler: (data: T) => void): void
    off(event: OtherEvents, handler: () => void): void
    off(event: EntityStateEvents, handler: EventHandler<T>) {
        const listeners = this.listeners.get(event) ?? []
        this.listeners.set(
            event,
            listeners.filter(h => h !== handler),
        )
    }

    public get(id: At<T, K>) {
        return this.state.get(id)
    }

    public getAll() {
        return Array.from(this.state.values())
    }

    public filter(predicate: (entity: T) => boolean) {
        return this.getAll().filter(predicate)
    }

    public find(predicate: (entity: T) => boolean) {
        return this.getAll().find(predicate)
    }

    public create(defaults?: DeepPartial<T>) {
        this.lastId = this.options.idFactory(this.lastId)
        const entity = this.options.entityFactory(this.lastId, defaults)
        if (entity) {
            this.state.set(this.lastId, entity)
            this.mutation.next(['create', entity])
            this.listeners.get('create')?.forEach(h => h(entity))
        }
        return entity
    }

    public delete(id: At<T, K>) {
        const entity = this.state.get(id)
        if (entity) {
            this.state.delete(id)
            this.mutation.next(['delete', entity])
            this.listeners.get('delete')?.forEach(h => h(entity))
        }
        return entity
    }

    public update(delta: RequiredFromDotNotation<T, K>, options?: { preserveUndefined: boolean }) {
        const id = getValueByDotNotation(delta, this.options.idField) as At<T, K>
        if (!id) return
        const entity = this.state.get(id)
        if (entity) {
            const updated: T = merge(entity, delta as DeepPartial<T>, options)
            this.state.set(id, updated)
            this.mutation.next(['update', updated])
            this.listeners.get('update')?.forEach(h => h(entity))
            return updated
        }
    }

    get stream$() {
        return this.mutation$
    }

    reset() {
        this.state.clear()
        this.lastId = undefined
        if (!this.options.initialState) return
        if ('count' in this.options.initialState)
            this.generateCount(this.options.initialState.count)
        else this.addItems(this.options.initialState.items as Iterable<T>)
        this.listeners.get('reset')?.forEach(h => h())
        this.generator.reset()
    }

    private generateCount(count: number) {
        Array.from({ length: count }).forEach(() => {
            this.lastId = this.options.idFactory(this.lastId)
            const entity = this.options.entityFactory(this.lastId)
            if (entity) {
                this.state.set(this.lastId, entity)
            }
        })
    }

    private addItems(items: Iterable<T>) {
        for (const item of items) {
            const id = getValueByDotNotation(item, this.options.idField)
            if (id) {
                this.state.set(id, item)
            }
        }
    }
}
