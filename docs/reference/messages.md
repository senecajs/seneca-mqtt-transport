# Messages

The plugin defines no fixed patterns. All patterns come from the `topic`
option ([Options](options.md#topic)).

## Outbound message

Defined by the plugin for each topic with `external` not `true`, once the
client has connected. Pattern: the topic's `msg`.

Parameters:

| Name | Type | Meaning |
| ---- | ---- | ------- |
| `topic` | string | MQTT topic to publish to. Must be a declared outbound topic key. |
| `json` | any | Value to publish, encoded with `JSON.stringify`. |

Reply (always a normal reply, never an action error):

| Field | Value |
| ----- | ----- |
| `ok` | `true` when published, otherwise `false`. |
| `sent` | `true` when published, otherwise `null`. |
| `json` | The `json` parameter. |
| `err` | `null`; `'topic-not-declared'` when `topic` is not a declared outbound topic; or the publish error object. |

The publish uses the topic's `qos` and resolves when mqtt.js has completed
the publish for that QoS.

## Inbound message

Sent by the plugin with `seneca.post` for each broker message on a topic with
`external: true`. Pattern: the topic's `msg`. You define the handler.

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `topic` | string | Topic the message was published to. |
| `payload` | Buffer | Raw message payload. |

The message is marked as remote (`remote$: true`) by Seneca's
`transport/utils` `internalize_msg`. The handler's reply is not sent back to
the broker.

## Exports

The plugin exports an empty object.
