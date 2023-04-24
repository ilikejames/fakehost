import { pathToRegexp, Key } from 'path-to-regexp'
import { type Methods } from './methods'
import {
    Handler,
    RestRouter,
    UseHandler,
    UseRouter,
    UseRouterWithPath,
    Route,
    ErrorHandler,
} from './types'

type UseParameters =
    | Parameters<UseRouter>
    | Parameters<UseHandler<string>>
    | Parameters<UseRouterWithPath<string>>

export const createRouter = (): RestRouter => {
    const routes: Route[] = []
    const errorHandlers: ErrorHandler[] = []

    const router: RestRouter = {
        get routes() {
            return routes
        },
        get errorHandlers() {
            return errorHandlers
        },
        useError: (handler: ErrorHandler) => {
            errorHandlers.push(handler)
            return router
        },
        use: (...args: UseParameters) => {
            const path = typeof args[0] === 'string' ? args[0] : ''
            const childRouter = [...args].find(isRestRouter)

            if (childRouter) {
                childRouter.routes.forEach(route => {
                    const fullPath = cleanPath(`${path}/${route.path}`)
                    const keys: Key[] = []
                    const regexp = pathToRegexp(fullPath, keys)
                    routes.push({
                        handler: route.handler,
                        method: route.method,
                        path: fullPath,
                        keys,
                        regexp,
                    })
                })
            } else if (isHandler(args[0])) {
                routes.push({
                    path: null,
                    handler: args[0],
                    regexp: /.*/,
                    keys: [],
                })
            }
            return router
        },
        METHOD: (method, path, handler) => {
            const keys: Key[] = []
            const regexp = pathToRegexp(path, keys)
            routes.push({
                method: method.toUpperCase() as Methods,
                path,
                handler: handler as Handler<string>,
                regexp,
                keys,
            })
            return router
        },
        delete: (path, handler) => router.METHOD('DELETE', path, handler),
        get: (path, handler) => router.METHOD('GET', path, handler),
        head: (path, handler) => router.METHOD('HEAD', path, handler),
        patch: (path, handler) => router.METHOD('PATCH', path, handler),
        post: (path, handler) => router.METHOD('POST', path, handler),
        put: (path, handler) => router.METHOD('PUT', path, handler),
        options: (path, handler) => router.METHOD('OPTIONS', path, handler),
    }
    return router
}

const isRestRouter = (o: RestRouter | string | Handler<string>): o is RestRouter => {
    return typeof o !== 'string' && 'routes' in o
}

export const isHandler = (o: RestRouter | string | Handler<string>): o is Handler<string> => {
    return typeof o !== 'string' && !('routes' in o)
}

const cleanPath = (s: string) => s.replace(/\/\//g, '/')
