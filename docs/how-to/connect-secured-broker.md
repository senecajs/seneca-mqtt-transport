# Connect to a secured broker

Goal: connect to a broker that needs TLS or credentials.

1. Set `connect.brokerUrl` to the broker URL. Any URL accepted by
   [mqtt.js](https://github.com/mqttjs/MQTT.js) `connect()` works, for
   example `mqtts://broker.example.com:8883` or `wss://broker.example.com/mqtt`.

2. Put credentials and other client options in `connect.opts`. The object is
   passed unchanged as the second argument of `mqtt.connect()`:

   ```js
   seneca.use('@seneca/mqtt-transport', {
     connect: {
       brokerUrl: 'mqtts://broker.example.com:8883',
       opts: {
         username: process.env.MQTT_USER,
         password: process.env.MQTT_PASS,
         clientId: 'seneca-service-1',
       },
     },
     topic: {
       'devices/#': { external: true, msg: 'app:device,cmd:event' },
     },
   })
   ```

3. Always set `brokerUrl`. The default is the public test broker
   `mqtt://test.mosquitto.org:1883`, which anyone can read.

4. Connection errors are printed with `console.error` (prefix
   `MqttTransport Connection error:`). mqtt.js keeps reconnecting with its
   default settings.
