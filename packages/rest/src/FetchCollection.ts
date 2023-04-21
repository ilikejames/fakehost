declare global {
    // eslint-disable-next-line no-var
    var ___originalFetch: typeof fetch
    // eslint-disable-next-line no-var
    var ___fakeFetch: Array<typeof fetch>
}

// Using a pure singleton is not working once the cypress tests,
// they work locally, but not in CI and I'm not sure for what exact reason.
// Using a `globalThis` variable as a work around.
// This will have the benefit is several versions of fake-rest get unintentionally
// installed as we'll have a global singleton across all versions.
globalThis.___originalFetch = globalThis.___originalFetch || fetch
globalThis.___fakeFetch = globalThis.___fakeFetch || [fetch]

export class FetchCollection {
    private static instance: FetchCollection
    private originalFetch: typeof fetch = fetch

    public static getInstance() {
        if (!FetchCollection.instance) {
            FetchCollection.instance = new FetchCollection()
        }
        return FetchCollection.instance
    }

    private get fetches() {
        return globalThis.___fakeFetch
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
        const next = this.fetches[index - 1]
        if (next) {
            return next
        }
        return this.originalFetch
    }
}
