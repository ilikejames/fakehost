import { OutgoingMessageType, ErrorReponse } from './types';
import { SubscribeRequest } from '../request';

export const createDestinationErrorResponse = (message: SubscribeRequest): ErrorReponse => {
    return {
        type: OutgoingMessageType.ERROR,
        receiptId: message.id,
        contentType: 'text/plain',
        message: 'malforms frame received',
        payload: `The message:
        ---
        MESSAGE
        No such destination ${message.destination}`,
    };
};
