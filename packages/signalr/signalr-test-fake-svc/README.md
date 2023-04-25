# @fakehost/signalr-test-fake-svc

This is a fake implementation of the "real" dotnet services from `signalr-test-dotnet-svc`. 

These fakes can be used for testing, e.g. Playwright, Vitest, Jest, Cypress. 


## Tests

The tests should be run (and do in the build) against the fakes AND the dotnet service to ensure they both work identically. 

Run the contract tests against the fakes 

```sh
yarn test
```

Run the contract tests against the dotnet service

```sh
# start the dotnet service
cd packages/signalr/signalr-test-dotnet-svc
dotnet run --urls=http://localhost:5001/
```

```sh
## run the contract tests against the dotnet service
yarn --cwd packages/signalr/signalr-test-fake-svc test:contract
```


