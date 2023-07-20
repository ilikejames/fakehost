import { HubMessage, IStreamResult, Subject } from '@microsoft/signalr'
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack'
import {
    CloseConnectionOptions,
    Connection,
    ConnectionId,
    Host,
    ExchangeEvent,
} from '@fakehost/exchange'
import { Observable } from 'rxjs'
import { ClientState } from './ClientState'
import { MessageType, InboundMessage, isHandshakeMessage } from './messageTypes'
import { parse } from './messagePack'

const protocol = new MessagePackHubProtocol()

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
    addEventHandler(event: 'disconnect', handler: () => void): void
    removeEventHandler(event: 'disconnect', handler: () => void): void
}

type SignalrInstanceThis<Receiver = object, State = object> = {
    Clients: HubClients<Receiver>
    Connection: ConnectionState<State>
}

const TERMINATING_CHAR = String.fromCharCode(30)

type ConnectionEvents = 'disconnect'

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
    private messageProtocol = new Map<ConnectionId, 'json' | 'messagepack' | string>()
    private connectionEvents = new Map<`${ConnectionId}.${ConnectionEvents}`, Set<() => void>>()

    constructor(
        public readonly path: string,
        private receivers: Partial<AllKeys<Receiver>> = {},
        private format?: FormatTarget<Hub, Receiver>,
    ) {}

    disconnect(options?: CloseConnectionOptions) {
        this.host?.disconnect({ path: this.path, ...options })
    }

    setHost(host: Host) {
        this.host = host
        this.host.on('connection', this.onConnection.bind(this))
        this.host.on('disconnection', this.onDisconnection.bind(this))
        this.host.on('message', e => {
            // Message not for this hub
            if (e.connection.url.pathname !== this.path) return

            // Handle initial handshake
            if (!this.messageProtocol.has(e.connection.id)) {
                this.handleHandshake(e.connection, e.message)
                return
            }

            const messages = this.deserialize(e.connection, e.message)
            messages.forEach(message => this.onMessage.bind(this)(e.connection, message))
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

    private onConnection({ connection }: ExchangeEvent<'connection'>) {
        if (connection.url.pathname !== this.path) return
        this.clients.set(connection.id, new ClientState(connection))
    }

    private onDisconnection({ connection }: ExchangeEvent<'disconnection'>) {
        if (connection.url.pathname !== this.path) return
        this.clients.get(connection.id)?.dispose()
        this.clients.delete(connection.id)

        const handlers = this.connectionEvents.get(`${connection.id}.disconnect`)
        handlers?.forEach(handler => handler())
        this.connectionEvents.delete(`${connection.id}.disconnect`)
    }

    private handleHandshake(connection: Connection, message: string | Buffer) {
        const [parsed] = message
            .toString()
            .split(TERMINATING_CHAR)
            .filter(Boolean)
            .map(m => JSON.parse(m))

        if (!isHandshakeMessage(parsed)) {
            console.error('Expected initial handshake message, but none was received.')
            connection.close({ code: 1002, reason: 'No handshake supplied', wasClean: true })
            return
        }

        this.messageProtocol.set(connection.id, parsed.protocol)
        connection.write(JSON.stringify({ type: 0 }) + TERMINATING_CHAR)
    }

    private serialize(connection: Connection, message: unknown) {
        switch (this.messageProtocol.get(connection.id)) {
            case 'json':
                return JSON.stringify(message) + TERMINATING_CHAR
            case 'messagepack':
                return protocol.writeMessage(message as HubMessage) as Buffer
            default:
                throw new Error('Unknown connection mode')
        }
    }

    private deserialize(
        connection: Connection,
        message: string | Buffer,
    ): Array<InboundMessage<Hub>> {
        switch (this.messageProtocol.get(connection.id)) {
            case 'json': {
                return message
                    .toString()
                    .split(TERMINATING_CHAR)
                    .filter(Boolean)
                    .map(m => JSON.parse(m))
            }
            case 'messagepack': {
                return parse(message as Buffer)
            }
            default:
                throw new Error('Unknown connection mode')
        }
    }

    private async onMessage(connection: Connection, message: InboundMessage<Hub>) {
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
                try {
                    const result = await handler?.apply(
                        this.getSignalrInstance(connectionId),
                        message.arguments ?? [],
                    )
                    return connection.write(
                        this.serialize(connection, {
                            type: MessageType.Completion,
                            invocationId: message.invocationId,
                            result,
                        }),
                    )
                } catch (error: unknown) {
                    return connection.write(
                        this.serialize(connection, {
                            type: MessageType.Completion,
                            invocationId: message.invocationId,
                            error: stringifyError(error),
                        }),
                    )
                }
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
                            this.serialize(connection, {
                                type: MessageType.StreamItem,
                                invocationId: message.invocationId,
                                item: value,
                            }),
                        )
                    },
                    error: error => {
                        connection.write(
                            this.serialize(connection, {
                                type: MessageType.Completion,
                                invocationId: message.invocationId,
                                error: stringifyError(error),
                            }),
                        )
                    },
                    complete: () => {
                        connection.write(
                            this.serialize(connection, {
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
                    this.serialize(connection, {
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
                return connection.write(this.serialize(connection, { type: MessageType.Ping }))
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
                                this.serialize(client.connection, {
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
                addEventHandler: (eventName, handler) => {
                    const handlers =
                        this.connectionEvents.get(`${currentConnectionId}.${eventName}`) ||
                        new Set()
                    handlers.add(handler)
                    this.connectionEvents.set(`${currentConnectionId}.${eventName}`, handlers)
                },
                removeEventHandler: (eventName, handler) => {
                    const handlers =
                        this.connectionEvents.get(`${currentConnectionId}.${eventName}`) ||
                        new Set()
                    handlers.delete(handler)
                    this.connectionEvents.set(`${currentConnectionId}.${eventName}`, handlers)
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

const stringifyError = (e: unknown) => {
    if (typeof e === 'string') return e
    if (e instanceof Error) return e.message
    return JSON.stringify(e)
}
