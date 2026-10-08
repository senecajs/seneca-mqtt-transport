# Map topics to messages

Goal: declare which MQTT topics flow into Seneca and which Seneca messages
publish to MQTT.

1. Add one entry per topic under the `topic` option. The key is the MQTT
   topic.

2. For broker to Seneca, set `external: true`. The plugin subscribes to the
   key and posts `msg` for each message received:

   ```js
   topic: {
     'sensor/#': { external: true, qos: 1, msg: 'app:sensor,cmd:reading' },
   }
   ```

   Define the handler yourself. It receives `topic` (string) and `payload`
   (Buffer):

   ```js
   seneca.message('app:sensor,cmd:reading', async function (msg) {
     const data = JSON.parse(msg.payload.toString())
     return { ok: true }
   })
   ```

3. For Seneca to broker, set `external: false` (or leave it out). The plugin
   defines `msg` itself. Post it with `topic` and `json`:

   ```js
   topic: {
     'alert/high': { external: false, msg: 'app:alert,cmd:send' },
   }

   await seneca.post('app:alert,cmd:send', { topic: 'alert/high', json: { level: 9 } })
   ```

   `topic` must be one of the declared outbound topic keys, otherwise the
   reply is `{ ok: false, err: 'topic-not-declared' }`.

4. Set `qos` to 0, 1 or 2 (default 0). It applies to the subscription for
   inbound topics and to each publish for outbound topics.

5. Wildcards: for inbound topics end the key with a two character level
   wildcard such as `/#` or `/+`. The plugin finds the topic entry for an
   incoming message by removing the last two characters of each key and
   checking whether the incoming topic starts with the rest. See
   [How the transport works](../explanation/how-it-works.md#topic-matching)
   for the consequences.
