import debug from 'debug'

const loggerName = '@fakehost/rest'

export const logger = debug(loggerName)

export const enableLogger = () => {
    debug.enable(loggerName)
}
