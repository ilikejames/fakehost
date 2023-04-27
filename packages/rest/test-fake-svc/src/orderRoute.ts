import { createRouter, Handler, Request } from '@fakehost/fake-rest'
import { NewOrder, OrderControllerApi, OrderSideEnum } from '@fakehost/rest-generated-client-api'

const validSymbols = ['AAPL', 'TSLA', 'GME']
let orderId = 0

type Args = Parameters<OrderControllerApi['placeOrderJson']>[0]
type CreatedOrder = Awaited<ReturnType<OrderControllerApi['placeOrderJson']>>

const placeOrder = ({ newOrder }: Args): CreatedOrder => {
    if (!Number.isInteger(newOrder.quantity) || newOrder.quantity! < 1) {
        throw new Error('Quantity should be greater than zero')
    }
    if (!newOrder.symbol || !validSymbols.includes(newOrder.symbol)) {
        throw new Error(`Unknown symbol: ${newOrder.symbol}`)
    }
    return {
        id: ++orderId,
        ...newOrder,
    }
}

const parseBody = (req: Request<string>): NewOrder => {
    return {
        quantity: parseInt(req.body?.quantity ?? '0'),
        symbol: req.body?.symbol,
        side: req.body?.side as OrderSideEnum,
    }
}

const postOrderHandler: Handler<string> = (req, res) => {
    if (controls.shouldThrowUnexpected) {
        res.status(400).json({ message: 'Unexpected error occurred' })
        return
    }
    const newOrder = parseBody(req)
    try {
        const order = placeOrder({ newOrder })
        res.status(201).json(order)
    } catch (ex: any) {
        res.status(400).json({ message: ex.message })
    }
}

export const orderRoute = createRouter()
    .post('/json', postOrderHandler)
    .post('/form-data', postOrderHandler)
    .post('/form', postOrderHandler)

export const controls = {
    shouldThrowUnexpected: false,
}
