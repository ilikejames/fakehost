import { createInBrowserSignalr } from '@fakehost/signalr/browser'
import { chatHub, timeHub } from '@fakehost/signalr-test-fake-svc'
import { HijackedRestService, enableLogger } from '@fakehost/fake-rest/browser'
import { router } from '@fakehost/test-rest-api'
import Bluebird from 'cypress/types/bluebird'

const hubs = {
    chatHub: chatHub,
    timeHub: timeHub,
} as const

enableLogger()

type FakeEnv<T extends object> = {
    dispose: () => void
    restHost: HijackedRestService
    signalr: Awaited<ReturnType<typeof createInBrowserSignalr<T>>>
}

export const startFakeEnv2 = (): Bluebird<FakeEnv<typeof hubs>> => {
    return new Cypress.Promise(resolve => {
        createInBrowserSignalr<typeof hubs>({
            hubs: hubs,
            url: new URL('http://example2.com'),
        }).then(fakeSignalr => {
            const fakeRest = new HijackedRestService(new URL('http://example.com'), router, {
                name: 'rest',
                silent: false,
            })
            resolve({
                restHost: fakeRest,
                signalr: fakeSignalr,
                dispose: () => {
                    return Promise.all([fakeRest.dispose(), fakeSignalr.dispose()])
                },
            })
        })
    })
}

export const startFakeEnv = async (): Promise<FakeEnv<typeof hubs>> => {
    Cypress.on('window:before:load', async win => {
        window.localStorage.setItem('feature-use-fakes', 'true')
    })

    const fakeSignalr = await createInBrowserSignalr<typeof hubs>({
        hubs: hubs,
        url: new URL('http://example2.com'),
    })
    // This is the last REST service...
    const fakeRest = new HijackedRestService(new URL('http://example.com'), router, {
        name: 'rest',
        silent: false,
    })

    return {
        restHost: fakeRest,
        signalr: fakeSignalr,
        dispose: () => {
            return Promise.all([fakeRest.dispose(), fakeSignalr.dispose()])
        },
    }
}
