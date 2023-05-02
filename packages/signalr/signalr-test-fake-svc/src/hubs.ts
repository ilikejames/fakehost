import { chatHub } from './fakeChatHub'
import { timeHub } from './fakeTimeStreamHub'
import { orderHub } from './fakeOrderHub'
import { orderState } from './state'

export const hubs = {
    chatHub,
    orderHub,
    timeHub,
} as const

export const state = {
    orderState,
} as const
