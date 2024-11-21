export type ConnectionId = string & { __connectionId: never }

export type CloseConnectionOptions = {
    code: number
    reason: string
}

export interface ClientConnection {
    url: URL
    close: (options?: CloseConnectionOptions) => void
    readonly id: ConnectionId
    write: (message: string | Buffer) => void
    isClosed?: boolean
}
