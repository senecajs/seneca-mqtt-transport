![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/mqtt-transport

Bridge Seneca messages and an MQTT broker: broker topics become Seneca
messages, and Seneca messages publish to broker topics. Works with Seneca 4
(including the `4.0.0-rc5` prerelease) and Seneca 3, on Node 24 and 22.

[![npm version](https://img.shields.io/npm/v/@seneca/mqtt-transport.svg)](https://npmjs.com/package/@seneca/mqtt-transport)
[![build](https://github.com/senecajs/seneca-mqtt-transport/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-mqtt-transport/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-mqtt-transport/badge.svg)](https://snyk.io/test/github/senecajs/seneca-mqtt-transport)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install seneca @seneca/mqtt-transport
```

## Quick Example

```js
const Seneca = require('seneca')

const seneca = Seneca()
  .use('@seneca/mqtt-transport', {
    connect: { brokerUrl: 'mqtt://127.0.0.1:1883', opts: {} },
    topic: {
      'sensor/#': { external: true, msg: 'app:sensor,cmd:reading' },
      'alert/high': { external: false, msg: 'app:alert,cmd:send' },
    },
  })
  .message('app:sensor,cmd:reading', async function (msg) {
    console.log(msg.topic, JSON.parse(msg.payload.toString()))
    return { ok: true }
  })

// Once connected: publishes {"level":9} to alert/high
// await seneca.post('app:alert,cmd:send', { topic: 'alert/high', json: { level: 9 } })
```

## More Examples

* [Getting started](docs/tutorials/getting-started.md), with a runnable
  [program](docs/examples/getting-started.js)
* [Map topics to messages](docs/how-to/map-topics.md)
* [Connect to a secured broker](docs/how-to/connect-secured-broker.md)
* [Migrate from Seneca 3](docs/how-to/migrate-from-seneca-3.md)

## Motivation

IoT devices speak MQTT, services speak Seneca messages. This plugin maps
topics to message patterns so services can react to devices and notify them
without MQTT code. See [How the transport works](docs/explanation/how-it-works.md).

## Support

* Post a [GitHub issue](https://github.com/senecajs/seneca-mqtt-transport/issues)
* Read the [Seneca documentation](http://senecajs.org)
* Commercial support: [Voxgig](https://www.voxgig.com)

## API

Full index: [docs/README.md](docs/README.md).

| Option | Default | Reference |
| ------ | ------- | --------- |
| `connect.brokerUrl` | `mqtt://test.mosquitto.org:1883` | [Options](docs/reference/options.md#connectbrokerurl) |
| `connect.opts` | `{}` | [Options](docs/reference/options.md#connectopts) |
| `topic` | `{}` | [Options](docs/reference/options.md#topic) |
| `debug`, `log` | unused | [Options](docs/reference/options.md) |

| Message | Reference |
| ------- | --------- |
| Outbound `<topic.msg>` with `topic`, `json` | [Messages](docs/reference/messages.md#outbound-message) |
| Inbound `<topic.msg>` with `topic`, `payload` | [Messages](docs/reference/messages.md#inbound-message) |

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open
participation. Tests need Node 24 (or 22) and a Mosquitto broker from Docker:

```sh
npm install
npm run services:up
npm test
npm run services:down
```

The devDependency is the Seneca 4 prerelease (`seneca@^4.0.0-rc5`). See
[Run the tests locally](docs/how-to/run-tests-locally.md). CI workflow
changes are delivered as patches in [.patches](.patches/README.md).

## Background

Part of the [Senecajs org](https://github.com/senecajs/).

| Plugin | Seneca | Node |
| ------ | ------ | ---- |
| 1.3.x | 3.x, 4.x | 22, 24 (Seneca 4 needs 22+) |
| 1.2.x | 3.x | 14+ |

License: [MIT](LICENSE).
