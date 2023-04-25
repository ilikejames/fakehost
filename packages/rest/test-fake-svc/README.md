# @fakehost/rest-test-fake-svc

The rest service for testing bundling/service hosting and contract testing.


## Tests

The tests should be run (and do in the build) against the fakes AND the java OpenApi service to ensure they both work identically. See contract tests.

Run the contract tests against the fakes 

```sh
yarn test
```

Run the contract tests against the dotnet service

```sh
# start the dotnet service
cd packages/rest/test-java-svc
./gradlew bootRun -Dserver.port=8080
```

```sh
## run the contract tests against the dotnet service
yarn --cwd packages/rest/test-fake-svc test:contract
```
