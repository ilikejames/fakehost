import { createInBrowserSignalr } from '@fakehost/signalr/browser'
import { hubs } from '@fakehost/signalr-test-fake-svc'
import { config } from '@/config'
/**
 * Hijack the websocket for signalr and point to the fake service
 * embedded in the web app.
 */
;(async function () {
    if (config.bundleFakes) {
        await createInBrowserSignalr<typeof hubs>({
            url: new URL(config.signalrUrl),
            hubs,
        })
    }
})()
