import debug from 'debug'

const loggerName = '@fakehost/fake-signalr'

export const logger = debug(loggerName)

export const enableLogger = () => {
    debug.enable(loggerName)
}
