import { startFakeEnv } from './support/fakes'
import { NewOrder, OrderSideEnum } from '@fakehost/rest-generated-client-api'
import { orderRoute } from '@fakehost/rest-test-fake-svc'

const contentTypes = [
    'application/x-www-form-urlencoded',
    'application/json',
    'multipart/form-data',
] as const

type ContentType = (typeof contentTypes)[number]

describe('rest / post', async () => {
    const { mockedFetch, mockedSocket } = await startFakeEnv()

    const validOrder: Required<NewOrder> = {
        symbol: 'AAPL',
        quantity: 100,
        side: OrderSideEnum.Sell,
    }

    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad: win => {
                cy.stub(win, 'fetch').callsFake(mockedFetch)
                cy.stub(win, 'WebSocket').callsFake(mockedSocket)
            },
        })
    })

    for (const contentType of contentTypes) {
        it(`success: send "${contentType}"`, () => {
            openForm()
            fillForm(validOrder, contentType)
            cy.get('@dialog').within(() => {
                cy.get('.MuiAlert-icon > svg').should(
                    'have.attr',
                    'data-testid',
                    'SuccessOutlinedIcon',
                )
                cy.get('.MuiAlert-message')
                    .then(el => JSON.parse(el.text()))
                    .then(v => {
                        expect(v).to.contain(validOrder)
                        expect(v.id).to.be.of.a('number')
                    })
            })
        })

        it(`error: "unknown symbol" with "${contentType}" payload`, () => {
            openForm()
            const order = { ...validOrder, symbol: 'UNKNOWN' }
            fillForm(order, contentType)
            cy.get('@dialog').within(() => {
                cy.get('.MuiAlert-icon > svg').should(
                    'have.attr',
                    'data-testid',
                    'ErrorOutlineIcon',
                )
                cy.get('.MuiAlert-message').should('have.text', 'Unknown symbol: UNKNOWN')
            })
        })

        it(`error: unexpected error with "${contentType}" payload`, () => {
            // The real remote can occasionally fail due to upstream issues.
            cy.log('Service is configured to throw "Unexpected error occurred"')
            // We could just assign this directly, but that would require we do
            // a clean up after the test. Utilizing a stub so that it automatically
            // restores the original value after the test.
            cy.stub(orderRoute.controls, 'shouldThrowUnexpected').value(true)

            openForm()

            fillForm(validOrder, contentType)
            cy.get('@dialog').within(() => {
                cy.get('.MuiAlert-icon > svg').should(
                    'have.attr',
                    'data-testid',
                    'ErrorOutlineIcon',
                )
                cy.get('.MuiAlert-message').should('have.text', 'Unexpected error occurred')
            })
        })

        it(`error: "invalid quantity" with "${contentType}" payload`, () => {
            openForm()
            const order = { ...validOrder, quantity: 0 }
            fillForm(order, contentType)
            cy.get('@dialog').within(() => {
                cy.get('.MuiAlert-icon > svg').should(
                    'have.attr',
                    'data-testid',
                    'ErrorOutlineIcon',
                )
                cy.get('.MuiAlert-message').should(
                    'have.text',
                    'Quantity should be greater than zero',
                )
            })
        })
    }
})

const fillForm = (values: Required<NewOrder>, contentType: ContentType) => {
    cy.get('@dialog').within(() => {
        cy.get('input[name="symbol"]').type(values.symbol)
        cy.get('input[name="quantity"]').type(values.quantity.toString())
        cy.get('input[name="side"]').check(values.side)
        cy.get('input[name="content-type"]').check(contentType)
        cy.get('button[type="submit"]').click()
    })
}

const openForm = () => {
    cy.get('button').contains('POST Data').click()
    cy.get('h2')
        .contains('Test POST Data')
        .parentsUntil('.MuiDialog-container')
        .first()
        .as('dialog')
}
