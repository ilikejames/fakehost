import { IStreamResult, Subject } from '@microsoft/signalr'
import { Connection, ConnectionId, Host } from '@fakehost/host'
import { Observable } from 'rxjs'
import { ClientState } from './ClientState'
import { MessageType, InboundMessage, isHandshakeMessage } from './messageTypes'

type AllKeys<T = object> = {
    [K in keyof T]: boolean
}

type HubClients<T = object> = {
    All: { [K in keyof T]: T[K] }
    Others: { [K in keyof T]: T[K] }
    Caller: { [K in keyof T]: T[K] }
    Client: (clientId: ConnectionId) => { [K in keyof T]: T[K] }
}

type ConnectionState<State = object> = {
    id: ConnectionId
    setState: <Key extends keyof State>(key: Key, value: State[Key]) => void
    getState: <Key extends keyof State>(key: Key) => State[Key] | undefined
}

type SignalrInstanceThis<Receiver = object, State = object> = {
    Clients: HubClients<Receiver>
    Connection: ConnectionState<State>
}

const TERMINATING_CHAR = String.fromCharCode(30)

type FormatTarget<Hub extends object, Receiver = object> =
    | 'capitalize'
    | undefined
    | ((s: keyof Hub | keyof Receiver) => string)

export class FakeSignalrHub<
    Hub extends object,
    Receiver extends object = object,
    State extends object = object,
> {
    // active client connections to this hub
    private clients = new Map<ConnectionId, ClientState<State>>()
    // methods from Hub. Not typed due to casing of methods (camelCase in ts vs PascalCase in C#)
    private handlers = new Map<string, Handler>()
    private host?: Host

    constructor(
        public readonly path: string,
        private receivers: Partial<AllKeys<Receiver>> = {},
        private format?: FormatTarget<Hub, Receiver>,
    ) {}

    disconnect() {
        this.host?.disconnect(this.path)
    }

    setHost(host: Host) {
        this.host = host
        this.host.on('connection', e => this.onConnection.bind(this)(e.connection))
        this.host.on('disconnection', e => this.onDisconnection.bind(this)(e.connection))
        this.host.on('message', e => {
            const message = this.deserialize(e.message)
            this.onMessage.bind(this)(e.connection, message)
        })

        // TODO: off
    }

    /**
     * There can be differences in casing between the client typescript and the server handler methods in C#.
     * This method formats the target to match the casing of the server.
     * @param s
     * @returns
     */
    private formatTarget(s: keyof Hub | keyof Receiver): string {
        if (this.format === 'capitalize' && typeof s === 'string') {
            return capitalize(s)
        } else if (typeof this.format === 'function') {
            return this.format(s as keyof (Hub | Receiver))
        } else {
            return s as string
        }
    }

    private onConnection(connection: Connection) {
        if (connection.url.pathname !== this.path) return
        this.clients.set(connection.id, new ClientState(connection))
    }

    private onDisconnection(connection: Connection) {
        if (connection.url.pathname !== this.path) return
        this.clients.get(connection.id)?.dispose()
        this.clients.delete(connection.id)
    }

    private serialize(message: unknown) {
        return JSON.stringify(message) + TERMINATING_CHAR
    }

    private deserialize(message: string | Buffer): InboundMessage<Hub> {
        return JSON.parse(message.toString().slice(0, -1))
    }

    private async onMessage(connection: Connection, message: InboundMessage<Hub>) {
        if (connection.url.pathname !== this.path) return

        if (isHandshakeMessage(message)) {
            return connection.write(this.serialize({ type: 0 }))
        }

        const connectionId = connection.id as ConnectionId
        const client = this.clients.get(connectionId)
        if (!client) return

        switch (message.type) {
            case MessageType.Invocation: {
                const handler = this.handlers.get(message.target as string)
                if (message.streamIds) {
                    // starting a stream from the client -> service
                    message.streamIds.forEach(async streamId => {
                        const subject = new Subject<unknown>()
                        client.subjects.set(streamId, subject)
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
                const handler = this.handlers.get(message.target as string)
                const result: IStreamResult<unknown> | Observable<unknown> = await handler?.apply(
                    this.getSignalrInstance(connectionId),
                    message.arguments ?? [],
                )
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
                client.subscriptions.set(message.invocationId, subscription)
                return
            }
            case MessageType.StreamItem: {
                const subject = client.subjects.get(message.invocationId)
                return subject?.next(message.item)
            }
            case MessageType.CancelInvocation: {
                client.cleanup(message.invocationId)
                connection.write(
                    this.serialize({
                        type: MessageType.Completion,
                        invocationId: message.invocationId,
                    }),
                )
                return
            }
            case MessageType.Completion: {
                client.cleanup(message.invocationId)
                return
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
        const client = this.clients.get(currentConnectionId)
        if (!client) {
            throw new Error('Excepted a client but there was none')
        }

        const createClientSender = (
            predicate: (connectionId: ConnectionId) => boolean,
        ): Receiver => {
            const result = Object.keys(this.receivers).reduce((acc, target) => {
                acc[target] = (...args: unknown[]) => {
                    Array.from(this.clients.entries())
                        .filter(([connId]) => predicate(connId as ConnectionId))
                        .forEach(([, client]) => {
                            client.connection.write(
                                this.serialize({
                                    type: MessageType.Invocation,
                                    target: this.formatTarget(target as keyof Receiver),
                                    arguments: args,
                                }),
                            )
                        })
                }
                return acc
            }, {} as Record<string, (...args: unknown[]) => void>)
            return result as Receiver
        }

        const signalrThis: SignalrInstanceThis<Receiver, State> = {
            Connection: {
                get id() {
                    return client.connection.id
                },
                setState: (key, value) => {
                    client.setState(key, value)
                },
                getState: key => {
                    return client.state[key]
                },
            },
            Clients: {
                get All() {
                    return createClientSender(() => true)
                },
                get Others() {
                    return createClientSender(id => id !== client.connection.id)
                },
                get Caller() {
                    return createClientSender(id => id === client.connection.id)
                },
                Client: (clientId: ConnectionId) => {
                    return createClientSender(id => id === clientId)
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

const capitalize = (key: string) => key.slice(0, 1).toUpperCase() + key.slice(1)
