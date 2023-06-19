import { createRouter } from '@fakehost/fake-rest'
import { KeyValueControllerApi } from '@fakehost/rest-generated-client-api'

const store = new Map<string, string>()

const getAll: KeyValueControllerApi['getAll'] = async () => Object.fromEntries(store.entries())
const getValue: KeyValueControllerApi['getValue'] = async ({ key }) => store.get(key)!

export const keyValueStoreRoute = createRouter()
    .get('/', async (_, res) => {
        res.json(await getAll())
    })
    .get('/:key', async (req, res) => {
        if (!store.has(req.params.key)) {
            return res.status(404).send('Not found')
        }
        res.json(await getValue(req.params))
    })
    .post('/:key', async (req, res) => {
        if (store.has(req.params.key)) {
            return res.status(409).send('Already exists')
        }
        store.set(req.params.key, req.body?.value as string)
        return res.status(201).send('Created')
    })
    .patch('/:key', async (req, res) => {
        if (!store.has(req.params.key)) {
            return res.status(404).send('Not found')
        }
        store.set(req.params.key, req.body?.value as string)
        res.status(204).send('Updated')
    })
    .delete('/:key', async (req, res) => {
        if (!store.has(req.params.key)) {
            res.status(404).send('Not found')
        } else {
            store.delete(req.params.key)
            res.status(204).send('Deleted')
        }
    })
