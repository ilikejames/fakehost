# Options on how to structure the relationship between the ProtocolHost and the NetworkHost. 

### Previous 

```ts
const hydra = new FakeHydra()
const host = new WsHost(hydra)
host.disconnect()
host.dispose()
```

### Current Signalr


```ts
const hub1 = new SignalrHub()
const hub2 = new SignalrHub()

// service
const service = new WsHost({port: 5555})
hub1.add(service)
hub2.add(service)
hub1.disconnect()
host.disconnect()  // all 
host.dispose()

// browser:
const hijacked1 = new BrowserHost({url: 'http://localhost:5555/hub1'})
hub1.add(hijacked1)
const hijacked2 = new BrowserHost({url: 'http://localhost:5555/hub2'})
hub2.add(hijacked)

hub1.disconnect()
hijacked1.disconnect()
hijacked2.disconnect()
```

~~Can not disconnect one host. Not for `WsHost` as they are connected to the same endpoint.~~
Ok, can disconnect by endpoint. Don't have typesafety around that though. 

### idea1

Maybe both cases should be the same:

```ts

type Hub<T extends string> = Record<T, Hub>

const createBrowserSignalr = <T extends string>(url: URl, hubs: Hub) => {
    
}
const host1 = new WsHost({url: 'http://localhost:5555/hub1', protocol: hijacked1})
const host2 = new WsHost({url: 'http://localhost:5555/hub2', protocol: hijacked2})
```

### idea2

```ts
const hub1 = createSignalrHub()
const hub2 = createSignalrHub()
const hubs = [hub1, hub2]

const host = createWsService(e => {
    hubs.forEach(hub => {
        e.on('connection', hub.onConnection)
        e.on('message', hub.onMessage)
        e.on('disconnect', hub.onDisconnect)
    })
})

const host = createWsService(e => {
    // Nope. Can't do this, otherwise have no exposed methods to call
    hub1(e)
    hub2(e)
})

```

### mock-socket

To change `mock-socket` would involve changing the `urlMap` from:

```ts
this.urlMap = {
    'http://something.com/endpoint': { websockets, server}
}
```
to
```ts
this.urls = [
    { 
        pattern: RegExp,
        websockets: WebSocket[],
        server: Server
    }
]
```