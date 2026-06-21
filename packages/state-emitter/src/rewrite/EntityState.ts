import { Subject, share } from 'rxjs'
import { Generator, GeneratorFunction } from './Generator'
import { getValueByDotNotation } from './dotNotation'
import { merge } from './merge'
import { At, DotNotation, DeepPartial, RequiredFromDotNotation, DotNotationPaths } from './types'

export type EntityFactory<T, K extends DotNotationPaths<T>> = (id: At<T, K>, defaults?: DeepPartial<T>, state?: EntityState<T, K>) => T

type IdFactory<T, K extends string> = (prev: At<T, K> | undefined, totalCreated: number) => At<T, K>

export type InitialState<T, K extends string = DotNotation<T, keyof T>> =
    | { count: number }
    | { items: T[] | Map<At<T, K>, T> | Set<T> }

const mutationEvents = ['create', 'update', 'delete'] as const
export type MutationEvents = (typeof mutationEvents)[number]
const otherEvents = ['reset'] as const
type OtherEvents = (typeof otherEvents)[number]
type EntityStateEvents = MutationEvents | OtherEvents

type EventHandler<T> = ((data?: T) => void) | (() => void)

type EntityStateOptions<T, K extends DotNotationPaths<T>, TGenerator extends boolean = true> = {
    idField: K
    idFactory: TGenerator extends true ? IdFactory<T, K> : undefined
    entityFactory: TGenerator extends true ? EntityFactory<T, K> : undefined
    initialState?: InitialState<T, K>
    generator?: { interval: number; fn: GeneratorFunction<T, K> }
}

const NOT_FOUND = undefined
const KEY_ALREADY_EXISTS = 'KEY_ALREADY_EXISTS' as const
const KEY_NOT_FOUND = 'KEY_NOT_FOUND' as const

type TBaseEntityState<T, K extends DotNotationPaths<T>> = {
    on(event: MutationEvents, handler: (data: T) => void): void
    on(event: OtherEvents, handler: () => void): void
    on(event: EntityStateEvents, handler: EventHandler<T>): void
    off(event: MutationEvents, handler: (data: T) => void): void
    off(event: OtherEvents, handler: () => void): void
    off(event: EntityStateEvents, handler: EventHandler<T>): void
    has(id: At<T, K>): boolean
    get(id: At<T, K>): T | undefined
    getAll(): T[]
    filter(predicate: (entity: T) => boolean): T[]
    find(predicate: (entity: T) => boolean): T | undefined
    delete(id: At<T, K>): { entity: T } | { error?: typeof KEY_NOT_FOUND }
    update(
        delta: RequiredFromDotNotation<T, K>,
        options?: { preserveUndefined: boolean },
    ): { entity: T } | { error?: typeof KEY_NOT_FOUND }
    stream$: import('rxjs').Observable<[MutationEvents, T]>
    reset(): void
}

export type GeneratorEntityState<T, K extends DotNotationPaths<T>> = TBaseEntityState<T, K> & {
    create(defaults?: DeepPartial<T>): { entity: T }; // | { error?: typeof KEY_ALREADY_EXISTS }
}

export type NoGeneratorEntityState<T, K extends DotNotationPaths<T>> = TBaseEntityState<T, K> & {
    create(entity: T): { entity: T }; // | { error?: typeof KEY_ALREADY_EXISTS }
}

