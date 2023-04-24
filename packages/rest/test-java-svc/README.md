# test-java-svc

A test java service that acts as the "real" remote service.

Used for:

- generating typescript client definition of the api OpenAPI
- acting as the "real" remote service in the contract tests

## Running the service

```shell
./gradlew bootRun -Dserver.port=8080
```

## Generating type definition

1. start the service (as above)
2. `curl http://localhost:8080/v3/api-docs -o src/main/resources/static/openapi.json`
3. `./gradlew openApiGenerate`
4.
```shell

```

