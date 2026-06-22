/**
 * Example: fake order book with live updates.
 *
 * Demonstrates:
 *  - seeded entityFactory for deterministic fake data
 *  - initialState loaded from a pre-built array
 *  - interval generator that updates existing orders and creates new ones
 *  - start / stop to control emission
 *  - stream$ subscription and on() listeners
 */
import { EntityState, DeepPartial } from '../src'
import { numberGenerator } from '../src/generators'

// ── types ─────────────────────────────────────────────────────────────────────

type OrderStatus = 'open' | 'partial' | 'filled'

type Order = {
    orderId: number
    symbol: string
    totalQuantity: number
    filledQuantity: number
    price: number
    status: OrderStatus
}

// ── entity factory ────────────────────────────────────────────────────────────

const SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']

const createOrder = (orderId: number, defaults?: DeepPartial<Order>): Order => ({
    orderId,
    symbol: SYMBOLS[orderId % SYMBOLS.length],
    totalQuantity: 100 + (orderId * 7) % 900,
    filledQuantity: 0,
    price: 10 + (orderId * 13) % 990,
    status: 'open',
    ...defaults,
})

// ── initial state ─────────────────────────────────────────────────────────────

const initialOrders = Array.from({ length: 10 }, (_, i) => createOrder(i + 1))

// ── state ─────────────────────────────────────────────────────────────────────

export const orderState = new EntityState<Order, 'orderId'>({
    idField: 'orderId',
    // seed from the max existing id so new creates don't collide
    idFactory: numberGenerator(Math.max(...initialOrders.map(o => o.orderId))),
    entityFactory: (id, defaults, state) => {
        return createOrder(id, defaults)
    },
    initialState: { items: initialOrders },
    generator: {
        interval: 500,
        fn: (state) => {
            // advance open/partial orders
            state.filter(o => o.status !== 'filled').forEach(order => {
                if (Math.random() < 0.3) return
                const fill = Math.min(
                    order.filledQuantity + Math.ceil(Math.random() * 20),
                    order.totalQuantity,
                )
                state.update({
                    orderId: order.orderId,
                    filledQuantity: fill,
                    status: fill >= order.totalQuantity ? 'filled' : 'partial',
                })
            })
            // occasionally add a new order
            if (Math.random() < 0.2) state.create()
        },
        // start paused — call orderState.start() when the fake service is ready
        started: false,
    },
})

// ── usage examples ────────────────────────────────────────────────────────────

// subscribe to the observable stream
orderState.stream$.subscribe(([event, order]) => {
    console.log(`[${event}] order ${order.orderId} — ${order.status}`)
})

// or use the simpler event listener API
orderState.on('create', order => {
    console.log(`new order: ${order.orderId} ${order.symbol}`)
})

// snapshot queries
const openOrders = orderState.filter(o => o.status === 'open')
console.log(`${openOrders.length} open orders`)

// start / stop generation
orderState.start()
// ... later ...
orderState.stop()
