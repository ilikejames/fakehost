import { config } from '@/config'
/**
 * Hijack the websocket for signalr and point to the fake service
 * embedded in the web app.
 */
export const signalrReady = new Promise<void>(async resolve => {
    if (import.meta.env.VITE_BUNDLE_FAKES === 'true') {
        const { createInBrowserSignalr } = await import('@fakehost/signalr/browser')
        const { hubs } = await import('@fakehost/signalr-test-fake-svc')
        await createInBrowserSignalr<typeof hubs>({
            url: new URL(config.signalrUrl),
            hubs,
        })
        resolve()
    } else {
        resolve()
    }
})
