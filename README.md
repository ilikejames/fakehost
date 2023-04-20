# @fakehost

A collection of resources for UI development. Fake out your REST, and WebSocket services, 
control them from your tests (Jest, Vitest, Playwright, Cypress) to provide deep level of testing, including edge-cases, reconnection, error throwing. 

Bundle your fake services as part of storybook, or a demo app. 

Build the ui against a fake version of the real api, while a backend developer builds the real service.

Use contract tests to ensure your fakes matches, and continues to match the real remote service. 


- `@fakehost/fake-rest`: fake out rest calls to a remote service. 
- `@fakehost/host`: base package for running a websocket based node service, or bundling within a browser for demos.
- `@fakehost/signalr`: a fully aligned fake signalr WebSocket service. Add your own service implementation and control it from your tests. 


## Start the app running fakes as a local service:

```sh
yarn start:fakes
```

And open the web app connected to the local fakes:
```sh
yarn --cwd packages test-web-app start:fakeapp
```


## Start the app with the fakes bundled:

```sh
yarn --cwd packages test-web-app start:bundledapp
```

## Tests:

Unit tests:

```sh
yarn test
```

e2e tests (cypress & playwright):

```sh
yarn e2e
```

Contract tests:

```sh
# start the dotnet service
cd packages/signalr/signalr-test-dotnet-svc
run --urls=http://localhost:5001/
```

```sh
## run the contract tests against the dotnet service
yarn --cwd packages/signalr/signalr-test-fake-svc test:contract
```

## Contact

[@jammed](https://twitter.com/Jammed)