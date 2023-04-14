import { createInBrowserSignalr } from '@fakehost/signalr/browser'
import { chatHub, timeHub } from '@fakehost/signalr-test-fake-svc'

type SignalrPaths<T> = T extends { path: infer Path } ? Path : never

type T = SignalrPaths<typeof chatHub | typeof timeHub>

/**
 * Hijack the websocket for 'http://localhost:9999' and point to the fake service
 * embedded in the web app.
 */
;(async function () {
    const { items } = await createInBrowserSignalr({
        url: new URL('http://localhost:9999'),
        debug: true,
        name: 'localhost:9999',
        hubs: [chatHub, timeHub],
    })

    // items[]]
})()
