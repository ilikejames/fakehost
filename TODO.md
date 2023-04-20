# TODO

## e2e

- [x] playwright test setup
- [x] cypress test setup
- [ ] Signalr: reconnection test 
- [ ] cypress why blank page on 2nd test? 
- [ ] rest tests. POST json. POST FormData
- [ ] controlling fakes from tests


## fake-signalr

### Message Types:

- [x] Invocation
- [x] StreamItem = 2,
- [x] Completion = 3,
- [x] StreamInvocation = 4,
- [x] CancelInvocation = 5,
- [x] Ping = 6,
- [ ] Close = 7

### Misc 
- [x] Have a getConnectionId on the `this`
- [x] Handle thrown errors from methods
- [x] Implement `IHubCallerClients` methods
- [x] Migrate into @fakehost
- [x] Get a build (inc dotnet) running in CI
- [ ] authentication on endpoints
- [ ] increase test coverage to capture close on streams
- [x] README
- [ ] docs.github.com with philosophy and examples
- [x] fake rest? At least some way of running in cypress/storybook
- [ ] binary format


## Rest

- [x] REST: setHeaders
- [ ] REST: more verbs
- [ ] documentation



