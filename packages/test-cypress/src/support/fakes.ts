import { createInBrowserSignalr } from '@fakehost/signalr/browser'
import { chatHub, timeHub } from '@fakehost/signalr-test-fake-svc'
import { HijackedRestService, enableLogger, getMockedFetch } from '@fakehost/fake-rest/browser'
import { router } from '@fakehost/test-rest-api'

const hubs = {
    chatHub: chatHub,
    timeHub: timeHub,
} as const

enableLogger()

type FakeEnv<T extends object> = {
    dispose: () => void
    mockedFetch: typeof getMockedFetch
    restHost: HijackedRestService
    signalr: Awaited<ReturnType<typeof createInBrowserSignalr<T>>>
}

const SIGNALR_URL = 'http://signalr222.com'
const REST_URL = 'http://example222.com'

export const startFakeEnv = async (): Promise<FakeEnv<typeof hubs>> => {
    Cypress.on('window:before:load', async win => {
        win.localStorage.setItem('feature-use-fakes', 'true')
        ;(win as any).config = {
            restUrl: REST_URL,
            signalrUrl: SIGNALR_URL,
        }
    })

    // setup fake signalr service
    const fakeSignalr = await createInBrowserSignalr<typeof hubs>({
        hubs: hubs,
        url: new URL(SIGNALR_URL),
    })

    // setup fake rest service
    const fakeRest = new HijackedRestService(new URL(REST_URL), router, {
        name: 'rest',
        silent: false,
    })

    return {
        mockedFetch: getMockedFetch,
        restHost: fakeRest,
        signalr: fakeSignalr,
        dispose: () => {
            return Promise.all([fakeRest.dispose(), fakeSignalr.dispose()])
        },
    }
}
