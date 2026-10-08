# Getting started

In this tutorial you connect Seneca to a local MQTT broker, receive a message
published by a device, and publish a Seneca message to the broker.

## 1. Install

```sh
npm install seneca @seneca/mqtt-transport mqtt
```

For this tutorial a local broker is enough. From a clone of this repository:

```sh
npm install
npm run build
npm run services:up   # starts Mosquitto on 127.0.0.1:11884
```

## 2. The program

The complete program is [`docs/examples/getting-started.js`](../examples/getting-started.js).
Its core is the plugin configuration:

```js
seneca.use(MqttTransport, {
  connect: { brokerUrl: 'mqtt://127.0.0.1:11884', opts: {} },
  topic: {
    // Inbound: broker messages on sensor/... become Seneca messages.
    'sensor/#': { external: true, qos: 1, msg: 'app:sensor,cmd:reading' },
    // Outbound: posting app:alert,cmd:send publishes to alert/high.
    'alert/high': { external: false, qos: 1, msg: 'app:alert,cmd:send' },
  },
})

seneca.message('app:sensor,cmd:reading', async function (msg) {
  const json = JSON.parse(msg.payload.toString())
  console.log('seneca received', msg.topic, json)
  return { ok: true }
})
```

and the outbound call:

```js
const out = await seneca.post('app:alert,cmd:send', {
  topic: 'alert/high',
  json: { level: 9 },
})
```

## 3. Run it

```sh
node docs/examples/getting-started.js
```

Output with `seneca@4.0.0-rc5`:

```
MqttTransport Connected to the broker
publish result { ok: true, sent: true, json: { level: 9 }, err: null }
device received alert/high {"level":9}
seneca received sensor/kitchen { temp: 21 }
```

## 4. What happened

1. The plugin connected to the broker and printed a connection line.
2. For the outbound topic `alert/high` it declared the message
   `app:alert,cmd:send`. Posting it published `{"level":9}` as JSON to
   `alert/high`, where the device client received it.
3. For the inbound topic `sensor/#` it subscribed on the broker. When the
   device published to `sensor/kitchen`, the plugin posted
   `app:sensor,cmd:reading` with `topic` and the raw `payload` Buffer.
4. `seneca.close()` ended the MQTT connection, so the process exited.

## Next steps

* [Map topics to messages](../how-to/map-topics.md)
* [Connect to a secured broker](../how-to/connect-secured-broker.md)
* [Options reference](../reference/options.md)
