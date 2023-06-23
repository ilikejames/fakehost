# What is a Fake?

A fake is a type of a [Test Double](https://www.martinfowler.com/bliki/TestDouble.html), which has a working implementation matching the behaviour of an "real" service. 

An example would be for a key-value store, with the following methods:

- `GET /{key}` retrieves the value for the `{key}`
- `POST /{key}` inserts the value at `{key}`
- `PATCH /{key}` updates the value at `{key}`
- `DELETE /{key}` deletes the `{key}`

A **mock** version of the key value store would have predefined return values for each. 

```bash
GET /key1 
    -> value1
PATCH /key1 "value2" 
    -> ok
GET /key1 
    -> value1  # original predefined value returned
```

Whereas a **fake** would have a simple working implementation, so that:

```bash
GET /key1 
    -> value1
PATCH /key1 "value2" 
    -> ok
GET /key1 
    -> value2  # ✅ new value returned
```

The implementation for the fake can be as simple as possible. In the key-value store, there would be no need to actually persist the data to a database, instead an in memory `Map` would be sufficient. 

```typescript
const store = new Map<string, string | number>()

app.get('/{key}', (req, res) => {
    const { key } = req.params
    if(!store.has(key)) {
        return res.status(404).send(`"${key}" not found`)
    }
    res.json({ key, value: store.get(key) })
})

app.post('/{key}', (req, res) => {
    const { key } = req.params
    // set the new value
    store.set(key, req.body)
    res.status(200).send('ok')
})

// ...etc
```

In the example above, the `post` method will always accept a new value for a specific key. However, the real remote service might not accept this, and might return a HTTP Status code of `409 - Conflict` is the key already exists. 

We can update the `post` method to reflect this:


```typescript
app.post('/{key}', (req, res) => {
    const { key } = req.params
    if(store.has(key)) {
        // ⚠️ Send 409 - Conflict because the key already exists
        return res.status(409).send(`Conflict. "${key}" already exists`)
    }
    // set the new value
    store.set(key, req.body)
    res.status(200).send('ok')
})
```

As you can see, the behaviour of this method is key to know as it will effect the design of any client-side code. 

**If the real remote service performs this check, the client-side must:**

- if the key already exists, it must call the `patch` method. 
- if the key doesn't exist it must call the `post` method. 

Not only should be ensure that the Fake duplicates the current behaviour, it should also ensure that it maintains the correct behaviour over time. 

[Next, writing contract tests to lock down assumptions](./contract-tests.md)
