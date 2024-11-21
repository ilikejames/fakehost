# @fakehost/fake-rest

[![NPM Version][npm-image]][npm-url]

A fake REST server that can run as a service or bundled within a browser, for testing and demoing.

**This is not a production server.**

**[See the docs](https://ilikejames.github.io/fakehost/#/fake-rest)**


## Example use cases

- For deep testing against a remote service you have very little control over
- For creating a standalone demo application

Run your e2e tests against a controllable fake version of a remote REST service.

Ensure your fake is aligned with the remote using [contract tests](https://martinfowler.com/bliki/ContractTest.html). 

Can be run in any node environment e.g. 

- Testing with Playwright, Webdriver, Jest, Vitest
- Testing react-native applications with `react-native-testing-library`

## Router

```ts
import { createRouter } from '@fakehost/fake-rest'

// Example api. This would normally be imported from a separate package
type KeyValueService = {
    has: (key: string) => Promise<boolean>
    getAll: () => Promise<Record<string, string>>
    getValue: (key: string) => Promise<string>
    setValue: (key: string, value: string) => Promise<void>
    updateValue: (key: string, value: string) => Promise<void>
    deleteItem: (key: string) => Promise<void>
}

// fake handlers
const store = new Map<string, string>()

const has: KeyValueService['has'] = async (key) => store.has(key)
const getAll: KeyValueService['getAll'] = async () => Object.fromEntries(store.entries())
const getValue: KeyValueService['getValue'] = async (key) => store.get(key)!
const setValue: KeyValueService['setValue'] = async (key, value) => { store.set(key, value) }
const updateValue: KeyValueService['updateValue'] = setValue
const deleteItem: KeyValueService['deleteItem'] = async (key) => { store.delete(key) }

// routing
export const keyValueStoreRoute = createRouter()
    .get('/', async (_, res) => {
        res.json(await getAll())
    })
    .get('/:key', async (req, res) => {
        if (! await has(req.params.key)) {
            return res.status(404).send('Not found')
        }
        res.json(await getValue(req.params.key))
    })
    .post('/:key', async (req, res) => {
        if (await has(req.params.key)) {
            return res.status(409).send('Already exists')
        }
        setValue(req.params.key, req.body?.value ?? '')
        return res.status(201).send('Created')
    })
    .patch('/:key', async (req, res) => {
        if (!await has(req.params.key)) {
            return res.status(404).send('Not found')
        }
        updateValue(req.params.key, req.body?.value ?? '')
        res.status(204).send('Updated')
    })
    .delete('/:key', async (req, res) => {
        if (!await has(req.params.key)) {
            res.status(404).send('Not found')
        } else {
            deleteItem(req.params.key)
            res.status(204).send('Deleted')
        }
    })
```

## Hosting

As a node service:
```ts
import { HttpRestService, cors } from '@fakehost/fake-rest'
import { keyValueStoreRoute } from './keyValueStore'

const router = createRoute()
    .use(cors())
    .use('/keyValueStore', keyValueStoreRoute)
    // .use('/otherRoute', ...)

export const host = new HttpRestService(router, { port: 5555 })
console.log('Started HijackedRestService on', await host.url)
```

Or, as a hijacked browser fetch call (embedded for storybook, cypress testing):
```ts
import { HttpRestService, cors } from '@fakehost/fake-rest'
import { keyValueStoreRoute } from './keyValueStore'

const router = createRoute()
    .use(cors())
    .use('/keyValueStore', keyValueStoreRoute)
    // .use('/otherRoute', ...)

const url = new URL(`http://remote-url`)
export const host = new HijackedRestService(url, router)
console.log('Started HijackedRestService on', await host.url)
```


## See also

See [testing in Playwright](https://github.com/ilikejames/fakehost/tree/master/packages/test-playwright) for playwright setup.

See [testing in cypress](https://github.com/ilikejames/fakehost/tree/master/packages/test-cypress) for cypress setup.

See [bundling fakes in a web application](https://github.com/ilikejames/fakehost/tree/master/packages/test-web-app/src/index.tsx) for creating standalone demo apps, or for similar for storybook etc. 

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


