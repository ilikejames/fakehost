export enum MessageType {
    Invocation = 1,
    StreamItem = 2,
    Completion = 3,
    StreamInvocation = 4,
    CancelInvocation = 5,
    Ping = 6,
    Close = 7,
}

export type InvocationId = string & { __invocationId: never }

export type HandshakeMessage = {
    protocol: string
    version: number
}

export type InvocationMessage<Hub> = {
    type: MessageType.Invocation
    target: keyof Hub
    invocationId: InvocationId
    arguments?: unknown[]
    streamIds?: InvocationId[]
}

export type StreamItemMessage = {
    type: MessageType.StreamItem
    item?: unknown
    invocationId: InvocationId
}

export type Ping = {
    type: MessageType.Ping
}

export type CloseMessage = {
    type: MessageType.Close
    error?: string
    allowReconnect?: boolean
}

export type StreamInvocation<Hub> = {
    type: MessageType.StreamInvocation
    target: keyof Hub
    invocationId: InvocationId
    arguments?: unknown[]
}

export type CancelInvocation = {
    type: MessageType.CancelInvocation
    invocationId: InvocationId
}

export type CompleteInvocation = {
    type: MessageType.Completion
    error?: string
    invocationId: InvocationId
    result?: unknown
}

export type InboundMessage<Hub> =
    | CompleteInvocation
    | InvocationMessage<Hub>
    | StreamInvocation<Hub>
    | StreamItemMessage
    | CancelInvocation
    | Ping
    | CloseMessage

export const isHandshakeMessage = (
    message: unknown | HandshakeMessage,
): message is HandshakeMessage => {
    return (message as HandshakeMessage).protocol !== undefined
}
