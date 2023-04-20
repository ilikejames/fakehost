# @fakehost/exchange

Gives 3 types of fake host:

1. `InlineFakeHost` for bundling directly in a browser. This works by mocking out the websocket.
2. `WsFakeHost` a W3C compliant websocket service for running in node.
3. `SockJSFakeHost` a sockjs service as some clients require this.

## Debug Logging

Debug logging can be enabled through the constructor, or via the environment variable: 

```sh
DEBUG=@fakehost/exchange
```

### Example usage

This library won't give you much on its own. Instead is a way to support the same fake services code hosted within the browser, or running as a node process.

```ts
import { ProtocolHandler, ServiceDefinition } from '@fakehost/exchange';
import { WsFakeHost } from '.';
import { Connection } from '../dist/host/BaseFakeHost';

interface IncomingMessage {
    route: string;
    kind: 'in';
    payload: unknown;
}

interface OutgoingMessage {
    route: string;
    kind: 'out';
    payload: unknown;
}

type SubscriptionHandler = (input: any) => any;

export class CustomFakeHost implements ProtocolHandler<IncomingMessage, OutgoingMessage> {
    private subscriptions = new Map<IncomingMessage['route'], SubscriptionHandler>();

    onConnection(connection: Connection) {
        // Called on a new connection
    }

    serialize(message: OutgoingMessage): string {
        // Message formatted for the wire
        return JSON.stringify(message);
    }
    deserialize(message: string | Buffer): IncomingMessage {
        // Message received
        const parsed =
            typeof message === 'string' ? message : new TextDecoder('utf-8').decode(message);
        return JSON.parse(parsed) as IncomingMessage;
    }
    onMessage(connection: Connection, message: IncomingMessage): void {
        // Handle the message, routing to the subscriptions registered in `subscribe`
        const match = this.subscriptions.get(message.route);
        if (match) {
            // call, handle response. e.g.
            const result = match(message.payload);
            connection.write(
                this.serialize({
                    kind: 'out',
                    payload: this.serialize(result),
                    route: message.route,
                }),
            );
        } else {
            // Not found
        }
    }
    subscribe(definition: ServiceDefinition<Partial<IncomingMessage>>): void {
        // Here you want to subscribe to different routes.
        this.subscriptions.set(definition.destination.route!, definition.handler);
    }
}

type CustomServiceDefinition = ServiceDefinition<Pick<IncomingMessage, 'route'>>;

const services: CustomServiceDefinition[] = [
    {
        destination: {
            route: 'route/to/service',
        },
        handler: (name: string) => `hello ${name}` as SubscriptionHandler,
    },
];
const customHost = new CustomFakeHost();
new WsFakeHost(customHost, 5555);
services.forEach(svc => customHost.subscribe(svc));
```
