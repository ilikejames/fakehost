import { restReady } from './rest'
import { signalrReady } from './signalr'

export const fakeServicesReady = Promise.all([restReady, signalrReady])
