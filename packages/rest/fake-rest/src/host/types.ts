export type HttpRestServiceOptions = {
    name: string
    port: number
    path: string
    silent: boolean
}

export type HttpRest = {
    readonly service?: any
    readonly url: Promise<URL>
    dispose: () => void
}
