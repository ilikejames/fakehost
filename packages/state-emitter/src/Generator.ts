import { EntityState } from './EntityState'

export type GeneratorFunction<T, K extends string> = (
    state: EntityState<T, K>,
    counter: number,
) => void

export class Generator<T, K extends string> {
    private fn: GeneratorFunction<T, K> | null = null
    private _enabled = true
    private _interval: number | null = null
    private _intervalId: ReturnType<typeof globalThis.setInterval> | null = null
    private counter = 0

    constructor(private state: EntityState<T, K>) {}

    set(interval: number, fn: GeneratorFunction<T, K>) {
        this.fn = fn
        this._interval = interval
        if (this._intervalId) clearInterval(this._intervalId)
        this._intervalId = setInterval(() => {
            if (this.enabled) {
                fn(this.state, this.counter++)
            }
        }, interval)
    }

    stop() {
        this._enabled = false
    }

    start() {
        this._enabled = true
    }

    get enabled() {
        return this._enabled
    }

    reset() {
        if (this._intervalId) clearInterval(this._intervalId)
        if (this.fn && this._interval) {
            this.set(this._interval, this.fn)
        }
        this.counter = 0
    }
}
