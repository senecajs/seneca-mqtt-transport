# @seneca/mqtt-transport documentation

The documentation follows the [Diátaxis](https://diataxis.fr) layout.

## Tutorials

| Page | What you learn |
| ---- | -------------- |
| [Getting started](tutorials/getting-started.md) | Connect Seneca to a broker, receive and publish one message. |

## How-to guides

| Page | Task |
| ---- | ---- |
| [Run the tests locally](how-to/run-tests-locally.md) | Start Mosquitto with Docker and run the test suite. |
| [Map topics to messages](how-to/map-topics.md) | Declare inbound and outbound topics, QoS and wildcards. |
| [Connect to a secured broker](how-to/connect-secured-broker.md) | Set the broker URL, credentials and other client options. |
| [Migrate from Seneca 3](how-to/migrate-from-seneca-3.md) | What to change when moving to Seneca 4. |

## Reference

| Page | Contents |
| ---- | -------- |
| [Options](reference/options.md) | Every plugin option, type, default and effect. |
| [Messages](reference/messages.md) | The messages the plugin declares and sends, with replies. |

## Explanation

| Page | Topic |
| ---- | ----- |
| [How the transport works](explanation/how-it-works.md) | Connection lifecycle, topic matching, Seneca 3 and 4 differences, limits. |

## Feature index

| Feature | Kind | Documented in |
| ------- | ---- | ------------- |
| `debug` | option | [Options](reference/options.md#debug) |
| `log` | option | [Options](reference/options.md#log) |
| `connect.brokerUrl` | option | [Options](reference/options.md#connectbrokerurl) |
| `connect.opts` (`username`, `password`, other mqtt.js options) | option | [Options](reference/options.md#connectopts) |
| `topic.<name>.external` | option | [Options](reference/options.md#topic) |
| `topic.<name>.msg` | option | [Options](reference/options.md#topic) |
| `topic.<name>.qos` | option | [Options](reference/options.md#topic) |
| outbound message `<topic.msg>` with `topic`, `json` | action pattern | [Messages](reference/messages.md#outbound-message) |
| inbound message `<topic.msg>` with `topic`, `payload` | sent message | [Messages](reference/messages.md#inbound-message) |
| `topic-not-declared` | error value in reply | [Messages](reference/messages.md#outbound-message) |
| `sys:seneca,cmd:close` / `role:seneca,cmd:close` | close hook | [How the transport works](explanation/how-it-works.md#lifecycle) |
| exports | none (empty object) | [Messages](reference/messages.md#exports) |
| `SENECA_TEST_MQTT_HOST`, `SENECA_TEST_MQTT_PORT` | test env variables | [Run the tests locally](how-to/run-tests-locally.md) |
