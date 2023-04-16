import { chatHub } from './fakeChatHub'
import { timeHub } from './fakeTimeStreamHub'

export const hubs = {
    chatHub,
    timeHub,
} as const
