import { Connection as BaseConnection } from '@fakehost/exchange'

export type ConnectionId = string & { __connectionId: never }
export type Connection = Omit<BaseConnection, 'id'> & { id: ConnectionId }

export type ProtocolHandler<InboundMessage, OutBoundMessage> = {
    path: string | undefined
    serialize(message: OutBoundMessage): string
    deserialize(message: string | Buffer): InboundMessage
    onConnection?(connection: BaseConnection): void
    onDisconnection?(connection: BaseConnection): void
    onMessage(connection: BaseConnection, message: InboundMessage): void
}
