import { Subject, share } from 'rxjs'
import { getValueByDotNotation } from './dotNotation'
import { merge } from './merge'
import { At, DeepPartial, DotNotationPaths, RequiredFromDotNotation } from './types'

// ── public types ──────────────────────────────────────────────────────────────

/**
 * Read-only view of the collection passed to `entityFactory` so the factory
 * can inspect existing items (e.g. for relative-value or momentum calculations).
 */
export type EntityStateView<T, K extends DotNotationPaths<T>> = {
    readonly size: number
    /** Total entities created since last reset (includes deleted ones). */
    readonly createdCount: number
    getAll(): ReadonlyArray<T>
    get(id: At<T, K>): T | undefined
    has(id: At<T, K>): boolean
    filter(predicate: (entity: T) => boolean): T[]
    find(predicate: (entity: T) => boolean): T | undefined
}

/**
 * Produces a fully-formed entity.
 *
 * @param id           — the auto-generated id for this entity
 * @param defaults     — any partial values supplied by the caller
 * @param currentState — read-only snapshot of everything already in the collection
 */
export type EntityFactory<T, K extends DotNotationPaths<T>> = (
    id: At<T, K>,
    defaults: DeepPartial<T> | undefined,
    currentState: EntityStateView<T, K>,
) => T

/** Generates the next id from the previous one (undefined on first call). */
export type IdFactory<T, K extends DotNotationPaths<T>> = (
    prev: At<T, K> | undefined,
) => At<T, K>

/** Called on every generator tick with the live state and a monotonic counter. */
export type GeneratorFunction<T, K extends DotNotationPaths<T>> = (
    state: EntityState<T, K>,
    counter: number,
) => void

export type InitialState<T, K extends DotNotationPaths<T>> =
    | { count: number }
    | { items: T[] | Map<At<T, K>, T> | Set<T> }

const mutationEvents = ['create', 'update', 'delete'] as const
export type MutationEvent = (typeof mutationEvents)[number]
const otherEvents = ['reset'] as const
type OtherEvent = (typeof otherEvents)[number]
type EntityStateEvent = MutationEvent | OtherEvent

type EventHandler<T> = ((data?: T) => void) | (() => void)

export type EntityStateOptions<T, K extends DotNotationPaths<T>> = {
    idField: K
    idFactory: IdFactory<T, K>
    entityFactory: EntityFactory<T, K>
    initialState?: InitialState<T, K>
    /**
     * Optional interval-based generator. Set `started: false` to construct the
     * state paused — call `state.start()` when ready to begin emitting.
     */
    generator?: {
        interval: number
        fn: GeneratorFunction<T, K>
        /** Default: true */
        started?: boolean
    }
}

// ── error sentinels ───────────────────────────────────────────────────────────

export const KEY_NOT_FOUND = 'KEY_NOT_FOUND' as const
export const KEY_ALREADY_EXISTS = 'KEY_ALREADY_EXISTS' as const

// ── class ─────────────────────────────────────────────────────────────────────

