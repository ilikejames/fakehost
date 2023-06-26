# @fakehost/exchange 

## Migrating from v0.x

### Previously...

```typescript
import { ProtocolHandler, WsFakeHost } from '@fakehost/exchange'

type IncomingMessage = {}
type OutgoingMessage = {}

export class MyProtocolHandler implements ProtocolHandler<IncomingMessage, OutgoingMessage> {
    path?: string
    serialize: (message: OutgoingMessage) => {...}
    deserialize: (message: string | Buffer) => {...}
    onConnection?: (connection: Connection) => {...}
    onDisconnection?: (connection: Connection) => {...}
    onMessage: (connection: Connection, message: IncomingMessage) => {...}
}
```

And to initialise:

```typescript
const myHandler = new MyProtocolHandler()
// WsFakeHost or InlineFakeHost
const host = new WsFakeHost(myHandler, 5560, '/json', { debug: true, name: 'FakeTestSvc' })

services.forEach(svc => {
    myHandler.subscribe(svc)
})
```

### Now

```typescript
import { Connection, ConnectionId, Host, ExchangeEvent } from '@fakehost/exchange'
import { Subscription } from 'rxjs'

export class MyProtocolHandler {

    // Any references to connection ids used to be a string, but now it has a branded type
    // for added type safety. You can still cast a `ConnectionId` to a string but it is recommended
    // to use the branded type.
    private connectionSubscriptions = new Map<ConnectionId, Subscription>()

    constructor(private host: Host) {
        host.on('connection', this.onConnection.bind(this))
        host.on('disconnection', this.onDisconnection.bind(this))
        host.on('message', this.onMessage.bind(this)
    }

    onConnection({ connection }: ExchangeEvent<'connection'>) {...}

    onDisconnection({ connection} : ExchangeEvent<'disconnection'>) {...}

    onMessage({ connection, message } : ExchangeEvent<'message'>) {
        // e.g. 
        const parsedMessage = this.deserialize(message)
    }
}
```

And to initialize:

```typescript
// Create the host, either WsHost (for a nodejs service) or BrowserWsHost (for a in-browser mocked service)
const host = new WsHost({
    name: 'MyFakeHost',
    debug: true,
    port: 5560,
    path: '/json'
})
const myProtocolHandler = new MyProtocolHandler(host)
services.forEach(svc => {
    myProtocolHandler.subscribe(svc)
})
```

