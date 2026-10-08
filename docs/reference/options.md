# Options

Source: `defaults` in [`src/MqttTransport.ts`](../../src/MqttTransport.ts).

| Option | Type | Default | Effect |
| ------ | ---- | ------- | ------ |
| `debug` | boolean | `false` | Declared but not read by the plugin. |
| `log` | array | `[]` | Declared but not read by the plugin. |
| `connect.brokerUrl` | string | `'mqtt://test.mosquitto.org:1883'` | Broker URL passed to `mqtt.connect()`. |
| `connect.opts` | object | `{ username: undefined, password: undefined }` | Client options passed to `mqtt.connect()`. |
| `topic` | object | `{}` | Map of MQTT topic to topic configuration. |

## debug

Present in the defaults only. Setting it has no effect.

## log

Present in the defaults only. Setting it has no effect.

## connect.brokerUrl

The first argument of mqtt.js `connect()`. Protocols `mqtt`, `mqtts`, `ws`
and `wss` are accepted by mqtt.js.

## connect.opts

The second argument of mqtt.js `connect()`, for example `username`,
`password`, `clientId`, `keepalive`, `reconnectPeriod`, TLS settings.

## topic

Each key is an MQTT topic (or topic filter for inbound topics). Each value:

| Field | Type | Default | Effect |
| ----- | ---- | ------- | ------ |
| `external` | boolean | none (falsy) | `true`: subscribe and post `msg` for each broker message. Otherwise: define `msg`, which publishes to this topic. |
| `msg` | string or object | required | Seneca message pattern. |
| `qos` | `0`, `1` or `2` | `0` | MQTT quality of service for the subscription or the publish. |

If `topic` is empty, the plugin ends the connection right after it is made
and prints `MqttTransport Connection ended - no topics declared`.
