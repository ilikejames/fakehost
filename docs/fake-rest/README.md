# @fakehost/fake-rest

<!-- [![NPM Version][npm-image]][npm-url] -->

A fake REST server that can run as a service or bundled within a browser, for testing and demoing.

## Motivation

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

// fake handlers of the api
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

## QueryString

Parameters in the querystring are not routed by default. It will match only on the path. 

However, named querystring parameters can be added, which will result in a **typed** `req.query` object passed.

** NOTE: remember to escape the `?` with a `\\`

```
const router = createRouter()
  .get('/user\\?id=:id&username=:username', (req) => {
    // req.query.id : string | undefined
    // req.query.username string | undefined
  })
```

## Middleware

The REST router supports middleware to enhance its functionality and handle common use cases. Middleware can be added using the `.use()` method of the router.

Like all routes, its first come first served. So its typical to have most middleware initialized first within a router. The exception to this would be for a `404 Not found` error handler which should be the last item in the router.

### Usage
To use middleware with your REST router:

```ts
import {createRouter, cors, trailingSlash} from '@fakehost/rest'

const router = createRouter()
  .use(cors())
  .use(trailingSlash());
```

Below are the supported middleware and their configurations.

### cors

The cors middleware handles Cross-Origin Resource Sharing (CORS) to enable or restrict resource sharing across different origins. It provides options to customize headers and methods for CORS handling.

```ts
router.use(cors());
```

**Options**

- `allowHeaders` (optional):

An array of additional HTTP headers to allow in the Access-Control-Allow-Headers response.
Defaults to: `['Content-Type', 'Authorization', ...headersFromAccessControlRequest]`
Includes any headers sent via the `Access-Control-Request-Headers`.

- `allowMethods` (optional):

An array of HTTP methods allowed in the `Access-Control-Allow-Methods` response.
Defaults to: `['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']`


### trailingSlash

The trailingSlash middleware enforces or removes trailing slashes from URL paths. This ensures consistent routing behavior for paths with or without trailing slashes.

```ts
router.use(trailingSlash());
```

**Options**

- `enforceTrailingSlash` (optional):
A boolean that determines whether trailing slashes should be enforced or removed.
Defaults to `false` (trailing slashes are removed).

```ts
router.use(trailingSlash({ enforceTrailingSlash: true }));
```
Requests to `/store` are redirected to `/store/`.
Routes such as /store/ work consistently.


## Test Setup

See [testing in Playwright](https://github.com/ilikejames/fakehost/tree/master/packages/test-playwright) for playwright setup.

See [testing in cypress](https://github.com/ilikejames/fakehost/tree/master/packages/test-cypress) for cypress setup.

See [bundling fakes in a web application](https://github.com/ilikejames/fakehost/tree/master/packages/test-web-app/src/index.tsx) for creating standalone demo apps, or for similar for storybook etc. 

See [running as a local service](https://github.com/ilikejames/fakehost/tree/master/packages/signalr/signalr-test-fake-svc/src/start.ts)


[npm-image]: https://img.shields.io/npm/v/@fakehost/fake-rest.svg
[npm-url]: https://npmjs.org/package/@fakehost/fake-rest
