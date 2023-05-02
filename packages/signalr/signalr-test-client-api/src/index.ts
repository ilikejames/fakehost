export * from './generated/TestSignalr.Interfaces'
export type {
    IChatHub,
    IChatReceiver,
    IOrderHub,
    ITimeStreamHub,
} from './generated/TypedSignalR.Client/TestSignalr.Interfaces'
export { getHubProxyFactory, getReceiverRegister } from './generated/TypedSignalR.Client/index'
export { HubConnectionBuilder } from '@microsoft/signalr'
export * from './helper'
