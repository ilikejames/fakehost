import fetch from 'isomorphic-fetch'

declare global {
    // eslint-disable-next-line no-var
    var originalFetch: typeof fetch | undefined
}

export class FetchCollection {
    private static instance: FetchCollection
    private fetches: Array<typeof fetch> = []
    private originalFetch: typeof fetch = fetch

    constructor() {
        this.fetches = [fetch]
    }

    public static getInstance() {
        if (!FetchCollection.instance) {
            FetchCollection.instance = new FetchCollection()
        }
        return FetchCollection.instance
    }

    public push(instance: typeof fetch) {
        this.fetches.push(instance)
        globalThis.fetch = instance
    }

    public teardown() {
        globalThis.fetch = this.originalFetch
    }

    public get instance() {
        return this.fetches[this.fetches.length - 1]
    }

    public next(instance: typeof fetch) {
        const index = this.fetches.findIndex(x => x === instance)
        if (index === -1) {
            return this.originalFetch
        }
        return this.fetches[index - 1]
    }

    public delete(instance: typeof fetch) {
        this.fetches = this.fetches.filter(x => x !== instance)
    }
}
