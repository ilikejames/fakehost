# @fakehost/signalr

A fake version of the Signalr protocol. 

- can be run as a service, or bundled within a web browser. 
- used for testing client side ui code deeply against a known (fake) backend 
- contract tests to ensure the fake matches the remote

## Tests

As `@fakehost/signalr` is a fake version of a real dotnet signalr service the tests
exist as contract tests. 

1. There is a real signalr server `signalr-test-dotnet-svc`. This is a real dotnet signalr service. 
We use a typescript client generation tool `TypedSignalR` to generate a typescript client library for 
calling this remote service. This generate code is outputted to `signalr-test-client-api`

2. There is a fake implementation of the hubs from the dotnet service `signalr-test-dotnet-svc` in the 
`signalr-test-fake-svc`. This is a nodejs fake implementations of the real dotnet services. 

3. Along with the fake implementation in `signalr-test-fake-svc` there are **contract tests** for each hub.
These contract tests run against the fakes (`yarn test`) and are also run against the real dotnet service
(`yarn test:contract`). This ensures that fake version has the exact same behaviour as the real dotnet service, and as such:

**The @fakehost/signalr behaves identically to a real dotnet signalr service**


