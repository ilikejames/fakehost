# @fakehost/exchange 

## Migrating from v0.x

### Previously...

```typescript
import { Connection, ProtocolHandler, WsFakeHost } from '@fakehost/exchange'

type IncomingMessage = {/*...*/}
type OutgoingMessage = {/*...*/}

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
const protocol = new MyProtocolHandler()
// WsFakeHost or InlineFakeHost
const host = new WsFakeHost(myHandler, 5560, '/json', { debug: true, name: 'FakeTestSvc' })

services.forEach(svc => {
    protocol.subscribe(svc)
})
```

### Now...

```typescript
import { ClientConnection, ConnectionId, Host, ExchangeEvent } from '@fakehost/exchange'
import { Subscription } from 'rxjs'

type IncomingMessage = {/*...*/}
type OutgoingMessage = {/*...*/}

export class ProtocolHandler {

    constructor(private host: Host) {
        host.on('connection', this.onConnection.bind(this))
        host.on('disconnection', this.onDisconnection.bind(this))
        host.on('message', this.onMessage.bind(this)
    }

    private onConnection({ connection }: ExchangeEvent<'connection'>) {...}

    private onDisconnection({ connection} : ExchangeEvent<'disconnection'>) {...}

    private onMessage({ connection, message } : ExchangeEvent<'message'>) {
        const parsedMessage = this.deserialize(message)
        /*...*/
    }

    private serialize: (message: OutgoingMessage) => {/*...*/}

    private deserialize: (message: string | Buffer): IncomingMessage => {/*...*/}

    subscribe(service: Handler) {
        /*...*/
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
const protocol = new ProtocolHandler(host)
services.forEach(svc => {
    protocol.subscribe(svc))
})
```
