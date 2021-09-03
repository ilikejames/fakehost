export enum OutgoingMessageType {
    CONNECTED = 'CONNECTED',
    MESSAGE = 'MESSAGE',
    ERROR = 'ERROR',
    COMPLETE = 'COMPLETE',
}

export interface OutgoingMessage {
    readonly type: OutgoingMessageType;
    readonly IsHeartbeat?: boolean;
    readonly isComplete?: boolean;
    readonly payload?: unknown;
    readonly errorCode?: number;
    readonly errorMessage?: string;
}

export interface ErrorReponse extends OutgoingMessage {
    readonly type: OutgoingMessageType.ERROR;
    readonly receiptId: string;
    readonly contentType: 'text/plain';
    readonly message: string;
    readonly payload: string;
}

export interface ConnectionResponse extends OutgoingMessage {
    readonly type: OutgoingMessageType.CONNECTED;
    readonly version: string;
    readonly heartBeat: string;
    readonly userName: string;
}

export interface CompleteResponse extends OutgoingMessage {
    readonly type: OutgoingMessageType.MESSAGE;
    readonly isComplete: true;
    readonly correlationId: string;
    readonly persistent: false;
    readonly destination: string;
    readonly subscription: string;
    readonly messageId: string;
}

export interface PayloadMessage extends OutgoingMessage {
    readonly correlationId: string;
    readonly persistent: false;
    readonly destination: string;
    readonly subscription: string;
    readonly messageId: string;
    readonly payload: unknown;
}

export interface HeartbeatResponse extends PayloadMessage {
    readonly MsgCode: string;
}

export interface ServiceError {
    errorCode: number;
    errorMessage: string;
}
