import { HijackedRestService } from '../host/HijackedRestService'
import { HttpRestService } from '../host/HttpRestService'
import { createRouter } from '../createRouter'
import { type Methods } from '../methods'
import { RestRouter } from '../types'
import { HttpRest } from '../host/types'

export type Target = 'FakeHijacked' | 'FakeService'

export const targets: ReadonlyArray<Target> = ['FakeService', 'FakeHijacked'] as const

export const getHost = async (
    mode: Target,
    router: RestRouter,
    options: { port: number } = { port: 3000 },
): Promise<HttpRest> => {
    switch (mode) {
        case 'FakeHijacked': {
            const url = new URL(`http://remote-url:${options.port}`)
            const host = new HijackedRestService(url, router, { silent: true })
            return host
        }
        case 'FakeService': {
            const host = new HttpRestService(router, { silent: true })
            return host
        }
    }
}

export const echoRouter = (method: Methods, endPoint: string) =>
    createRouter().METHOD(method, endPoint, (req, res) => {
        res.json({
            host: req.host,
            method: req.method,
            url: req.url,
            params: req.params,
            query: req.query,
        })
    })
