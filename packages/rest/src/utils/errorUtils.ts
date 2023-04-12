import { ErrorHandler, AnyFunction, RestRouter, RouterError, Response, Request } from '../types'

export const isErrorHandler = (
    handler: string | AnyFunction | RestRouter,
): handler is ErrorHandler => {
    return typeof handler === 'function' && handler.length === 4
}

const getRouterError = (e: Error | string | unknown): RouterError => {
    if (e instanceof Error) {
        return e
    }
    if (typeof e === 'string') {
        return new Error(e)
    }
    return new Error(JSON.stringify(e))
}

export const handleServiceError = async (
    e: unknown,
    handlers: ErrorHandler[] | undefined,
    request: Request<string>,
    response: Response,
) => {
    if (handlers?.length) {
        const promises: Promise<unknown>[] = []
        const processErrorHandler = async () => {
            const handler = handlers.shift()
            if (handler) {
                await handler(getRouterError(e), request, response, async () => {
                    promises.push(processErrorHandler())
                })
            }
        }
        promises.push(processErrorHandler())
        while (promises.length) {
            await promises.shift()
        }
    } else {
        console.warn(
            'No error handler found, trying using `useError` to supply a custom error handler.',
        )
        response.status(500)
        response.send(`Internal server error`)
        response.end()
    }
}
