import { HttpRestService } from '@fakehost/fake-rest'
import { router } from './router'

const PORT = process.env.REST_PORT ? parseInt(process.env.REST_PORT) : 5005
new HttpRestService(router, { port: PORT })
