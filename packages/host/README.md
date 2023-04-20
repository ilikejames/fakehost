# @fakehost/host

[![NPM Version][npm-image]][npm-url]


Create fake websocket services that can run as a service or bundled within the browser.

- Deeply tests your web/native applications. 
- Write contract tests to assert your fakes align with the remote services
- Cover edge cases, cover errors, cover reconnection logic
- Can be bundled within the web browser / application for creating standalone demo versions. 

This library only handles the websocket service layer. A handler needs to be created that uses it (see [`@fakehost/signalr`](https://github.com/ilikejames/fakehost/tree/master/packages/signalr/fake-signalr) for an example).


```sh
npm install @fakehost/host
```


## Node service

For node based testing e.g. Playwright, WebdriverIO, Jest, Vitest, react-native testing:

```ts
import { WsHost, enableLogger } from '@fakehost/host'

enableLogger()

const wsHost = new WsHost({
    port: 5000,
    path: '/ws'
    name: `my-fake`,
    debug: true,
    silent: false
})

// -> my-fake listening on http://localhost:5000/ws
```

See [testing in Playwright](https://github.com/ilikejames/fakehost/tree/master/packages/test-playwright) for playwright setup.


## Browser bundling

For testing in Cypress, creating demo versions, or bundling in Storybook

```ts
import { BrowserWsHost, enableLogger, MockedSocket } from '@fakehost/host'

const host = new BrowserWsHost({
    url: new URL('http://example.com'),
    name: `hijacked example.com`,
})
```

See [testing in cypress](https://github.com/ilikejames/fakehost/tree/master/packages/test-cypress) for cypress setup.

See [bundling fakes in a web application](https://github.com/ilikejames/fakehost/tree/master/packages/test-web-app/src/index.tsx) for creating standlone demo apps, or for similar for storybook etc. 



## Rest handshake

Some clients require a handshake via a rest endpoint (e.g. signalr). You can supply a `@fakehost/rest` rest service for that e.g. for a nodejs service:

```ts
import { HttpRestService, createRouter } from '@fakehost/fake-rest/server'
import { WsHost, Host } from '@fakehost/host'

const restRouter = createRouter()
    .use(req, res) => {
        // Purely shown as an example handshake
        // See @fakehost/fake-rest && @fakehost/signalr for further examples.
        res.json({ handshake: true })
    })

const rest = new HttpRestService(restRouter, {
    name: `http://my-rest`,
    port: 5000
})

const wsHost = new WsHost({
    server: rest.server
    name: `ws://my-fake`,
})
```

## Methods

The following methods are available on `Host`. `Host` is the base definition for both `WsHost` and `BrowserWsHost`. 

- `dispose`: fully kills the service.  
- `disconnect`: disconnects all clients. After a second (its not usually immediate), the websocket connection will go into a disconnected state. Any reconnection logic you have will start at that point. 
- `refuseNewConnections`: `boolean` when set to `true` no client will be allowed to connect, and will trigger an reconnection logic you have setup
- `connectionCount`: `number` count of active connections. Often when you are testing reconnection logic, you should do something like:

```ts
    // disconnect all clients
    host.refuseNewConnections = true
    host.disconnect()
    await waitFor(() => host.connectionCount === 0)

    // whatever checks you make on your app. 

    // wait for reconnection
    host.refuseNewConnections = false
    await waitFor(() => host.connectionCount === 1)

    // assert app is back to "live" state
```

## Writing a protocol handler

This library doesn't handle the protocol logic, its merely a host for a protocol handler, that supports being run as a service, or run within the browser. 

I've used the approach to create fakes for the following:

- Signalr: [@fakehost/signalr](https://github.com/ilikejames/fakehost/tree/master/packages/signalr) is a full fake of microsoft's signalr platform. The fake has full contract test coverage, and is the best resource for building your own fake.

And fakes of the following brokers (though unfortunately I don't own that code):

- solace ([home](https://solace.com/)): a propriety message broker
- jumpstart: another propriety message broker
- hydra/aeron ([home](https://aeron.io/)): yet another propriety message broker

### The basics of a fake protocol:

Here we'll create a really simple protocol handler that 

```ts
// fakeSvc.ts

import { Connection, ConnectionId, Host } from '@fakehost/host'

type IncomingMessage = {
    to: string,
    payload: unknown
}

type OutgoingMessage = {
    from: string,
    payload: unknown
}

type Handler = (...args: any[]) => any

export class FakeSvc {
    private handlers = new Map<string, Handler>()

    constructor(private host: Host) {
        this.host.on('connection', e => {
            this.onConnection.apply(this, [e.connection])
        }
        this.host.on('disconnection', e => {
            this.onDisconnection.apply(this, [e.connection])
        }
        this.host.on('message', e => {
            const message = this.deserialize(e.message)
            this.onMessage.apply(this, [e.connection, message])
        })
    }

    public register(serviceName: string, handler: Handler) {
        this.handlers.set(serviceName, handler)
    } 

    private serialize(m: OutgoingMessage) {
        return JSON.stringify(m)
    }

    private deserialize(m: string | Buffer): IncomingMessage {
        return JSON.parse(m)
    }

    private onConnection(connection: Connection) {
        console.log('new connection id =', connection.id)
    }

    private onDisconnection(connection: Connection) {
        console.log('connection disconnected id =', connection.id)
    }

    private onMessage(connection: Connection, message: IncomingMessage) {
        console.log(`new message from connection = ${connection.id}, message = ${message}`)

        const handler = this.handlers.get(message.service)
        if( handler ) {
            const response = handler(message.payload)
            connection.write(this.serialize({
                from: message.to,
                payload: response
            }))
        }
        else {
            console.warn(`No handler for service "${message.service}"`)
        }
    }  
}
```

To host this protocal handler as a service:

```ts
import { WsHost } from '@fakehost/host'
import { FakeSvc } from './fakeSvc'

const host = new WsHost({
    port: 3000,
    name: 'fakeSvcHost'
})

const protocol = new FakeSvc(host)
// register a fake
protocol.register('echo', (payload: any) => return payload)
```

Hopefully, your real service generates a definition api for how its called, so 
a service that is called by:

```ts
// ui
import { todoSvc } from '@org/api'

export const getTodoById = (id: number) => todoSvc.getTodoById({ id })
```

Can have a strongly typed fake:

```ts
// fake
import { todoSvc} from '@org/api'

const todos = new Map<number, string>() 

const getTodoById: typeof todoSvc['getTodoById'] = (payload) => {
    return todos.get(payload.id)
}
```


### License

@fakehost/host is licensed under the [MIT License](https://mit-license.org/).



[npm-image]: https://img.shields.io/npm/v/@fakehost/host.svg
[npm-url]: https://npmjs.org/package/@fakehost/host
