import { CompleteResponse, OutgoingMessageType, PayloadMessage, ServiceError } from './types';
import { SendRequest } from '../request';

export const createPayloadMessage = (
    request: SendRequest,
    username: string,
    payload: unknown,
    subscriptionId: string,
    error?: ServiceError,
): PayloadMessage => {
    return {
        type: OutgoingMessageType.MESSAGE,
        correlationId: request.correlationId,
        persistent: false,
        destination: `${username}/${request.replyTo}`,
        subscription: subscriptionId,
        messageId: '' + Math.random(),
        payload,
        ...error,
    };
};

export const createCompleteMessage = (
    request: SendRequest,
    username: string,
    subscriptionId: string,
): CompleteResponse => {
    return {
        type: OutgoingMessageType.MESSAGE,
        isComplete: true,
        correlationId: request.correlationId,
        persistent: false,
        destination: `${username}/${request.replyTo}`,
        subscription: subscriptionId,
        messageId: '' + Math.random(),
    };
};
