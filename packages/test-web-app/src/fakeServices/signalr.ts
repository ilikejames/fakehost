import { createInBrowserSignalr } from '@fakehost/signalr/browser'
import { chatHub, timeHub } from '@fakehost/signalr-test-fake-svc'

const hubs = [chatHub, timeHub] as const

;(async function () {
    const { host } = await createInBrowserSignalr({
        url: new URL('http://localhost:9999'),
        debug: true,
    })
    hubs.forEach(hub => hub.setHost(host))
})()
