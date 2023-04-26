import { createRouter, cors } from '@fakehost/fake-rest'
import { orderRoute } from './orderRoute'
import { userRoute } from './userRoute'

// prettier-ignore
export const router = createRouter()
    .use(cors())
    .use('/orders', orderRoute)
    .use('/user', userRoute)
