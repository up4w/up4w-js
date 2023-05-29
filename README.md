# UP4WJS

`up4w-js` is a collection of JavaScript libraries written in TypeScript, with built-in type declaration files. It is used for interacting with the [UP4W](https://github.com/up4w/up4w-core/blob/master/docs/index.md) JSON API and is compatible with both Node.js and browser environments. It supports different coding styles for importing, including TypeScript, ECMAScript module, and CommonJS.

## Installation

You can install the package either using [NPM](https://www.npmjs.com/package/up4w-js) or using [Yarn](https://yarnpkg.com/package/up4w-js)

### Using NPM

```
npm install up4w-js up4w-service
```

### Using Yarn

```
yarn add up4w-js up4w-service
```

## Overview

As you see, to communicate with the `UP4W` network, you need to install two package: `up4w-js` and `up4w-service`

`up4w-service` is responsible for automatically detecting the system architecture at runtime, launching the corresponding underlying `UP4W` program, and asynchronously returning the network access point of the currently running `UP4W` instance.

`up4w-service` can only run in `Node.js` environment.

| Package      | Description                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| up4w-service | automatically detecting the system architecture at runtime, launching the corresponding underlying `UP4W` program. |

`up4w-js` consists of multiple independent core modules, each responsible for managing interactions with a specific set of interfaces in the underlying `up4w` system.

| Package | Description                                                                                                                                                                 |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| up4w-js | A collection of all interfaces for interacting with the underlying `UP4W` network.It is also one of the two packages that you must use, the other one being `up4w-service`. |

## Data response structure

All interfaces are implemented to return a Promise asynchronously and non-blocking. The data structure returned is as follows:
| Field | Type | Description | Required |
|----|----|----|---|
| rsp | string | The module action |Y|
| ret | object | The data returned has a specific structure that can vary depending on the interface. | N |
| fin | boolean | indicates whether more messages will be responded |N|
| err | number | Error reason, returned only when an error occurs. | N |

> More infomation about response structure [UEP_0021](https://github.com/up4w/up4w-core/blob/master/docs/uep_0021.md)

Here is a example:

```
{
  rsp: "msg.received",
  ret: {
    id: "3866091278",
    timestamp: 1684658460224,
    app: 1,
    action: 4096,
    "recipient": "<a_base64_encode_address>"
    sender: ":myself",
    content: "Explain quantum computing in simple terms",
    content_type: 13,
  },
}
```

## Usage example

`up4w-js` supports both `ES modules` and `CommonJS` imports. In the upcoming examples, you can use `import` or `require` based on your module system.

We will use `import` by default for demonstration purposes.

```
// `es module` or `Typescript` style
import UP4WJS from "up4w-js";
import UP4WService from "up4w-service"

// or you can use commonjs style
const UP4WJS = require('up4w-js')
const UP4WService = require('up4w-service')

// now create instance
const service = new UP4WService()

start()

async function start() {
	const response = await service.run()
	// Got available endpoints, `ws` means websocket, the other one is `http`
	// Use `ws` please for now
	const { availableEndpoint: { ws } } = response

	// Create up4w-js instance, UP4WJS class need only one arguments: endpoint
	const up4wjs = new UP4WJS(ws)

	// Waiting for up4wjs to complete initialization.
	await up4wjs.whenReady({
        app_name: "deso",
        mrc: {
          msgs_dir: ":mem",
          default_swarm: "<a_base64_address>", //replace it with your swarm address
          flags: ["delay00_load"],
        },
        mlt: {},
        gdp: {},
        pbc: {},
        lsm: {},
    })

    // In the following documentation, you will learn more about the details of interface calls.
    // do what you want ...
}
```

## up4w-service

Detecting the system architecture at runtime, launching the corresponding underlying `UP4W` network. In Linux systems, it will run `up4w.so`, in macOS it will run `up4w.dylib`, and in Windows it will run `up4w.dll`.

```
import UP4WService from "up4w-service"

const service = new UP4WService()
async function start() {
  const resp = await service.run()
  const {
    availableEndpoint: { ws },
  } = resp
  // output: ws://127.0.0.1:52416/api
  // `52416` is a  random port number.
  console.log(ws)
}
```

#### service.run()

Running the underlying `UP4W` program.

##### Parameters: none

##### Returns:

`Promise` resolved with a object

- availableEndpoint `object`
  - ws `string` Available websocket endpoint, with randomly assigned port number that may vary each time it is started
  - http `string` Available http endpoint, also with randomly assigned port number

## up4wjs

A collection of methods for interacting with the underlying UP4W network.

```
import UP4WJS from "up4w-js"
const up4w = new UP4WJS(endpoint)
```

### Parameters:

| Field    | Type   | Description                                                                                   |
| -------- | ------ | --------------------------------------------------------------------------------------------- |
| endpoint | string | The entry point provided by the underlying `UP4W` network currently only supports `WebSocket` |

> You need to obtain the `endpoint` through `up4w-service`.

### Returns

A instance of `up4wjs`

### Exmaple

```
import UP4WService from "up4w-service"
import UP4WJS from "up4w-js"

const service = new UP4WService()
async function start() {
  const resp = await service.run()
  const {
    availableEndpoint: { ws },
  } = resp
  // create instance
  const up4w = new UP4WJS(ws)
  ...
}
```

#### up4w.version()

Get version and build information of the peer, no arguments.

```
const version = await up4w.version()
// output:{  rsp: 'core.ver', inc: '41c870e4389fceab', ret: 'version 1.1, build May 20 2023 20:45:33' }
conole.log(version)
```

##### Parameters

none

##### Returns

`Promise` object resolved with a version string

#### up4w.whenReady(params)

Initialize all desired modules.

```
const result = await up4w.whenReady({
  app_name: 'deso',
  mrc: {
    msgs_dir: ':mem',
   default_swarm: "<a_base64_address>",
    flags: ['delay00_load'],
  },
  mlt: {},
  gdp: {},
  pbc: {},
  lsm: {},
})
console.log(result) // output: true
```

##### Parameters:

##### `params` - `object`

- `app_name` is the name of the application, instances with different `app_name` will not discover each other in nearby peers ([UEP-8](https://github.com/up4w/up4w-core/blob/master/docs/uep_0008.md))
- `mrc` initialize message relay core ([UEP-12](https://github.com/up4w/up4w-core/blob/master/docs/uep_0012.md)), `msgs_dir` specifies the storage directory for saving pooled messages, or its value can be `:mem` to just memory for temporary storage.
- `media_dir` specifies storage directory for saving offload media, if specified, the distributed media store [(UEP-16](https://github.com/up4w/up4w-core/blob/master/docs/uep_0016.md)) will be initialized as well.
- `dvs` initialize distributed key-value store ([UEP-20](https://github.com/up4w/up4w-core/blob/master/docs/uep_0020.md)) with `kv_dir` specifies the storage directory, or memory.
- flags
  - "delay_load" indicates the `media` db or the `kv` db is not loaded when initialization
  - "db_dedicate" two db on disk, one for default swarm, another for all non-default ones (merged)
  - "db_separated" one separated db on disk for every swarm
  - "db_merged" a single db for all swarms (merged)
- `hob` enable packet obfuscation ([UEP-6](https://github.com/up4w/up4w-core/blob/master/docs/uep_0006.md)).
- `lsm` initialize nearby peers module ([UEP-8](https://github.com/up4w/up4w-core/blob/master/docs/uep_0008.md)).
- `mlt` enable multi-link tunnels
- `gdp` initialize gossip data protocol ([UEP-11](https://github.com/up4w/up4w-core/blob/master/docs/uep_0011.md)), it will be automatically initialized if `mrc` or `dvs` is specified.
- `pbc` enable packet bouncer

#### Returns

`Promise` resolved with `boolean`, true means initialize succesfully.

#### up4w.shutdown()

Uninitialize the `UP4W` stacks, no arguments, no return. Shutdown is unrecoverable.

```
await up4w.shutdown()
```

##### Parameters

none

##### Returns

`Promise` object resolved with `null`

### up4w.contact

#### up4w.contact.siginWithSeed(seed, profile)

Set current sign-in user by seed(private key)

```
const user = await up4w.contact.siginWithSeed("<a_base64_seed_string>")
// output '{"rsp":"social.signin","inc":"51db8a36ac7ef161","ret":{"pk":"e6t9rv1...pkgen3y40v73z0"}}'
console.log(user)
```

##### Parameters

`seed` is the 28-byte root seed and `mnemonic` is its mnemonic encoding (UEP-13). Only one of `seed` and `mnemonic` is required to be specified.'

##### Returns

Promise `object` resolved with:

- pk - `string` a public key that has been encoded using `Base64`

#### up4w.contact.siginWithMnemonic(words, profile)

Set current sign-in user by mnemonic words, this function is equivalent to `up4w.siginWithSeed`, but the difference lies in the input parameter.

```
const user = await up4w.contact.siginWithMnemonic("migrant adipex ... laos since")
// output '{"rsp":"social.signin","inc":"51db8a36ac7ef161","ret":{"pk":"e6t9rv1...pkgen3y40v73z0"}}'
console.log(user)
```

##### Parameters

- words - `string` A list of 18 mnemonic words separated by spaces.
- profie - `object`Same to `siginWithSeed`

##### Returns

Same to `up4w.siginWithSeed`

#### up4w.contact.addUser(user)

Add a new user in the contact list, no return. This method will not send a greeting message to the user.

```
const result = await up4w.contact.addUser({
  pk: "Target_User_PK",
  name: 'Lufi'
})
// output {"rsp":"social.add_user","inc":"43bbe30cc17b88c6","ret":null}
cosnole.log(result)
```

##### Parameters

user - `object`

- pk`string` a public key that has been encoded using `Base64`
- name `string` User's name , optional
- gender `string` User's gender, optional
- geolocation`string` User's geographical location, optional
- greeting_secret `string`is the greeting secret required for adding a new friend, optional

##### Returns

`Promise` object resolved with `null` `ret`

#### up4w.contact.removeUser(pk)

Remove an existing user, no return.

```
const result = await up4w.contact.removeUser(Target_User_PK)
// output {"rsp":"social.remove_user","inc":"43bbe30cc17b88c6","ret":null}
cosnole.log(result)
```

##### Parameters

- pk`string` a public key that has been encoded using `Base64`

##### Returns

`Promise` object resolved with `null` `ret`

## up4w.msg

> See [Core Social Messaging APIs](https://github.com/up4w/up4w-core/blob/master/docs/uep_0022.md)

#### up4w.msg.onMessage(callback[, receiveParams])

Subscribe to message push notifications to listen for all events pushed by the `UP4W` network, such as chat replies, and so on.

```
import UP4WService from "up4w-service"
import UP4WJS from "up4w-js"

const service = new UP4WService()
async function start() {
  const resp = await service.run()
  const {
    availableEndpoint: { ws },
  } = resp
  const up4w = new UP4WJS(ws)
  await up4w.whenReady()
  await up4w.contact.siginWithSeed("<a_base64_seed_string>")
  // Receive message push notifications as early as possible.
  up4w.msg.onMessage((message) => {
  	console.log("Receive message: ", message)
  }, {app: 1})
}
start()
```

The `message` looks like:

```
{
    "rsp": "msg.received",
    "ret": {
    	"swarm": " ... ",
        "id": "795100302",
        "timestamp": 1684752857888,
        "app": 1,
        "action": 4097,
        "recipient": "<a_base64_encode_address>",
        "sender": "<a_base64_encode_address>",
        "content": "Quantum computing is a type of computing that ...",
        "content_type": 13
    }
}
```

##### Parameters

- callback: `function(message)`

  - swram - `string` the swarm DHT address in base16, or the alias as set by join swarm request (`req:"swarm.join"`, [UEP-21](https://github.com/up4w/up4w-core/blob/master/docs/uep_0021.md))
  - `id` the id of the message in the scope of current swarm, a `uint64_t` in string.
  - timestamp - `number` of the message in millisecond
  - sender -`string`: the public key of the sender in base64
  - app -`number` the built-in application id, an `uint16_t`
  - action -`number` the operation code specific to the application, an `uint16_t`
  - recipient - `string` stands for the recipient, which is a user's `pubkey` or that of a scenario-specific identity ([UEP-13](https://github.com/up4w/up4w-core/blob/master/docs/uep_0013.md))
  - content -`string` the content of the message can be parsed object, a plain text, or a base64 string according to `app` and `action`
  - content_type -`number` the type of the content ([UEP-17](https://github.com/up4w/up4w-core/blob/master/docs/uep_0017.md))
  - media -`array` attached media blobs . Note that, a pair of `<timestamp, crc>` is used to uniquely identify a message.

- receiveParams - `object`
  - conversation - `string` a `base64` encoded public key, optional
  - app - `number` application id, optional

##### Returns

none

#### up4w.msg.sendText(message)

Send a text message to a specific recipient.

```
const up4w = new UP4WJS(ws)

await up4w.whenReady()
await up4w.contact.siginWithSeed("<a_base64_seed_string>")

up4w.msg.onMessage((message) => {
	console.log("Receive message: ", message)
})

await up4w.contact.addUser({
  pk: <a_base64_encode_publickey>",
  name: 'Lufi'
})

const result = await up4w.sendText({
    "recipient": "<a_base64_encode_address>",
    "app": 1,
    "action": 4096,
    "content": "Explain quantum computing in simple terms",
    "content_type": 13
})
console.log(result)
```

result:

```
{
    "rsp": "msg.text",
    "inc": "be30cc17b88c6c76",
    "ret": {
        "swarm": "<your_swarm_address>",
        "id": "1816980011727310231",
        "timestamp": 1684752850240
    }
}
```

##### Parameters

- swarm - `string` the swarm DHT address in `base16` ,optional
- recipient - `string` stands for the recipient, which is a user's `pubkey` or that of a scenario-specific identity
- app - `number`application_id
- action - `number` operation code
- content - `string` `object` message content
- content_type - `number` content type, text message always be `13`, optional

##### Returns

`Promise` object, resolved with:

- swarm - `string` the swarm DHT address
- id - `string` id of message
- timestamp - `number` Sending time for millisecond

## up4w.swarm

### up4w.swarm.join(node)

Join a swarm and initialize swarm-specific protocols, no return.

```
await up4w.swarm.join(node)
```

##### Parameters

node - `object`

- `address` the 20-byte DHT address of the swarm in base16
- `secret` the 32-byte private swarm secret in base64, optional. If specified, the swarm will be private swarm
- `epoch` the epoch unit in millisecond for the DAGM ([UEP-12](https://github.com/up4w/up4w-core/blob/master/docs/uep_0012.md))
- `ttl` the max TTL in epoch for the DAGM
- `subband` the range of the subband, should be 2^n.
- `media_sizemax` the maximum size of attached media in messages, unspecified or 0 indicates media attachment is not allowed
- `active` inbound message will be pushed as a (`rsp:"msg_received"`) message ([UEP-22](https://github.com/up4w/up4w-core/blob/master/docs/uep_0022.md)) if decryption succeeded
- `value_sizemax` the maximum size of values in DVS ([UEP-20](https://github.com/up4w/up4w-core/blob/master/docs/uep_0020.md))

##### Returns

`Promise` Object , resolved with null `ret`

### up4w.swarm.leave(address)

Leave a swarm

```
await up4w.swarm.leave(address)
```

##### Parameters

- `address` the 20-byte DHT address of the swarm in base16

##### Returns

`Promise` Object , resolved with null `ret`

## up4w.persistence

Distributed Key-Value Storage

#### up4w.persistence.set(data)

Set a value .

```
const result = await up4w.persistence.set(data)
// output {"rsp":"netkv.set","inc":"43bbe30cc17b88c6","ret":null}
console.log(result)
```

##### Parameters

data- `object`

- `key` the 32-byte datakey in base 64 ([UEP-21](https://github.com/up4w/up4w-core/blob/master/docs/uep_0021.md))
- `slot` the storage slot of the value (0~255)
- `ttl` the TTL in seconds of the value
- `value` the value data in base64
- `secret` the AES secret for value encryption, optional.

##### Returns

`Promise` Object , resolved with null `ret`

#### up4w.persistence.get(data)

Get a value.

```
const result = await up4w.persistence.set(data)
// output {"rsp":"netkv.get","inc":"43bbe30cc17b88c6","ret":null}
console.log(result)
```

##### Parameters

data- `object`

- `key` the 32-byte datakey in base 64([UEP-20](https://github.com/up4w/up4w-core/blob/master/docs/uep_0020.md))
- `slot` the storage slot of the value (0~255)
- `secret` the secret for value encryption, optional.
- `raw` indicate the response to be the raw binary media data, optional and synchronous invocation only

##### Returns

`Promise` object, resolved with vary result:

- if the value is not encrypted, or correct secret is provided, a `base64` encoded string will be return;

- if `raw` is true, the response is just the raw binary data without the json formatted response encapsulation.
