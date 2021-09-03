const STOMP_OUTGOING_FRAME_LABELS = ['CONNECTED', 'MESSAGE', 'ERROR', 'COMPLETE'] as const;

type OutgoingMessageType = typeof STOMP_OUTGOING_FRAME_LABELS[number];

export interface OutgoingMessage {
    readonly type: OutgoingMessageType;
    readonly headers: Record<string, string>;
    readonly payload?: unknown;
}

export const serialize = (message: OutgoingMessage) => {
    const outgoing = [];
    outgoing.push(message.type);

    Object.entries(message.headers).forEach(([value, key]) => {
        outgoing.push(`${key}:${value}`);
    });

    if (message.payload) {
        const payloadAsString = JSON.stringify(message.payload);
        const asBytes = new TextEncoder().encode(payloadAsString);
        outgoing.push(`content-length:${asBytes.length + 1}`);
        outgoing.push('');
        outgoing.push('');
        outgoing.push(payloadAsString);
    } else {
        outgoing.push(`content-length:0`);
        outgoing.push('');
        outgoing.push('');
    }

    outgoing.push('\0');

    return outgoing.join('\n');
};
