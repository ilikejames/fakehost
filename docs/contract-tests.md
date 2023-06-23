# Contract Tests

## Overview

A contract test asserts that a remote service adheres to a known "contract" i.e., a set of behaviours. 

As [Martin Fowler](https://martinfowler.com/bliki/ContractTest.html) states:

> One of the most common cases of using a TestDouble is when you are communicating with an external service. ...But testing against a double always raises the question of whether the double is indeed an accurate representation of the external service, and what happens if the external service changes its contract?

> A good way to deal with this is to continue to run your own tests against the double, but in addition to periodically run a separate set of contract tests. These check that all the calls against your test doubles return the same results as a call to the external service would. A failure in any of these contract tests implies you need to update your test doubles, and probably your code to take into account the service contract change.

![Alt text](./assets/contract-alignment.png "Contract tests assert that \"Fake Service A\" matches \"Real Service A\"")

**Contract tests assert that "Fake Service A" matches "Real Service A"**

Every project I've worked on, we've had breaks in contract. Many times the other team hadn't even realised that they had broken their contract, either by error, or hadn't realised that their change would break a downstream dependant. 

Contracts do change. Whether by mistake, or intentionally, it is important to be able to be notified of changes that affect you as a consumer of these services. 

### When Contracts Should Be Checked

| Requirement                                   | Fake   | Remote |
|-----------------------------------------------|--------|--------|
| Run on every build                            | ✅     | ❓       |
| Runs periodically                             |        | ✅       |
| Must pass on every build                      | ✅     | ❓       |
| Must be considered correct before deployment  | ✅     | ✅       |




The contract tests should run against the fakes on every build. The contract tests should pass every time against the fakes. Failure of a contract test against the fakes should result in build failure.

The contract tests should run (at worst) __periodically__ against the remote service. Failures should be expected due to bad `dev` environments and other issues, but failures, should be investigated. From [Fowler](https://martinfowler.com/bliki/ContractTest.html):

> A failure in a contract test shouldn't necessarily break the build in the same way that a normal test failure would. It should, however, trigger a task to get things consistent again. This may involve updating the tests and code to bring them back into consistency with the external service. Just as likely it will trigger a conversation with the keepers of the external service to talk about the change and alert them to how their changes are affecting other applications.


## An Example Contract

Going back to the key-value store example. Imagine that the service allows us to `POST key value` multiple times for the same `key`. We know the client-side code relies on this behaviour, so we will want to write a contract test that fails in case a future update breaks that case.

```typescript
test('POST multiple times with the same key', async () => {
    const key = `test-${Date.now()}-same-key`
    try {
        await api.create({ key, value: 'value1' })
        await api.create({ key, value: 'value2' })
        expect(await api.getValue()).toBe('value2')
    }
    finally {
        // clean up
        await api.delete({key})
    }
})
```

See [keyValueStoreRoute.spec.ts](https://github.com/ilikejames/fakehost/blob/master/packages/rest/test-fake-svc/src/keyValueStoreRoute.spec.ts) for further key-value store contracts. 