export class EntityState<T, K extends DotNotationPaths<T>, TGenerator extends boolean = true>
    implements TBaseEntityState<T, K> {
    private state = new Map<At<T, K>, T>()
    private lastId: At<T, K> | undefined
    private createdCount = 0
    private mutation = new Subject<[MutationEvents, T]>()
    private mutation$ = this.mutation.pipe(share())
    private listeners = new Map<EntityStateEvents, Array<EventHandler<T>>>()
    public readonly generator: Generator<T, K> = new Generator(this as EntityState<T, K>);

    constructor(private options: EntityStateOptions<T, K, TGenerator>) {
        this.reset()
        if (options.generator) {
            this.generator.set(options.generator.interval, options.generator.fn)
        }
        this.mutation$.subscribe(([event, data]) => {
            switch (event) {
                case 'create':
                    return this.listeners.get('create')?.forEach(h => h(data))
                case 'update':
                    return this.listeners.get('update')?.forEach(h => h(data))
                case 'delete':
                    return this.listeners.get('delete')?.forEach(h => h(data))
                default:
                    const unhandled: never = event
                    throw new Error(`Unhandled event: ${unhandled}`)
            }
        })
    }

    on(event: MutationEvents, handler: (data: T) => void): void
    on(event: OtherEvents, handler: () => void): void
    on(event: EntityStateEvents, handler: EventHandler<T>) {
        const listeners = this.listeners.get(event) ?? []
        this.listeners.set(event, listeners.concat(handler))
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

    public has(id: At<T, K>) {
        return this.state.has(id)
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

    public create(defaults?: TGenerator extends true ? undefined | DeepPartial<T> : T) {
        if (this.options.entityFactory) {
            this.lastId = this.options.idFactory!(this.lastId, this.createdCount++)
            const entity = this.options.entityFactory(this.lastId, defaults as DeepPartial<T>, this as EntityState<T, K>)
            const key = getValueByDotNotation(entity, this.options.idField)!

            if (this.state.has(key)) {
                throw new Error('KEY_ALREADY_EXISTS')
            }
            this.state.set(key, entity)
            this.mutation.next(['create', entity])
            return { entity }
        }

        const key = getValueByDotNotation(defaults as T, this.options.idField)!
        if (this.state.has(key)) {
            throw new Error('KEY_ALREADY_EXISTS')
        }
        this.state.set(key, defaults as T)
        this.mutation.next(['create', defaults as T])
        return { entity: defaults as T }
    }

    public delete(id: At<T, K>) {
        const entity = this.state.get(id)
        if (!entity) return { error: KEY_NOT_FOUND }

        this.state.delete(id)
        this.mutation.next(['delete', entity])
        return { entity: entity as T }
    }

    public update(delta: RequiredFromDotNotation<T, K>, options?: { preserveUndefined: boolean }) {
        const id = getValueByDotNotation(delta, this.options.idField) as At<T, K>
        const entity = this.state.get(id)
        if (!entity) return { error: KEY_NOT_FOUND }

        const updated = merge(entity, delta as DeepPartial<T>, options)
        this.state.set(id, updated)
        this.mutation.next(['update', updated])
        return { entity: updated }
    }

    get stream$() {
        return this.mutation$
    }

    reset() {
        // TODO: unsure
        const before = Array.from(this.state.entries())
        this.state.clear()
        this.createdCount = 0
        this.lastId = undefined
        if (!this.options.initialState) return
        if ('count' in this.options.initialState) {
            this.generateCount(this.options.initialState.count)
        } else {
            this.addItems(this.options.initialState.items as Iterable<T>)
        }
        this.generator.reset()
        this.emitReset(before)
    }

    private emitReset(before: [At<T, K>, T][]) {
        const beforeIds = new Set(before.map(([id]) => id))
        this.listeners.get('reset')?.forEach(h => h())
        // TODO: unsure about this
        for (const [id, entity] of before) {
            if (!this.state.has(id)) {
                this.mutation.next(['delete', entity])
            } else if (this.state.get(id)) {
                this.mutation.next(['update', this.state.get(id) as T])
            }
        }

        for (const [id, entity] of this.state.entries()) {
            if (!beforeIds.has(id)) {
                this.mutation.next(['create', entity])
            }
        }
    }

    private generateCount(count: number) {
        Array.from({ length: count }).forEach(() => {
            this.lastId = this.options.idFactory!(this.lastId, this.createdCount++)
            const entity = this.options.entityFactory!(this.lastId)
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
                this.lastId = id
            }
        }
    }
}
