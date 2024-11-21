import { Key } from 'path-to-regexp'
import { type Methods } from './methods'

export type ExtendableRecord<T extends object> = Prettify<
    T & {
        [key: string]: string | undefined
    }
>

export type Request<T extends string = string> = {
    method: Methods
    url: string
    host: string
    query: ExtendableRecord<ExtractQueryParams<RemoveParentheses<`?${ExtractQuerySection<T>}`>>>
    params: ExtractRouteParams<RemoveParentheses<ExtractRouteSection<T>>>
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

export type RestHandler<T extends string = string> = (
    req: Request<T>,
    res: Response,
    next: Next,
) => void | Promise<void> | Response | Promise<Response | undefined | unknown>

export type ExtractQuerySection<T extends string> = T extends `${string}?${infer U}` ? U : ''
export type ExtractRouteSection<T extends string> = T extends `${infer U}?${string}` ? U : T

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
              Query extends `${string}=${string}` ? string | undefined : never
          > &
              ExtractQueryParams<`?${Rest}`>
        : U extends `${infer Query}`
        ? Record<
              Query extends `${infer Key}=${string}` ? Key : never,
              Query extends `${string}=${string}` ? string | undefined : never
          >
        : Record<string, string>
    : Record<string, string>

export type RouterError = Error

export type HttpHeader = {
    [key: string]: string | string[] | undefined
}

export type UseHandler<T extends string> = (handler: RestHandler<T>) => RestRouter
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
    handler: RestHandler<string> | RestRouter
    regexp: RegExp
    keys: Key[]
}

export type RestRouter = {
    get routes(): Route[]
    get errorHandlers(): ErrorHandler[]
    use: UseHandler<string> & UseRouter & UseRouterWithPath<string>
    useError: UseErrorHandler
    METHOD: <Path extends string>(
        method: Methods,
        path: Path,
        handler: RestHandler<Path>,
    ) => RestRouter
    delete: <Path extends string>(path: Path, handler: RestHandler<Path>) => RestRouter
    get: <Path extends string>(path: Path, handler: RestHandler<Path>) => RestRouter
    head: <Path extends string>(path: Path, handler: RestHandler<Path>) => RestRouter
    options: <Path extends string>(path: Path, handler: RestHandler<Path>) => RestRouter
    patch: <Path extends string>(path: Path, handler: RestHandler<Path>) => RestRouter
    post: <Path extends string>(path: Path, handler: RestHandler<Path>) => RestRouter
    put: <Path extends string>(path: Path, handler: RestHandler<Path>) => RestRouter
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any

// eslint-disable-next-line @typescript-eslint/ban-types
type EmptyObject = {}

type Prettify<T> = {
    [K in keyof T]: T[K] extends object ? Prettify<T[K]> & EmptyObject : T[K]
} & EmptyObject
