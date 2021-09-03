import { ConnectionResponse, OutgoingMessageType } from './types';

export const createConnectedResponse = (username: string): ConnectionResponse => {
    return {
        type: OutgoingMessageType.CONNECTED,
        version: '1.1',
        heartBeat: '0,0',
        userName: username,
    };
};
