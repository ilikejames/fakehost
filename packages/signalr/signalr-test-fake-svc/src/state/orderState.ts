import { Order, OrderStatus } from '@fakehost/signalr-test-client-api'
import {
    createEntityState,
    DeepPartial,
    EntityState,
    numberGenerator,
} from '@fakehost/state-emitter'
import { faker } from '@faker-js/faker'

const createOrder = (orderId: number, defaults?: DeepPartial<Order>): Order => {
    faker.seed(orderId)
    return {
        orderId: orderId,
        symbol: faker.finance.currencyCode(),
        totalQuantity: faker.datatype.number({ min: 1, max: 100 }),
        filledQuantity: 0,
        price: faker.datatype.number({ min: 1, max: 100 }),
        status: OrderStatus.Open,
        ...defaults,
    }
}

const initialState = Array.from({ length: 100 }).map((_, i) => createOrder(i + 1))

const update = (state: EntityState<Order, 'orderId'>) => {
    const partial = state.filter(x => x.status !== OrderStatus.Filled)
    partial.forEach(partialOrder => {
        if (!faker.datatype.boolean()) return
        const newFilled = partialOrder.filledQuantity + faker.datatype.number({ min: 1, max: 10 })
        if (newFilled >= partialOrder.totalQuantity) {
            partialOrder.filledQuantity = partialOrder.totalQuantity
            partialOrder.status = OrderStatus.Filled
        } else {
            partialOrder.filledQuantity = newFilled
            partialOrder.status = OrderStatus.Partial
        }
        state.update(partialOrder)
    })

    Array.from({ length: faker.datatype.number({ min: 0, max: 3 }) }).forEach(() => state.create())
}

export const orderState = createEntityState<Order>()
    .idField('orderId')
    .entityFactory(createOrder)
    .nextIdFactory(numberGenerator(Math.max(...initialState.map(x => x.orderId))))
    .initialState({ items: initialState })
    .generate(100, update)
    .build()

// Start in stopped state
orderState.generator.stop()
