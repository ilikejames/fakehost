import { MockedSocket, createInBrowserSignalr } from '@fakehost/signalr/browser'
import { HijackedRestService, enableLogger, mockedFetch } from '@fakehost/fake-rest/browser'
import { router } from '@fakehost/rest-test-fake-svc'
import { chatHub, timeHub } from '@fakehost/signalr-test-fake-svc'

const hubs = {
    chatHub: chatHub,
    timeHub: timeHub,
} as const

enableLogger()

type FakeEnv<T extends object> = {
    dispose: () => void
    mockedFetch: typeof mockedFetch
    mockedSocket: typeof MockedSocket
    restHost: HijackedRestService
    signalr: Awaited<ReturnType<typeof createInBrowserSignalr<T>>>
}

const REST_URL = 'http://rest.com'
const SIGNALR_URL = 'http://signalr.com'

export const startFakeEnv = async (): Promise<FakeEnv<typeof hubs>> => {
    Cypress.on('window:before:load', async win => {
        window.localStorage.setItem('feature-use-fakes', 'true')
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
        restHost: fakeRest,
        signalr: fakeSignalr,
        mockedFetch: mockedFetch,
        mockedSocket: fakeSignalr.MockedSocket,
        dispose: () => {
            return Promise.all([fakeRest.dispose(), fakeSignalr.dispose()])
        },
    }
}
