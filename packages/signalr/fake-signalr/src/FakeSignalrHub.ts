import { Connection } from '@fakehost/exchange'
import { IStreamResult, ISubscription, Subject } from '@microsoft/signalr'
import { Observable, Subscription } from 'rxjs'

type All<T = object> = {
    [K in keyof T]: boolean
}

type Clients<T = object> = {
    All: {
        [K in keyof T]: T[K]
    }
}

type ConnectionState<State = object> = {
    setState: <Key extends keyof State>(key: Key, value: State[Key]) => void
    getState: <Key extends keyof State>(key: Key) => State[Key] | undefined
}

export type ConnectionId = string & { __connectionId: never }

type SignalrInstanceThis<Receiver = object, State = object> = {
    Clients: Clients<Receiver>
    Connection: ConnectionState<State>
    get connectionId(): ConnectionId
}

enum MessageType {
    Invocation = 1,
    StreamItem = 2,
    Completion = 3,
    StreamInvocation = 4,
    CancelInvocation = 5,
    Ping = 6,
    Close = 7,
}

type ProtocolHandler = {
    path: string | undefined
    serialize(message: unknown): string
    deserialize(message: string): unknown
    onConnection?(connection: Connection): void
    onDisconnection?(connection: Connection): void
    onMessage(connection: Connection, message: unknown): void
}

type HandshakeMessage = {
    protocol: string
    version: number
}

type InboundSignalrMessage<Hub> = {
    target: keyof Hub
    invocationId?: number
    type: MessageType
    arguments?: unknown[]

    // on invocation
    streamIds?: string[]

    // on StreamItem
    item?: unknown
}

const TERMINATING_CHAR = String.fromCharCode(30)

const isHandshakeMessage = (message: unknown | HandshakeMessage): message is HandshakeMessage => {
    return (message as HandshakeMessage).protocol !== undefined
}

type FormatTarget<Hub extends object, Receiver = object> =
    | 'capitalize'
    | undefined
    | ((s: keyof Hub | keyof Receiver) => string)

