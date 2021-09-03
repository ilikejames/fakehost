const STOMP_FRAME_LABELS = [
    'CONNECT',
    'ERROR',
    'SEND',
    'SUBSCRIBE',
    'UNSUBSCRIBE',
    'DISCONNECT',
    'BEGIN',
    'COMMIT',
    'ABORT',
    'ACK',
    'NACK',
] as const;

export type UnknownStompFrameType = 'UNKNOWN';
export type StompFrameType = typeof STOMP_FRAME_LABELS[number];

export interface IncomingMessage {
    type: StompFrameType | UnknownStompFrameType;
    unknownType?: string;
    destination?: string;
    headers: Record<string, string>;
    payload?: string;
}

export const deserialize = (message: string): IncomingMessage => {
    const messageType = getMessageType(message);
    const pairs = getKeyValues(message);
    const payload = getPayload(message);
    return {
        type: messageType.type,
        unknownType: messageType.raw,
        destination: pairs['destination'],
        headers: pairs,
        payload,
    };
};

const NULL = '\0';

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

const getMessageType = (message: string) => {
    const pairs = message.split(/\n/g);
    const frameType = pairs[0];
    if (STOMP_FRAME_LABELS.includes(frameType as StompFrameType)) {
        return {
            type: frameType as StompFrameType,
        };
    }
    return {
        type: 'UNKNOWN' as UnknownStompFrameType,
        raw: pairs[0],
    };
};
