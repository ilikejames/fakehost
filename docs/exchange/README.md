# @fakehost/exchange

[![NPM Version][npm-image]][npm-url]

## Overview

A basic package for building fake messaging services that communicate over websockets. 

**This library won't give you much on its own.** Instead its used to support running the same fake service code hosted **within the browser** or **running as a node process**. 

Provides two main objects:

- `WsHost`. For starting a websocket service. This runs as a node process which can be started from the command line, or started from nodejs tests e.g. jest, vitest, playwright, webdriver etc. 
- `BrowserWsHost`. For starting a "mocked" websocket service. This runs directly within the browser, and is useful for bundling "fake" services within Storybook, or a demo application, and for running browser based tests such as Cypress.

**⚠️ Don't use this in production environments. This is for testing, and demo purposes only.**

## Example Usage

For a full example see [@fakehost/fake-signalr](../fake-signalr/).

### Protocol Handler

Messaging services have many different types of protocols to manage the exchange of messages. Many of these are custom.

Lets say we are building a fake protocol handler for a service that has the following incoming message and outgoing message structure:

```typescript
type IncomingMessage = {
    destination: string
    payload: unknown
}

type OutgoingMessage = {
    destination: string
    payload: unknown
}
```

Messages are all in JSON, so we can easily inspect what the service is doing by examining the network tab and looking at the messages. 

An extremely basic protocol that only supports simple request/response messages could look like:

```typescript
import { Host, ConnectionId, Connection, ExchangeEvent } from '@fakehost/exchange'

type MessageHandler = (payload: unknown) => unknown

export class MyProtocolHandler {

    private messageHandlers = new Map<string, MessageHandler>()

    constructor(host: Host) {
        host.on('connection', this.onConnection.bind(this))
        host.on('disconnection', this.onDisconnection.bind(this))
        host.on('message', this.onMessage.bind(this))
    }

    onConnection({ connection }: ExchangeEvent<'connection'>) {
        console.log(`a new connection "${connection.id}"`)
    }

    onDisconnection({ connection }: ExchangeEvent<'disconnect'>) {
        console.log(`connection "${connection.id}" has disconnected`)
    }

    onMessage({ connection, message: rawMessage }: ExchangeEvent<'message'>) {
        // deserialize the incoming message
        const message: IncomingMessage = this.deserialize(rawMessage)

        // get the handler for the service + method
        const handler = this.messageHandlers.get(message.destination)

        if(!handler) {
            console.log(`"${destination}" not handled`)
            return
        }

        // call the handler
        const result = handler(message.payload)

        // send the handler's response
        connection.write(JSON.stringify({
            destination: message.destination,
            payload: result
        }))
    }

    deserialize(message: string | Buffer) {
        const parsed = typeof message === 'string' ? message : new TextDecoder('utf-8').decode(message);
        return JSON.parse(parsed) as IncomingMessage;
    }

    register(destination: string, handler: MessageHandler) {
        this.messageHandlers.set(destination, handler)
    }
}
```

And lets wire up a handler, and start  `MyProtocolHandler` running as a localhost service:

```typescript
import { WsHost } from '@fakehost/exchange'

// start a websocket service listening on port 5000 at /json
const host = new WsHost({
    name: 'fake',
    debug: true,
    port: 5000,
    path: '/json'
})

// create a new protocol handler
const protocol = new MyProtocolHandler(host)

// create a simple handler and register it to handle incoming messages with destination of `greeting`
const greetingHandler = (payload: { name: string }) => {
    return `Hello, ${name}!`
}
protocol.register('greeting', greetingHandler)
```


## Debug

Debug logging can be enabled through the constructors, or via the environment variable:

```sh
DEBUG=@fakehost/exchange
```

## License

@fakehost/exchange is licensed under the [MIT License](https://mit-license.org/).


## Migrating from v0.x

See [Migrating from v0.x](exchange/migrating-from-v0.md)

[npm-image]: https://img.shields.io/npm/v/@fakehost/exchange.svg
[npm-url]: https://npmjs.org/package/@fakehost/exchange
