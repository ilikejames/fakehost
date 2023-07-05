import { config } from '@/config'

export const signalrReady = new Promise<void>(async resolve => {
    if (import.meta.env.VITE_BUNDLE_FAKES === 'true') {
        /**
         * Hijack the websocket for signalr and point to the fake service
         * embedded in the web app.
         */
        const { createInBrowserSignalr } = await import('@fakehost/signalr/browser')
        const { hubs, state } = await import('@fakehost/signalr-test-fake-svc')
        await createInBrowserSignalr<typeof hubs>({
            url: new URL(config.signalrUrl),
            hubs,
        })
        // Start state generators
        state.orderState.generator.start()
        resolve()
    } else {
        resolve()
    }
})