export class EntityState<T, K extends DotNotationPaths<T>>
    implements EntityStateView<T, K>
{
    private _state = new Map<At<T, K>, T>()
    private _lastId: At<T, K> | undefined
    private _createdCount = 0
    private _mutation = new Subject<[MutationEvent, T]>()
    private _stream$ = this._mutation.pipe(share())
    private _listeners = new Map<EntityStateEvent, Array<EventHandler<T>>>()

    // generator internals
    private _generatorFn: GeneratorFunction<T, K> | null = null
    private _generatorInterval: number | null = null
    private _generatorId: ReturnType<typeof setInterval> | null = null
    private _generatorCounter = 0
    private _generatorEnabled: boolean

    constructor(private readonly options: EntityStateOptions<T, K>) {
        this._generatorEnabled = options.generator?.started ?? true
        this.reset()
        if (options.generator) {
            this.setGenerator(options.generator.interval, options.generator.fn)
        }
    }

    // ── querying ──────────────────────────────────────────────────────────────

    get size() {
        return this._state.size
    }

    /** Total number of entities created (including those later deleted). */
    get createdCount() {
        return this._createdCount
    }

    has(id: At<T, K>): boolean {
        return this._state.has(id)
    }

    get(id: At<T, K>): T | undefined {
        return this._state.get(id)
    }

    getAll(): ReadonlyArray<T> {
        return Array.from(this._state.values())
    }

    filter(predicate: (entity: T) => boolean): T[] {
        return Array.from(this._state.values()).filter(predicate)
    }

    find(predicate: (entity: T) => boolean): T | undefined {
        return Array.from(this._state.values()).find(predicate)
    }

    // ── mutations ─────────────────────────────────────────────────────────────

    /**
     * Creates a new entity with an auto-generated id.
     * Throws `KEY_ALREADY_EXISTS` if the generated id collides (indicates a
     * buggy idFactory).
     */
    create(defaults?: DeepPartial<T>): { entity: T } {
        this._lastId = this.options.idFactory(this._lastId)
        const entity = this.options.entityFactory(this._lastId, defaults, this)
        const id = getValueByDotNotation(entity, this.options.idField) as At<T, K>
        if (this._state.has(id)) throw new Error(KEY_ALREADY_EXISTS)
        this._state.set(id, entity)
        this._createdCount++
        this._emit('create', entity)
        return { entity }
    }

    delete(id: At<T, K>): { entity: T } | { error: typeof KEY_NOT_FOUND } {
        const entity = this._state.get(id)
        if (!entity) return { error: KEY_NOT_FOUND }
        this._state.delete(id)
        this._emit('delete', entity)
        return { entity }
    }

    update(
        delta: RequiredFromDotNotation<T, K>,
        options?: { preserveUndefined?: boolean },
    ): { entity: T } | { error: typeof KEY_NOT_FOUND } {
        const id = getValueByDotNotation(delta, this.options.idField) as At<T, K>
        const existing = this._state.get(id)
        if (!existing) return { error: KEY_NOT_FOUND }
        const updated = merge(existing, delta as DeepPartial<T>, options)
        this._state.set(id, updated)
        this._emit('update', updated)
        return { entity: updated }
    }

    // ── stream ────────────────────────────────────────────────────────────────

    get stream$() {
        return this._stream$
    }

    // ── event listeners ───────────────────────────────────────────────────────

    on(event: MutationEvent, handler: (data: T) => void): void
    on(event: OtherEvent, handler: () => void): void
    on(event: EntityStateEvent, handler: EventHandler<T>) {
        const existing = this._listeners.get(event) ?? []
        this._listeners.set(event, existing.concat(handler))
    }

    off(event: MutationEvent, handler: (data: T) => void): void
    off(event: OtherEvent, handler: () => void): void
    off(event: EntityStateEvent, handler: EventHandler<T>) {
        const existing = this._listeners.get(event) ?? []
        this._listeners.set(
            event,
            existing.filter(h => h !== handler),
        )
    }

    // ── reset ─────────────────────────────────────────────────────────────────

    /**
     * Restores the collection to its initial state (or empty if none was set).
     * Emits delete/update/create events for the diff, and fires 'reset' listeners.
     */
    reset() {
        const before = Array.from(this._state.entries())
        this._state.clear()
        this._createdCount = 0
        this._lastId = undefined

        const init = this.options.initialState
        if (init) {
            if ('count' in init) {
                this._generateCount(init.count)
            } else {
                this._addItems(init.items)
            }
        }

        this._resetGenerator()
        this._emitReset(before)
    }

    // ── generator control ─────────────────────────────────────────────────────

    /** Installs (or replaces) the interval-based generator. */
    setGenerator(interval: number, fn: GeneratorFunction<T, K>) {
        this._generatorFn = fn
        this._generatorInterval = interval
        if (this._generatorId) clearInterval(this._generatorId)
        this._generatorId = setInterval(() => {
            if (this._generatorEnabled) fn(this, this._generatorCounter++)
        }, interval)
    }

    /** Enables generator ticks. No-op if no generator has been set. */
    start() {
        this._generatorEnabled = true
    }

    /** Pauses generator ticks without clearing the interval. */
    stop() {
        this._generatorEnabled = false
    }

    get isGenerating(): boolean {
        return this._generatorEnabled && this._generatorId !== null
    }

    // ── private ───────────────────────────────────────────────────────────────

    private _emit(event: MutationEvent, entity: T) {
        this._mutation.next([event, entity])
        // cast needed: EventHandler<T> is a union; we know mutation listeners take data
        this._listeners.get(event)?.forEach(h => (h as (data: T) => void)(entity))
    }

    private _generateCount(count: number) {
        for (let i = 0; i < count; i++) {
            this._lastId = this.options.idFactory(this._lastId)
            const entity = this.options.entityFactory(this._lastId, undefined, this)
            this._state.set(this._lastId, entity)
            this._createdCount++
        }
    }

    /**
     * Loads pre-built items into the collection.
     * Items must be provided in ascending id order so that _lastId is correctly
     * seeded for subsequent create() calls.
     * Map is supported — values are extracted (not entries).
     */
    private _addItems(items: T[] | Map<At<T, K>, T> | Set<T>) {
        const iter: Iterable<T> = items instanceof Map ? items.values() : items
        for (const item of iter) {
            const id = getValueByDotNotation(item, this.options.idField)
            if (id !== undefined) {
                this._state.set(id, item)
                this._lastId = id
                this._createdCount++
            }
        }
    }

    private _resetGenerator() {
        if (this._generatorId) clearInterval(this._generatorId)
        this._generatorCounter = 0
        const fn = this._generatorFn
        const interval = this._generatorInterval
        if (fn !== null && interval !== null) this.setGenerator(interval, fn)
    }

    private _emitReset(before: [At<T, K>, T][]) {
        this._listeners.get('reset')?.forEach(h => h())
        const beforeIds = new Set(before.map(([id]) => id))
        for (const [id, entity] of before) {
            if (!this._state.has(id)) {
                this._emit('delete', entity)
            } else {
                this._emit('update', this._state.get(id) as T)
            }
        }
        for (const [id, entity] of this._state.entries()) {
            if (!beforeIds.has(id)) {
                this._emit('create', entity)
            }
        }
    }
}
