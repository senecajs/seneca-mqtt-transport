# How the transport works

## Lifecycle

1. When the plugin is defined it calls mqtt.js `connect(brokerUrl, opts)`
   immediately. Seneca does not wait for the connection: `ready()` can fire
   before the broker is reached.
2. On the `connect` event the plugin prints
   `MqttTransport Connected to the broker`, subscribes to every inbound
   topic, and defines the message of every outbound topic. Outbound messages
   therefore exist only after the first connection.
3. On `seneca.close()` the plugin ends the MQTT client and then continues the
   close chain. Seneca 4 closes through `sys:seneca,cmd:close` and Seneca 3
   through `role:seneca,cmd:close`; the plugin registers on the pattern for
   the running version.

## Topic matching

mqtt.js delivers every message to one `message` handler. The plugin picks
the topic configuration by removing the last two characters of each inbound
key (`sensor/#` becomes `sensor`) and checking `topic.startsWith(...)`. The
first match wins. This works for keys ending in `/#` or `/+`. It is a prefix
match, so `sensor/#` also matches `sensors/x`, and keys without a trailing
wildcard lose two real characters.

## Why it is a plugin and not a Seneca transport type

The plugin does not implement `seneca.listen()` or `seneca.client()`. MQTT is
publish and subscribe, without request and reply, so the plugin maps topics
to ordinary Seneca messages instead. Inbound messages are fire and forget:
replies are not published back.

## Seneca 3 and Seneca 4

| Topic | Seneca 3 | Seneca 4 |
| ----- | -------- | -------- |
| `seneca.message` / `seneca.post` | needs `seneca-promisify` | built in |
| `transport/utils` export | core | core |
| Close pattern | `role:seneca,cmd:close` | `sys:seneca,cmd:close` |

## Limits

* Output goes to `console`, not the Seneca logger.
* Payloads are not parsed for inbound messages; outbound payloads are always
  JSON.
