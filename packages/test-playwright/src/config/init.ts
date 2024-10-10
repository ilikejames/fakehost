import { createServerSignalr } from '@fakehost/signalr'
import { hubs } from '@fakehost/signalr-test-fake-svc'
import { HttpRestService } from '@fakehost/fake-rest'
import { router } from '@fakehost/rest-test-fake-svc'
import { Page, BrowserContext } from '@playwright/test'
import { URL } from 'url'

export const createFakes = async () => {
    const httpHost = new HttpRestService(router, { port: 0 })
    const signalr = await createServerSignalr({
        hubs,
        url: new URL('http://localhost'),
        debug: false,
        name: 'signalr',
    })

    return {
        signalr,
        rest: httpHost,
        dispose: async () => {
            // http hosts are slooow to dispose. Just fire and forget as each test will be
            // connected to its own host
            httpHost.dispose()
            signalr.dispose()
        },
    }
}

export const initPage = async (
    { page, context }: { page: Page; context: BrowserContext },
    fakes: Awaited<ReturnType<typeof createFakes>>,
) => {
    const restUrl = getOpenApiRemoteUrl(await fakes.rest.url)
    const signalrUrl = await fakes.signalr.url

    const props = { restUrl, signalrUrl }
    await page.addInitScript(`window.config = ${JSON.stringify(props)}`)

    return {
        fakes,
        page,
        context,
    }
}

const getOpenApiRemoteUrl = (url: URL) => `${url.protocol}//${url.host}`
