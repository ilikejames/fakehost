export type WaitOptions = {
    timeout?: number
    interval?: number
    timeoutMessage?: string
    originalTimeout?: number
}

const DEFAULT_OPTIONS: WaitOptions = {
    timeout: 5000,
    interval: 100,
    timeoutMessage: 'Timed out',
}

/**
 * Recursively call the methods until its returns true, or until timeout has eclipsed
 * @param page
 * @param predicate
 * @param options
 * @returns
 */
export const waitUntil = async (
    predicate: () => Promise<boolean>,
    options?: WaitOptions,
): Promise<void> => {
    const { timeout, interval, timeoutMessage, originalTimeout } = {
        ...DEFAULT_OPTIONS,
        ...options,
    }
    if (timeout! < 0) {
        throw new Error(timeoutMessage)
    }
    const start = new Date().getTime()
    const result = await predicate()

    const elapsed = new Date().getTime() - start
    if (result) {
        // is it close?
        if (originalTimeout && timeout! < 2 * elapsed) {
            console.warn(`WARNING: timeout approaching ${timeout}`)
        }
        return
    }

    await new Promise<void>(resolve => {
        const waitTime = Math.max(interval! - elapsed, 10)
        setTimeout(() => resolve(), waitTime)
    })

    const timeRemaining = timeout! - interval! - elapsed
    if (timeRemaining < 0) {
        throw new Error(`Timeout "${timeoutMessage}" after ${originalTimeout || timeout}`)
    }
    await waitUntil(predicate, {
        ...options,
        timeout: timeRemaining,
        originalTimeout: originalTimeout ?? timeout,
    })
}
