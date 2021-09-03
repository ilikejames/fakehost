import makeError from 'make-error';
import {
    Ack,
    ConnectionRequest,
    HeartBeatRequest,
    IncomingMessage,
    IncomingMessageType,
    SendRequest,
    SubscribeRequest,
    UnknownRequest,
    UnsubscribeRequest,
    RequestType,
} from './types';

/*
STOMP Message Format

CONNECT|SEND}SUBSCRIBE|UNSUBSCRIBE|BEGIN|COMMIT|ABORT|ACK|NACK|DISCONNECT
key:value
key:value
key:value

payload
NULL
*/

const NULL = '\0';

export const deserialize = (raw: string): IncomingMessage => {
    try {
        const type = getMessageType(raw);
        switch (type) {
            case IncomingMessageType.CONNECT:
                return parseConnectionRequest(raw);

            case IncomingMessageType.SEND:
                return isHeartbeatMessage(raw) ? parseHeartbeat(raw) : parseSendMessage(raw);

            case IncomingMessageType.SUBSCRIBE:
                return parseSubscribeMessage(raw);

            case IncomingMessageType.DISCONNECT:
                return {
                    type: IncomingMessageType.DISCONNECT,
                };

            case IncomingMessageType.UNSUBSCRIBE:
                return parseUnsubscribeRequest(raw);

            default:
                return parseUnknownMessage(raw);
        }
    } catch (ex) {
        throw new ParseException(`Failed to parse the incoming message. message=${raw}`);
    }
};

export const ParseException = makeError('ParseException');

const isHeartbeatMessage = (message: string): Boolean => {
    const raw = getKeyValues(message);
    return raw.MsgCode === 'HB';
};

const getMessageType = (message: string) => {
    const pairs = message.split(/\n/g);
    try {
        return (IncomingMessageType as any)[pairs[0]];
    } catch (ex) {
        return IncomingMessageType.UNKNOWN;
    }
};

const getKeyValues = (message: string): Record<string, string> => {
    const pairs = message.split(/\n/g);
    return pairs.reduce((acc: Record<string, string>, x) => {
        const [key, value] = x.split(':');
        if (value) {
            acc[key] = value;
        }
        return acc;
    }, {});
};

const getPayload = (message: string): string => {
    const rows = message.split(/\n\n/g);
    const last = rows[rows.length - 1];
    return last.replace(NULL, '');
};

const parseConnectionRequest = (message: string): ConnectionRequest => {
    const raw = getKeyValues(message);
    const [min, max] = raw['heart-beat'].split(',');
    return {
        acceptVersion: raw['accept-version'],
        login: raw['login'],
        passcode: raw['passcode'],
        token: raw['token'],
        heartbeat: {
            min: parseInt(min),
            max: parseInt(max),
        },
        type: IncomingMessageType.CONNECT,
    };
};

const parseUnsubscribeRequest = (message: string): UnsubscribeRequest => {
    const raw = getKeyValues(message);
    return {
        type: IncomingMessageType.UNSUBSCRIBE,
        id: raw['id'],
    };
};

const parseHeartbeat = (message: string): HeartBeatRequest => {
    const raw = getKeyValues(message);
    return {
        type: IncomingMessageType.HEARTBEAT,
        correlationId: raw['correlation-id'],
        destination: raw['destination'],
        replyTo: raw['reply-to'],
        payload: getPayload(message),
    };
};

const parseSendMessage = (message: string): SendRequest => {
    const raw = getKeyValues(message);
    return {
        type: IncomingMessageType.SEND,
        exclusive: raw['exclusive'] === 'true',
        correlationId: raw['correlation-id'],
        replyTo: raw['reply-to'],
        persistent: raw['persistent'] === 'true',
        destination: raw['destination'],
        payload: JSON.parse(getPayload(message)),
        requestType: (RequestType as any)[raw['RequestType']],
    };
};

const parseSubscribeMessage = (message: string): SubscribeRequest => {
    const raw = getKeyValues(message);
    return {
        type: IncomingMessageType.SUBSCRIBE,
        ack: raw['ack'] ? (Ack as any)[raw['ack']] : Ack.AUTO,
        autoDelete: raw['auto-delete'] === 'true',
        destination: raw['destination'],
        durable: raw['durable'] === 'true',
        exclusive: raw['exclusive'] === 'true',
        id: raw['id'],
        xQueueName: raw['x-queue-name'],
    };
};

export const parseUnknownMessage = (raw: string): UnknownRequest => {
    return {
        type: IncomingMessageType.UNKNOWN,
        raw,
    };
};
