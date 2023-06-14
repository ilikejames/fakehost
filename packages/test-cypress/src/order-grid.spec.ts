import { startFakeEnv } from './support/fakes'
import { orderState } from '@fakehost/signalr-test-fake-svc'
import { Order, OrderStatus } from '@fakehost/signalr-test-client-api'

describe('order / grid', async () => {
    const { mockedFetch, mockedSocket } = await startFakeEnv()

    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad: async win => {
                cy.stub(win, 'fetch').callsFake(mockedFetch)
                cy.stub(win, 'WebSocket').callsFake(mockedSocket)
            },
        })
    })

    afterEach(() => {
        // reset state between tests
        orderState.reset()
    })

    it('should display orders', () => {
        cy.waitUntil(matchTopRow(100))
        parseOrderTable(cy.get('table'), 5).then(rows => {
            expect(rows.length).equal(5)
            rows.forEach(row => {
                expect(row.status).equal('Open')
                expect(row.percentFilled).equal(0)
            })
        })
    })

    it('orders are updated in the grid', () => {
        cy.waitUntil(matchTopRow(100))
        cy.log('Before:')
        parseOrderTable(cy.get('table'), 1)
            .then(rows => rows[0])
            .as('beforeRow')
            .then(row => cy.log('beforeRow', row))

        cy.get('@beforeRow').then(row => {
            expect(row).containSubset({
                status: 'Open',
                percentFilled: 0,
                filledQuantity: 0,
            })
        })

        cy.log('Updating top row...')
        cy.get<OrderRow>('@beforeRow')
            .then(row => {
                return orderState.update({
                    orderId: row.orderId,
                    status: OrderStatus.Partial,
                    filledQuantity: Math.floor(row.totalQuantity / 2),
                })
            })
            .as('updatedOrder')

        cy.log('It is updated in the table')
        cy.waitUntil(() => {
            return parseOrderTable(cy.get('table'), 1).then(rows => rows[0].status !== 'Open')
        })
        parseOrderTable(cy.get('table'), 1)
            .then(rows => rows[0])
            .as('afterRow')
            .then(row => cy.log('afterRow', row))

        cy.get('@afterRow').then(row => {
            cy.get<Order>('@updatedOrder').then(update => {
                expect(row).containSubset({
                    status: 'Partially Filled',
                    percentFilled: 50,
                    filledQuantity: update!.filledQuantity,
                })
            })
        })
    })

    it('new orders arrive', () => {
        cy.waitUntil(matchTopRow(100))

        cy.wrap(orderState)
            .then(orderState => orderState.create())
            .as('newOrder')

        cy.log('And it appears at the top of the grid')

        cy.get<Order>('@newOrder').then(newOrder => {
            cy.waitUntil(matchTopRow(newOrder.orderId))
            parseOrderTable(cy.get('table'), 1).then(([row]) => {
                expect(row).containSubset({
                    orderId: newOrder.orderId,
                    status: 'Open',
                    symbol: row.symbol,
                    price: row.price,
                    totalQuantity: row.totalQuantity,
                })
            })
        })
    })

    it('orders are removed', () => {
        const rowIndex = 0
        cy.waitUntil(matchTopRow(100))

        parseOrderTable(cy.get('table'), rowIndex + 1)
            .then(rows => rows[rowIndex])
            .as('beforeRow')
            .then(row => cy.log('beforeRow', row))

        cy.get<OrderRow>('@beforeRow').then(row => {
            return cy
                .wrap(orderState)
                .then(state => state.delete(row.orderId))
                .as('deletedOrder')
        })
        cy.log('Then it is removed from the grid')
        cy.waitUntil(() =>
            cy.get<OrderRow>('@beforeRow').then(row =>
                parseOrderTable(cy.get('table'), rowIndex + 1).then(rows => {
                    return rows[rowIndex].orderId !== row.orderId
                }),
            ),
        )
    })
})

type OrderRow = {
    orderId: number
    status: string
    symbol: string
    price: number
    totalQuantity: number
    filledQuantity: number
    percentFilled: number
}

const parseOrderTable = (
    root: Cypress.Chainable,
    maxRows = Number.MAX_SAFE_INTEGER,
): Cypress.Chainable<OrderRow[]> => {
    const rows = parseTable(
        root,
        new Map([
            [
                'Percent Filled',
                (el: HTMLElement) => {
                    const progressBar = el.querySelector('[role="progressbar"]')
                    return progressBar?.getAttribute('aria-valuenow')
                },
            ],
        ]),
        maxRows,
    )
    return rows.then(rows => {
        const rowItems = rows.map(
            row =>
                ({
                    orderId: Number(row['orderId']),
                    status: row['status'] as string,
                    symbol: row['symbol'] as string,
                    price: Number(row['price']),
                    totalQuantity: Number(row['totalQuantity']),
                    filledQuantity: Number(row['filledQuantity']),
                    percentFilled: Number(row['Percent Filled']),
                } as OrderRow),
        )
        return rowItems
    })
}

const parseTable = (
    root: Cypress.Chainable,
    customParser?: Map<string, (el: HTMLElement) => unknown>,
    maxRows = Number.MAX_SAFE_INTEGER,
) => {
    const headerMap = new Map<string, string>()

    root.as('root')

    cy.get('@root')
        .find('th')
        .each(headers => {
            const colId = headers.attr('data-colid')
            const text = headers.text()
            console.log('colId=', colId, 'text=', text)
            if (colId) {
                headerMap.set(colId, text)
            }
        })
        .then(() => headerMap)
        .as('headerMap')

    cy.get('@headerMap').then(() => {
        const rows: Record<string, unknown>[] = []
        cy.get('@root')
            .find('tbody tr')
            .each((row, i) => {
                if (i >= maxRows) {
                    return
                }
                row.find('td').each((j, cell) => {
                    const colId = cell.getAttribute('data-colid')
                    rows[i] = rows[i] || {}
                    const parser = customParser?.get(colId!)
                    rows[i][colId!] = parser ? parser(cell) : cell.textContent!
                })
            })
            .then(() => rows)
            .as('rows')
    })

    return cy.get<Record<string, unknown>[]>('@rows')
}

const matchTopRow = (id: number) => {
    return () => parseOrderTable(cy.get('table'), 1).then(rows => rows[0].orderId === id)
}
