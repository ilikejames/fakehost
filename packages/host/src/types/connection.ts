import { URL } from 'url'

export type ConnectionId = string & { __connectionId: never }

export type CloseConnectionOptions = {
    code: number
    reason: string
}

export interface Connection {
    url: URL
    close: (options?: CloseConnectionOptions) => void
    readonly id: ConnectionId
    write: (message: string | Buffer) => void
    isClosed?: boolean
}
