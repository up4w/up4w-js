## up4w-service

Detecting the system architecture at runtime, launching the corresponding underlying [`UP4W`](https://github.com/up4w/up4w-core/blob/master/docs/index.md) network. In Linux systems, it will run `up4w.so`, in macOS it will run `up4w.dylib`, and in Windows it will run `up4w.dll`.

```
import UP4WService from "up4w-service"
import UP4WJS from "up4w-js"

const service = new UP4WService()
async function start() {
  const resp = await service.run()
  const {
    availableEndpoint: { ws },
  } = resp
  // output: ws://127.0.0.1:52416/api
  // `52416` is a random port number.
  const up4w = new UP4WJS(ws)
  // do your stuff...
}
```

> [up4wjs](https://www.npmjs.com/package/up4w-js)

#### service.run()

Running the underlying `UP4W` program.

##### Parameters: none

##### Returns:

`Promise` resolved with a object

- availableEndpoint `object`
  - ws `string` Available websocket endpoint, with randomly assigned port number that may vary each time it is started
  - http `string` Available http endpoint, also with randomly assigned port number
