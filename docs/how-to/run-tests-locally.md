# Run the tests locally

Goal: run the test suite against a real Mosquitto broker.

1. Use Node 24 (Node 22 is also supported) and install dependencies:

   ```sh
   npm install
   ```

2. Start the broker (Docker Compose, project `seneca-mqtt-transport`,
   container `seneca-mqtt-transport-mosquitto`, image
   `eclipse-mosquitto:2.1-alpine`, host port 11884):

   ```sh
   npm run services:up
   ```

   The broker uses [`test/mosquitto/mosquitto.conf`](../../test/mosquitto/mosquitto.conf),
   which allows anonymous clients.

3. Run the tests. `npm test` builds `dist/` and runs Jest with coverage. It
   does not start Docker.

   ```sh
   npm test
   ```

4. To test against another broker, set:

   | Variable | Default |
   | -------- | ------- |
   | `SENECA_TEST_MQTT_HOST` | `127.0.0.1` |
   | `SENECA_TEST_MQTT_PORT` | `11884` |

   ```sh
   SENECA_TEST_MQTT_HOST=10.0.0.5 SENECA_TEST_MQTT_PORT=1883 npm test
   ```

5. To test the unreleased Seneca 4.0.0 build, install it without saving,
   test, and restore:

   ```sh
   npm install --no-save /path/to/seneca-4.0.0.tgz
   npm test
   npm install
   ```

6. Stop the broker and remove its volumes:

   ```sh
   npm run services:down
   ```

In GitHub Actions the same broker runs as a service container; see
[`.patches/README.md`](../../.patches/README.md).
