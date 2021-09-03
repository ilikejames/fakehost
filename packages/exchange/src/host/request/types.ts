export type IncomingMessage =
    | ConnectionRequest
    | DisconnectRequest
    | HeartBeatRequest
    | SendRequest
    | SubscribeRequest
    | UnknownRequest
    | UnsubscribeRequest;

export enum IncomingMessageType {
    CONNECT = 'CONNECT',
    DISCONNECT = 'DISCONNECT',
    SUBSCRIBE = 'SUBSCRIBE',
    SEND = 'SEND',
    UNKNOWN = 'UNKNOWN',
    HEARTBEAT = 'HEARTBEAT',
    UNSUBSCRIBE = 'UNSUBSCRIBE',
}

export interface ConnectionRequest {
    type: IncomingMessageType.CONNECT;
    login: string;
    passcode: string;
    token: string;
    acceptVersion: string;
    heartbeat: {
        min: number;
        max: number;
    };
}

export interface DisconnectRequest {
    type: IncomingMessageType.DISCONNECT;
}

export interface HeartBeatRequest {
    readonly type: IncomingMessageType.HEARTBEAT;
    readonly correlationId: string;
    readonly replyTo: string;
    readonly destination: string;
    readonly payload: string;
}

export enum RequestType {
    Request = '0',
    StreamRequest = '1',
    Cancel = '2',
}

export interface SendRequest {
    type: IncomingMessageType.SEND;
    exclusive: boolean;
    correlationId: string;
    replyTo: string;
    persistent: boolean;
    destination: string;
    payload: unknown;
    requestType: RequestType;
}

export enum Ack {
    AUTO = 'auto',
    CLIENT = 'client',
    CLIENT_INDIVIDUAL = 'client-individual',
}

export interface SubscribeRequest {
    readonly type: IncomingMessageType.SUBSCRIBE;
    readonly exclusive: boolean;
    readonly ack: Ack;
    readonly durable: boolean;
    readonly autoDelete: boolean;
    readonly xQueueName: string;
    readonly id: string;
    readonly destination: string;
}

export interface UnsubscribeRequest {
    readonly type: IncomingMessageType.UNSUBSCRIBE;
    readonly id: string;
}

export interface UnknownRequest {
    type: IncomingMessageType.UNKNOWN;
    raw: string;
}
