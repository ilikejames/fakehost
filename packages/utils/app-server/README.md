# @fakehost/utils-app-server

Host an existing app with injected runtime variables for running automated tests against. 

Run a web server hosting your app with extra variables written into the window object, and with localStorage items set. This can be run to serve either 
- a prebuilt static website
- to proxy a running development server, e.g. `react-scripts start` or webpack dev server.



Often an application will be served with some environment variables injected into the `index.html` page which can then be read by the javascript e.g. 


```html
<html>
    <body>
        <!-- content etc -->
        <script>
            window.appEnv = {
                service_url: 'wss://service:54321'
            }
        </script>
    </body>
</html>
```

Then when your application loads, it will connect to the server using something like:

```ts
connectToServer({
    url: window.appEnv
})
```

## Usage

### To host a static set of files

```ts
import { startAppServer } from '@fakehost/utils/app-server'
const host = startAppServer(
    '../../public/', 
    3010, 
    { appEnv: 'ws://localhost:5555' },
    { 'feature-toggle1': 'true' }
);
// ...
// Static server on http://127.0.0.1:3010 hosting "/full/path/to/public"`
// 
// You can now open http://127.0.0.1:3010 and
// - window.appEnv will be set to 'ws://localhost:5555'
// - localStorage.getItem('feature-toggle1') => 'true'
host.dispose()
```

### To proxy a running dev server

```ts
import { startAppServer } from '@fakehost/utils/app-server'
const host = startAppServer(
    3000, 
    3010, 
    { appEnv: 'ws://localhost:5555' }, 
    { 'feature-toggle1': 'true' }
);
// ...
// Proxying http://127.0.0.1:3000 -> http://127.0.0.1:3010
// 
// You can now open http://127.0.0.1:3010 and 
// - window.appEnv will be set to 'ws://localhost:5555'
// - localStorage.getItem('feature-toggle1') => 'true'
host.dispose()
```

### Tip

To run the server on a random available port (e.g. for running tests in parallel against different fake backends), use `0` as the target port:

```ts
import { startAppServer } from '@fakehost/utils/app-server'
const host = startAppServer(3000, 0);
console.log(host.port) // -> e.g. 10156
```
