# @fakehost/fake-rest

[![NPM Version][npm-image]][npm-url]

A fake REST server that can run as a service or bundled within a browser, for testing and demoing.

This is not a production server. 

## Example use cases

- For deep testing against a remote service you have very little control over
- For creating a standalone demo application

Run your e2e tests against a controllable fake version of a remote REST service.

Ensure your fake is aligned with the remote using [contract tests](https://martinfowler.com/bliki/ContractTest.html). 

Can be run in any node environment e.g. 

- Testing with Playwright, Webdriver, Jest, Vitest
- Testing react-native applications with `react-native-testing-library`

For these, as the test runner runs in a nodejs process, its just a case of 
starting a `HttpRestService` with your `Router`, and ensuring your application
endpoint is configured to point to your fake's endpoint. 


## See also

See [testing in Playwright](https://github.com/ilikejames/fakehost/tree/master/packages/test-playwright) for playwright setup.

See [testing in cypress](https://github.com/ilikejames/fakehost/tree/master/packages/test-cypress) for cypress setup.

See [bundling fakes in a web application](https://github.com/ilikejames/fakehost/tree/master/packages/test-web-app/src/index.tsx) for creating standlone demo apps, or for similar for storybook etc. 

See [running as a local service](https://github.com/ilikejames/fakehost/tree/master/packages/signalr/signalr-test-fake-svc/src/start.ts)



### Why not just mock?

Mocking is great, but tends to leave a lot of static test data around your tests. 
What happens if the test data no longer matches the remote service? 

### Why not hijack the code directly from my test environment? 

I've seen many examples of test setups that do things like expose methods on the 
global `window` object that are then called from tests to control the internal behaviour. 

This is fine up to a point, but `a` this is creating a whole new api specifically for tests,
`b` there is no longer a contract between your test version and the real version. Its 
much cleaner to instead treat the network interface of your application as the interface 
to your test setup. 



### License

@fakehost/fake-rest is licensed under the [MIT License](https://mit-license.org/).


[npm-image]: https://img.shields.io/npm/v/@fakehost/fake-rest.svg
[npm-url]: https://npmjs.org/package/@fakehost/fake-rest


