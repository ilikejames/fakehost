# @fakehost/test-playwright

e2e tests against fakes in playwright

## Debug config

```json
{
        "name": "test-playwright e2e",
        "type": "pwa-node",
        "request": "launch",
        "runtimeArgs": [
          "playwright", 
          "test", 
          "-c", 
          "${workspaceRoot}/packages/test-playwright/src/config/config.ts", 
          "${relativeFile}", 
          "--headed"
        ],
        "runtimeExecutable": "npx",
        "skipFiles": [
          "<node_internals>/**"
        ]
      }
```