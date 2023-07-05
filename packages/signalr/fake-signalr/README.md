# @fakehost/signalr

[![NPM Version][npm-image]][npm-url]

A fake version of the Signalr protocol. 

**[See the docs for more info.](https://ilikejames.github.io/fakehost/#/fake-signalr/)**


- can be run as a localhost service, or bundled within a web browser. 
- used for testing client side ui code deeply against a known (fake) backend 
- contract tests to ensure the fake matches the remote
- supports JSON and message pack wire protocols

Best place to look is the at the [test fake service](https://github.com/ilikejames/fakehost/tree/master/packages/signalr/signalr-test-fake-svc/src)




## See also

See [testing in Playwright](https://github.com/ilikejames/fakehost/tree/master/packages/test-playwright) for playwright setup.

See [testing in cypress](https://github.com/ilikejames/fakehost/tree/master/packages/test-cypress) for cypress setup.

See [bundling fakes in a web application](https://github.com/ilikejames/fakehost/tree/master/packages/test-web-app/src/index.tsx) for creating standalone demo apps, or similar e.g storybook. 

See [running as a local service](https://github.com/ilikejames/fakehost/tree/master/packages/signalr/signalr-test-fake-svc/src/start.ts)


## Tests

As `@fakehost/signalr` is a fake version of a real dotnet signalr service.

1. There is a real signalr server `signalr-test-dotnet-svc`. This is a real dotnet signalr service. 
We use a typescript client generation tool `TypedSignalR` to generate a typescript client library for 
calling this remote service. This generate code is outputted to `signalr-test-client-api`

2. There is a fake implementation of the hubs from the dotnet service `signalr-test-dotnet-svc` in the 
`signalr-test-fake-svc`. This is a nodejs fake implementations of the real dotnet services. 

3. Along with the fake implementation in `signalr-test-fake-svc` there are **contract tests** for each hub.
These contract tests run against the fakes (`yarn test`) and are also run against the real dotnet service
(`yarn test:contract`). This ensures that fake version has the exact same behaviour as the real dotnet service, and as such:

**The @fakehost/signalr behaves identically to a real dotnet signalr service**


### License

@fakehost/signalr is licensed under the [MIT License](https://mit-license.org/).


[npm-image]: https://img.shields.io/npm/v/@fakehost/signalr.svg
[npm-url]: https://npmjs.org/package/@fakehost/signalr


