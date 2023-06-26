import debug from 'debug'

const loggerName = '@fakehost/exchange'

export const logger = debug(loggerName)

export const enableLogger = () => {
    debug.enable(loggerName)
}
