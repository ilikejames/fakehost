import { InboundMessage, MessageType } from '../messageTypes'
import { BinaryMessageFormat } from './BinaryMessageFormat'
import { Decoder } from '@msgpack/msgpack'

export const parse = <Hub extends object>(input: Buffer): Array<InboundMessage<Hub>> => {
    const buffer = Buffer.from(input as Uint8Array)
    const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
    )
    const messages = BinaryMessageFormat.parse(arrayBuffer)

    const hubMessages = new Array<InboundMessage<Hub>>()

    for (const message of messages) {
        const parsedMessage = parseMessage(message)
        // Can be null for an unknown message. Unknown message is logged in parseMessage
        if (parsedMessage) {
            hubMessages.push(parsedMessage)
        }
    }

    return hubMessages
}

const parseMessage = <Hub extends object>(input: Uint8Array): InboundMessage<Hub> | null => {
    if (input.length === 0) {
        throw new Error('Invalid payload.')
    }

    const decoder = new Decoder()

    const properties = decoder.decode(input) as any
    if (properties.length === 0 || !(properties instanceof Array)) {
        throw new Error('Invalid payload.')
    }

    const messageType = properties[0] as MessageType
    switch (messageType) {
        case MessageType.Invocation:
            return {
                type: MessageType.Invocation,
                arguments: properties[4],
                invocationId: properties[2],
                streamIds: properties[5],
                target: properties[3],
            }
        case MessageType.StreamItem:
            return {
                type: MessageType.StreamItem,
                invocationId: properties[2],
                item: properties[3],
            }
        case MessageType.Completion: {
            const resultKind = properties[3]
            return {
                type: MessageType.Completion,
                error: resultKind === 1 ? properties[4] : undefined,
                invocationId: properties[2],
                result: resultKind === 1 ? undefined : properties[4],
            }
        }
        case MessageType.Ping:
            return {
                type: MessageType.Ping,
            }
        case MessageType.Close:
            return {
                type: MessageType.Close,
                allowReconnect: properties.length >= 3 ? properties[2] : undefined,
                error: properties[1],
            }
        case MessageType.CancelInvocation:
            return {
                type: MessageType.CancelInvocation,
                invocationId: properties[2],
            }
        case MessageType.StreamInvocation:
            return {
                type: MessageType.StreamInvocation,
                invocationId: properties[2],
                target: properties[3],
                arguments: properties[4],
            }
        default:
            // Future protocol changes can add message types, old clients can ignore them
            console.log("Unknown message type '" + messageType + "' ignored.")
            return null
    }
}
