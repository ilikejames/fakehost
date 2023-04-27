import { startFakeEnv } from './support/fakes'

describe('initial', async () => {
    const { mockedFetch, mockedSocket } = await startFakeEnv()

    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad: win => {
                cy.stub(win, 'fetch').callsFake(mockedFetch)
                cy.stub(win, 'WebSocket').callsFake(mockedSocket)
            },
        })
    })

    it('should have REST & signalr results', () => {
        cy.get('[aria-label="username"]').should('have.text', 'test-user')
    })

    it('should have signalr results', () => {
        cy.get('time').contains(/^\d{1,2}:\d{1,2}:\d{1,2}((AM|PM)?)/)
    })
})
