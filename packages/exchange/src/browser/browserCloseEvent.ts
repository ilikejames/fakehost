import { CloseConnectionOptions } from '../types'

const CLOSE_NORMAL = 1000
const CLOSE_NO_STATUS = 1005

export const getBrowserCloseEvent = (options?: CloseConnectionOptions) => {
    if (options) {
        // `wasClean` is specific for mock-socket
        // See: https://github.com/thoov/mock-socket/blob/b08f4ca018a0e0ce672af71cf9cf6c56cfcd9977/src/event/factory.js#L58
        return { ...options, wasClean: [CLOSE_NORMAL, CLOSE_NO_STATUS].includes(options.code) }
    }
    return options
}
