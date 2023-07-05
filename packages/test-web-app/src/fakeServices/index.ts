import { restReady } from './rest'
import { signalrReady } from './signalr'

// Only required if you are making a version of the app with bundled fakes.
// It ensures that the fakes are wired up and ready to go before possible
// race conditions of trying to connect to not yet wired fakes services.
export const fakeServicesReady = Promise.all([restReady, signalrReady])
