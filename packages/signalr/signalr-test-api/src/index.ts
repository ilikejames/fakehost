export * from './streamResultToObservable'
export * from './generated/TestSignalr.Interfaces'
export type { IChatHub, IChatReceiver, ITimeStreamHub } from './generated/TypedSignalR.Client/TestSignalr.Interfaces'
export { getHubProxyFactory, getReceiverRegister } from './generated/TypedSignalR.Client/index'