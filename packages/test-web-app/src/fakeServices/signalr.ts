import { createInBrowserSignalr } from '@fakehost/signalr/browser'
import { hubs } from '@fakehost/signalr-test-fake-svc'
import { config } from '@/config'
/**
 * Hijack the websocket for signalr and point to the fake service
 * embedded in the web app.
 * NOTE: put it behind `import.meta.env.` so vite can tree-shake it away (inc deps)
 */
;(async function () {
    if (import.meta.env.VITE_BUNDLE_FAKES === 'true') {
        await createInBrowserSignalr<typeof hubs>({
            url: new URL(config.signalrUrl),
            hubs,
        })
    }
})()