export class FakeSignalrHub<Hub extends object, Receiver = object, State = object>
    implements ProtocolHandler
{
    // active connections to this hub
    private connections = new Map<string, Connection>()
    // state per connection
    private connectionState = new Map<string, Partial<State>>()
    // streams service -> client
    private connectionSubscriptions = new Map<
        string,
        Map<string, ISubscription<unknown> | Subscription>
    >()
    // streams client -> service
    private connectionSubjects = new Map<string, Map<string, Subject<unknown>>>()
    // methods from Hub. Not typed due to casing of methods (camelCase in ts vs PascalCase in C#)
    // eslint-disable-next-line @typescript-eslint/ban-types
    private handlers = new Map<string, Function>()

    constructor(
        public readonly path: string,
        private receivers: All<Receiver>,
        private format?: FormatTarget<Hub, Receiver>,
    ) {}

    private capitalize(key: string) {
        return key.slice(0, 1).toUpperCase() + key.slice(1)
    }

    /**
     * There can be differences in casing between the client typescript and the server handler methods in C#.
     * This method formats the target to match the casing of the server.
     * @param s
     * @returns
     */
    private formatTarget(s: keyof Hub | keyof Receiver): string {
        if (this.format === 'capitalize' && typeof s === 'string') {
            return this.capitalize(s)
        } else if (typeof this.format === 'function') {
            return this.format(s as keyof (Hub | Receiver))
        } else {
            return s as string
        }
    }

    onConnection(connection: Connection) {
        this.connections.set(connection.id, connection)
    }

    onDisconnection(connection: Connection) {
        this.connectionState.delete(connection.id)
        this.connections.delete(connection.id)

        // dispose all subscriptions (service -> client)
        this.connectionSubscriptions
            .get(connection.id)
            ?.forEach(subscription => disposeSubscription(subscription))
        this.connectionSubscriptions.delete(connection.id)

        // dispose all subjects (client -> service)
        this.connectionSubjects.get(connection.id)?.forEach(subject => subject.complete())
        this.connectionState.delete(connection.id)
    }

    serialize(message: unknown) {
        return JSON.stringify(message) + TERMINATING_CHAR
    }

    deserialize(message: string | Buffer): InboundSignalrMessage<Hub> | HandshakeMessage {
        return JSON.parse(message.toString().slice(0, -1))
    }

    async onMessage(
        connection: Connection,
        message: InboundSignalrMessage<Hub> | HandshakeMessage,
    ) {
        if (isHandshakeMessage(message)) {
            return connection.write(this.serialize({}))
        }

        const handler = this.handlers.get(message.target as string)
        const connectionId = connection.id as ConnectionId

        switch (message.type) {
            case MessageType.Invocation: {
                if (message.streamIds) {
                    // starting a stream from the client -> service
                    message.streamIds.forEach(async streamId => {
                        const subject = new Subject<unknown>()
                        this.connectionSubjects.set(
                            connection.id,
                            (this.connectionSubjects.get(connection.id) ?? new Map()).set(
                                streamId,
                                subject,
                            ),
                        )
                        await handler?.apply(this.getSignalrInstance(connectionId), [subject])
                    })
                    return
                }
                const result = await handler?.apply(
                    this.getSignalrInstance(connectionId),
                    message.arguments ?? [],
                )
                return connection.write(
                    this.serialize({
                        type: MessageType.Completion,
                        invocationId: message.invocationId,
                        result,
                    }),
                )
            }
            case MessageType.StreamInvocation: {
                const result: IStreamResult<unknown> | Observable<unknown> = await handler?.apply(
                    this.getSignalrInstance(connectionId),
                    message.arguments ?? [],
                )
                // 🤔 will this always be an IStreamResult? Perhaps also handle Observable?
                const subscription = result.subscribe({
                    next: value => {
                        connection.write(
                            this.serialize({
                                type: MessageType.StreamItem,
                                invocationId: message.invocationId,
                                item: value,
                            }),
                        )
                    },
                    error: error => {
                        connection.write(
                            this.serialize({
                                type: MessageType.Completion,
                                invocationId: message.invocationId,
                                error,
                            }),
                        )
                    },
                    complete: () => {
                        connection.write(
                            this.serialize({
                                type: MessageType.Completion,
                                invocationId: message.invocationId,
                            }),
                        )
                    },
                })

                this.connectionSubscriptions.set(
                    connection.id,
                    (this.connectionSubscriptions.get(connection.id) ?? new Map()).set(
                        message.invocationId,
                        subscription,
                    ),
                )
                return
            }
            case MessageType.StreamItem: {
                const subject = this.connectionSubjects
                    .get(connection.id)
                    ?.get(`${message.invocationId}`)
                if (subject) {
                    subject.next(message.item)
                    return
                }
            }
            case MessageType.CancelInvocation: {
                const subscription = this.connectionSubscriptions
                    .get(connection.id)
                    ?.get(`${message.invocationId}`)
                if (!subscription) {
                    return
                }
                disposeSubscription(subscription)

                this.connectionSubscriptions.get(connection.id)?.delete(`${message.invocationId}`)
                connection.write(
                    this.serialize({
                        type: MessageType.Completion,
                        invocationId: message.invocationId,
                    }),
                )
                return
            }
            case MessageType.Completion: {
                const subject = this.connectionSubjects
                    .get(connection.id)
                    ?.get(`${message.invocationId}`)
                if (subject) {
                    subject.complete()
                    this.connectionSubjects.get(connection.id)?.delete(`${message.invocationId}`)
                    return
                }
            }
            case MessageType.Ping:
                return connection.write(this.serialize({ type: MessageType.Ping }))
            default:
                console.warn('Not handled', message)
        }
    }

    private getSignalrInstance(
        currentConnectionId: ConnectionId,
    ): SignalrInstanceThis<Receiver, State> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this
        const signalrThis: SignalrInstanceThis<Receiver, State> = {
            get connectionId() {
                return currentConnectionId
            },
            Connection: {
                setState(key, value) {
                    const current = self.connectionState.get(currentConnectionId) || {}
                    self.connectionState.set(currentConnectionId, {
                        ...current,
                        [key]: value,
                    })
                },
                getState(key) {
                    const current = self.connectionState.get(currentConnectionId) || ({} as State)
                    return current[key]
                },
            },
            Clients: {
                get All() {
                    const receivers = Object.keys(self.receivers).reduce((acc, target) => {
                        acc[target] = (...args: unknown[]) => {
                            self.connections.forEach(conn => {
                                conn.write(
                                    self.serialize({
                                        type: MessageType.Invocation,
                                        target: self.formatTarget(target as keyof Receiver),
                                        arguments: args,
                                    }),
                                )
                            })
                        }
                        return acc
                    }, {} as Record<string, (...args: unknown[]) => void>)
                    return receivers as Receiver
                },
            },
        }
        return signalrThis
    }

    get thisInstance(): SignalrInstanceThis<Receiver, State> {
        throw new Error('Not callable. Used only for type inference.')
    }

    register<Target extends keyof Hub>(target: Target, handler: Handler) {
        this.handlers.set(this.formatTarget(target), handler)
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (...args: any[]) => any

const disposeSubscription = (stream: ISubscription<unknown> | Subscription) => {
    if ('unsubscribe' in stream) {
        stream.unsubscribe()
    } else {
        stream.dispose()
    }
}
