# @fakehost/fake-signalr

## Overview

`@fakehost/fake-signalr` is a drop in replacement for a real signalr remote service. For:

- deep e2e testing against a known & controllable (from the tests) backend
- test reconnection logic / state
- ensure your fake services are aligned with the real services with [Contact Tests](contract-tests.md).
- create your service how ever you need them, create "heavy" versions to **performance test** your applications
- suitable for **testing web-apps**, **native apps** without requiring custom builds
- supports websockets with JSON or message pack protocol

**[See the example test case fake service](https://github.com/ilikejames/fakehost/tree/master/packages/signalr/signalr-test-fake-svc).**



## Creating a Fake Signalr Service

Lets assume your backend services are producing a typescript interface to the services published in a package called `@internal/service-api`. This isn't necessary, but gives us nice type-safety. 

```ts
// Generated service definition @internal/service-api
type IKeyValueStore = {
    getAll: () => Promise<Record<string, string>>
    create: ({ key: string, value: string}) => Promise<void>
}
// Some remote services also have "Receivers". Lets add one, though this is api dependant and you might not have any
type IKeyValueReceiver = {
    onKeyChange: (type: 'create' | 'update' | 'delete', payload: Record<string, string>): Promise<void>
} 
```

```ts
// fakeKeyValueStore.ts
import { IKeyValueStore } from '@internal/service-api'
import { FakeSignalrHub } from '@fakehost/fake-signalr'

// Create in-memory store with sime initial values
const store = new Map<string, string>([
    ['key1', 'value1'],
    ['key2', 'value2'],
])

// Create the fake service. Listening on `/store` path.
export const fakeKeyValueStore = new FakeSignalrHub<IKeyValueStore>('/store')

// Create a fake implementation of one of service methods. 
// By typing it using the service interface we have nice type safety
const getAll: IKeyValueStore['getAll'] = async () => {
    return Object.fromEntries(store.entries())
}

// Register the method that will respond to `getAll` requests
fakeKeyValueStore.register('getAll', getAll)
```

```ts
// hubs.ts
import { fakeKeyValueStore } from './fakeKeyValueStore.ts'

export const hubs = {
    fakeKeyValueStore
    // etc...
} as const
```

## this: SignalrInstanceThis\<T\>

Available on the fake methods, is `this:SignalrInstanceThis<T>` which can be used to access and set state for the connection, or send messages to other connected clients. These need to be `function` and cannot be accessed from arrow functions.

```ts
// fakeKeyValueStore.ts
import { IKeyValueStore } from '@internal/service-api'
import { FakeSignalrHub } from '@fakehost/fake-signalr'

const store = new Map<string, string>([
    ['key1', 'value1'],
    ['key2', 'value2'],
])

// A typed connection state
type MyState = {
    username?: string
}

export const fakeKeyValueStore = new FakeSignalrHub<IKeyValueStore, IKeyValueReceiver, MyState>('/store')

// helper method to get a fully typed version
type KeyValueThis = typeof fakeKeyValueStore.thisInstance

const create: IKeyValueStore['create'] = async function(this: KeyValueThis, {key, value}) {
    console.log('connection from', this.Connection.id)
    // getState is typed to MyState
    const username = this.Connection.getState('username')
    //    ^ string | undefined ✅
    console.log('username =', username)

    store.set(key, value)
    // Send to all clients receiver method `onKeyChange` that an item has been created
    this.Clients.All.onKeyChange('create', { key, value })
}
```

### this.Connection

- `id`: string identifier for the connection. 
- `getState(key)`: method for setting state for a connection. The `FakeSignalrHub` can take 3 generic parameters `new FakeSignalrHub<Api, ReceiverEvents, State>` for strongly typed state.
- `setState(key, value)`: set a key value on the connection state 
- `addEventListener`: add a listener for specific events e.g. `disconnection`. This can be used to clean up any state for the connection, or to send 'disconnection' events to other connections. 
- `removeEventListener`: remove the event listener. 

### this.Clients

`this.Clients` is used to call the "Receiver" methods of the signalr service. E.g.,

```typescript
    this.Clients.All.onJoin({ username: 'x' })
```

- `All`: send to all clients
- `Caller`: send to current connection
- `Client(connectionId)`: send to specific `connectionId`
- `Other`: send to all clients except the current connection. 


## Running as a Localhost Service

Normal application development its useful to be able to start your fakes locally from a command line, point your applications signalr url at the `localhost` fake and get to work developing against a light, fast, always available local instance. 

```ts
// start.ts
import { createServerSignalr } from '@fakehost/signalr/server'
import { hubs } from './hubs'

const PORT = process.env.SIGNALR_PORT ? parseInt(process.env.SIGNALR_PORT) : 5000
createServerSignalr<typeof hubs>({
    port: PORT,
    hubs: hubs,
    name: 'fake-signalr',
})
```

Running the above code, using ts-node from a command line will start the signalr service listing on port `5000`.


## Testing Applications Using Fakes

- runs in the same process as your tests. Means you can directly control the fakes from the test code. 
- difference between node tests e.g. vitest/jest/playwright/webdriver and cypress

### Setup Playwright (and webdriver etc)

The browser connects via websocket to the fake backend services running inside the same process as the test. We can expose a signalr websocket using `createServerSignalr`.

The fake can expose any methods it needs to control the flow of data to the test. 

![Process 0 (browser) connects to Process 1 (fake and test)](../assets/processes.png "Process 0 (browser) connects to Process 1 (fake and test)")

**[See the example Playwright setup](https://github.com/ilikejames/fakehost/tree/master/packages/test-playwright).**


```typescript
import { createServerSignalr } from '@fakehost/signalr/server'
import { Page } from '@playwright/test'
import { hubs } from '@internal/fakes'

export const startFakes = async (page: Page) => {
    // start signalr without specifying a port to get a random available port assigned
    const signalr = await createServerSignalr<typeof hubs>({
        hubs,
        debug: false,
        name: 'signalr',
    })

    const url = await signalr.url
    // configure signalr url in the app config. 
    await page.addInitScript(`window.signalrUrl = ${JSON.stringify(url)}`)

    // the returned signalr object has methods for tearing down hubs. See `reconnection tests`
    return signalr
}
```

See [packages/test-playwright/src/config/init.ts](https://github.com/ilikejames/fakehost/blob/master/packages/test-playwright/src/config/init.ts) for a full example.

Controlling fakes from a test is simply a case of exposing code from within the fake. E.g.,

```typescript
// fakeCounterSvc.ts
export const fakeCounterSvc = new FakeSignalrHub<ICounterService>('/counter')

let counter = 0

const getCounter: ICounterService['getCounter'] = () => {
    if(fakeCounterControls.shouldCounterThrow) {
        throw new Error('An unexpected error occurred')
    }
    return Promise.resolve(++counter)
}

export const fakeCounterControls = {
    shouldCounterThrow: false
}
```

And the test:

```typescript
import { test } from '@playwright/test'
import { fakeCounterControls } from '@internal/fakes'

test('when the service throws', async () => {
    fakeCounterControls.shouldCounterThrow = true
    try {
        // click the app
        // assert the application shows the service error message
    }
    finally {
        fakeCounterControls.shouldCounterThrow = false
    }
})
```

### Setup Cypress

Cypress tests run inside a browser with the application running in the same browser but within an iframe. We can setup a cypress mocked websocket using `createInBrowserSignalr`. 

**[See the example Cypress setup](https://github.com/ilikejames/fakehost/tree/master/packages/test-playwright).**


```typescript
import { createInBrowserSignalr } from '@fakehost/signalr/browser'

import { hubs } from '@internal/fakes'

const SIGNALR_URL = 'http://remote-signalr-url'

export const startFakes = async () => {
    const signalr = await createInBrowserSignalr<typeof hubs>({
        hubs: hubs,
        url: new URL(SIGNALR_URL),
    })
    return signalr
}
```

And the test:

```typescript
describe('cypress test setup', async () => {
    const signalr = await startFakes()

    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad: win => {
                // Stub out the websocket
                cy.stub(win, 'WebSocket').callsFake(signalr.mockedSocket)
                // Fetch needs to be stubbed as signalr goes through an initial http handshake
                // Note the `mockedFetch` is a singleton.
                cy.stub(win, 'fetch').callsFake(signalr.mockedFetch)
            },
        })
    })
})
```

Controlling tests is also possible in Cypress, but all calls to the fakes need to be wrapped, e.g.:

```typescript
import { fakeCounterControls } from '@internal/fakes'

describe('cypress test setup', async () => {
    const signalr = await startFakes()

    beforeEach(() => {
        cy.visit('/', {
            onBeforeLoad: win => {
                cy.stub(win, 'fetch').callsFake(signalr.mockedFetch)
                cy.stub(win, 'WebSocket').callsFake(signalr.mockedSocket)
            },
        })

        // Cypress Best Practice: Clean up state before tests run.
        cy.wrap(fakeCounterControls).then(controls => controls.shouldCounterThrow = false)
    })

    it('when the service throws', async () => {
        cy.wrap(fakeCounterControls).then(controls => controls.shouldCounterThrow = true)
        // rest of test
    })
})
```

### Set up Jest, Vitest, @testing-library/react-native

For Jest, Vitest, @testing-library/react-native the tests run inside of a node process. The setup is exactly the same as [Setup Playwright](fake-signalr/fake-signalr.md?id=setup-playwright-and-webdriver-etc) using `createServerSignalr`.

## Testing Disconnection / Reconnection

Both `createServerSignalr` and `createInBrowserSignalr` return an object with methods for tearing down the service, disconnecting clients to the service, or individual hubs. 

As reconnection can happen silently to the application, its best if `ssss` is set. E.g.,

```typescript
test('reconnection', ({ page}) => {
    const signalr = await startFakes(page)

    // TODO: wait for app to be loaded. 
    // etc

    // Disconnect all clients
    signalr.host.disconnect()
    // Prevent reconnection at the fake level. Connections will now be refused
    signalr.host.refuseNewConnections = true

    // TODO: wait for app to indicate its in disconnected state
    // etc

    // Allow connections again
    signalr.host.refuseNewConnections = false

    // TODO: assert app is successfully reconnected. 
    // etc
})
```