import { Key } from 'path-to-regexp'
import { type Methods } from './methods'

export type Request<T extends string> = {
    method: Methods
    url: string
    host: string
    query: ExtractQueryParams<RemoveParentheses<T>>
    params: ExtractRouteParams<RemoveParentheses<T>>
    headers: HttpHeader
    body: Record<string, string> | null
}

export type Response = {
    setHeader(key: string, value: string): Response
    status: (code: number) => Response
    send: (data: object | string | number | unknown[]) => Response
    json: (data: object | string | number | unknown[]) => Response
    end: () => void
}

export type Next = () => void

export type Handler<T extends string> = (
    req: Request<T>,
    res: Response,
    next: Next,
) => void | Promise<void>

type ExtractRouteParams<T> = T extends `${string}/:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
    : T extends `${string}/:${infer Param}`
    ? { [K in Param]: string }
    : Record<string, string>

type RemoveParentheses<T extends string> = T extends `${infer Before}\(${string}\)${infer After}`
    ? `${Before}${After}`
    : T

type ExtractQueryParams<T extends string> = string extends T
    ? Record<string, string>
    : T extends `${string}?${infer U}`
    ? U extends `${infer Query}&${infer Rest}`
        ? Record<
              Query extends `${infer Key}=${string}` ? Key : never,
              Query extends `${string}=${infer Value}` ? Value : never
          > &
              ExtractQueryParams<`?${Rest}`>
        : U extends `${infer Query}`
        ? Record<
              Query extends `${infer Key}=${string}` ? Key : never,
              Query extends `${string}=${infer Value}` ? Value : never
          >
        : Record<string, string>
    : Record<string, string>

export type RouterError = Error

export type HttpHeader = {
    [key: string]: string | string[] | undefined
}

export type UseHandler<T extends string> = (handler: Handler<T>) => RestRouter
export type UseRouterWithPath<T extends string> = (path: T, router: RestRouter) => RestRouter
export type UseRouter = (router: RestRouter) => RestRouter
export type ErrorHandler = (
    err: RouterError,
    req: Request<string>,
    res: Response,
    next: Next,
) => void | Promise<void>

export type UseErrorHandler = (handler: ErrorHandler) => RestRouter

export type Route = {
    method?: Methods
    path: string | null
    handler: Handler<string> | RestRouter
    regexp: RegExp
    keys: Key[]
}

export type RestRouter = {
    get routes(): Route[]
    get errorHandlers(): ErrorHandler[]
    use: UseHandler<string> & UseRouter & UseRouterWithPath<string>
    useError: UseErrorHandler
    METHOD: <Path extends string>(method: Methods, path: Path, handler: Handler<Path>) => RestRouter
    delete: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
    get: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
    head: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
    options: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
    patch: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
    post: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
    put: <Path extends string>(path: Path, handler: Handler<Path>) => RestRouter
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any
