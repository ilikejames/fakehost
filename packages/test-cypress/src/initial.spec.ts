import { startFakeEnv } from './support/fakes'

describe('initial', async () => {
    const { dispose, signalr, mockedFetch } = await startFakeEnv()

    before(() => {
        cy.visit('/', {
            onBeforeLoad: win => {
                cy.stub(win, 'fetch').callsFake(mockedFetch)
                cy.stub(win, 'WebSocket').callsFake(signalr.MockedSocket)
            },
        })
    })

    after(() => dispose())

    it('should have REST & signalr results', () => {
        cy.get('[aria-label="username"]').should('have.text', 'test-user')
        cy.get('time').contains(/^\d{1,2}:\d{1,2}:\d{1,2}((AM|PM)?)/)
    })
})
