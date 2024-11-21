import { config } from '@/config'

export const signalrReady = new Promise<void>(async resolve => {
    if (import.meta.env.VITE_BUNDLE_FAKES === 'true') {
        /**
         * Hijack the websocket for signalr and point to the fake service
         * embedded in the web app.
         */
        const { createBrowserSignalr } = await import('@fakehost/signalr')
        const { orderState, chatHub, orderHub, timeHub } = await import(
            '@fakehost/signalr-test-fake-svc'
        )
        await createBrowserSignalr({
            url: new URL(config.signalrUrl),
            hubs: {
                chatHub,
                orderHub,
                timeHub,
            },
        })
        // Start state generators
        orderState.generator.start()
        resolve()
    } else {
        resolve()
    }
})
