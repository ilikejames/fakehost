import { createInBrowserSignalr } from '@fakehost/signalr/browser'
import { hubs } from '@fakehost/signalr-test-fake-svc'

/**
 * Hijack the websocket for 'http://localhost:9999' and point to the fake service
 * embedded in the web app.
 */
;(async function () {
    await createInBrowserSignalr<typeof hubs>({
        url: new URL('http://localhost:9999'),
        hubs,
    })
})()
