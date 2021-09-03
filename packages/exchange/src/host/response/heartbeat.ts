import { OutgoingMessageType, HeartbeatResponse } from './types';
import { HeartBeatRequest } from '../request';

export const createHeartbeatResponse = (
    user: string,
    request: HeartBeatRequest,
    subId: string = 'sub-0',
): HeartbeatResponse => {
    return {
        type: OutgoingMessageType.MESSAGE,
        IsHeartbeat: true,
        MsgCode: 'HB',
        correlationId: request.correlationId,
        persistent: false,
        destination: `${user}/${request.replyTo}`,
        subscription: subId,
        messageId: '' + Math.random(),
        payload: request.payload,
    };
};
