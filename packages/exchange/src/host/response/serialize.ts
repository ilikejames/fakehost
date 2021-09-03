import decamel from 'decamelize';
import { OutgoingMessage } from './types';

export const serialize = (message: OutgoingMessage) => {
    /*
    CONNECTED
    key1:value1
    key2:value2

    {{?json}}
    */
    const outgoing = [];
    outgoing.push(message.type);
    const protectedTypes = [
        'type',
        'payload',
        'IsHeartbeat',
        'isComplete',
        'MsgCode',
        'errorCode',
        'errorMessage',
    ];

    if (message.isComplete) {
        outgoing.push('MsgCode:OC');
    }

    if (message.IsHeartbeat) {
        outgoing.push('IsHeartbeat:' + message.IsHeartbeat);
        outgoing.push('MsgCode:HB');
    }

    if (message.errorCode) {
        outgoing.push('ErrorCode:' + message.errorCode);
        outgoing.push('ErrorMessage:' + message.errorMessage);
    }

    Object.entries(message).forEach(([key, value]) => {
        if (protectedTypes.includes(key)) {
            return;
        }
        outgoing.push(`${decamel(key, '-')}:${value}`);
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
