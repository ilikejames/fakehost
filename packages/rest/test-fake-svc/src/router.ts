import { createRouter, cors } from '@fakehost/fake-rest'
import { userRoute } from './userRoute'

export const router = createRouter()
    .use((req, res, next) => {
        console.log('request', req)
        next()
    })
    .use(cors())
    .use('/user', userRoute)
