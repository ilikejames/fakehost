import { config } from '@/config'

export const restReady = new Promise<void>(async resolve => {
    if (import.meta.env.VITE_BUNDLE_FAKES === 'true') {
        const { HijackedRestService } = await import('@fakehost/fake-rest/browser')
        const { router, enableLogger } = await import('@fakehost/rest-test-fake-svc')
        enableLogger()
        new HijackedRestService(new URL(config.restUrl), router, { name: config.restUrl })
        resolve()
    } else {
        resolve()
    }
})
