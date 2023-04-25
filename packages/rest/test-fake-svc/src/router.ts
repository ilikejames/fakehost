import { createRouter, cors } from '@fakehost/fake-rest'
import { userRoute } from './userRoute'

export const router = createRouter().use(cors()).use('/user', userRoute)
