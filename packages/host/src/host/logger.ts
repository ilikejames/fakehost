import debug from 'debug'

const loggerName = '@fakehost/host'

export const logger = debug(loggerName)

export const enableLogger = () => {
    debug.enable(loggerName)
}
