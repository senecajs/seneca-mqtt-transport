# Migrate from Seneca 3

Goal: run an application that uses this plugin on Seneca 4.

1. Install Seneca 4 and version 2 of this plugin. Version 2 supports
   Seneca 4 only; Seneca 3 applications stay on version 1.2.

   ```sh
   npm install seneca@^4 @seneca/mqtt-transport@^2
   ```

2. Use Node.js 24 or later.

3. Remove `.use('promisify')` and the `seneca-promisify` dependency.
   Promise methods such as `seneca.post` and `seneca.message`, which the
   plugin uses, are built into Seneca 4.

4. The plugin no longer declares peer dependencies on `seneca-entity`,
   `@seneca/gateway`, `@seneca/gateway-lambda` and `seneca-promisify`. It
   never used them. Install them yourself only if your application uses
   them, and on Seneca 4 use `@seneca/entity` instead of `seneca-entity`.

5. Pass plugin options through `use()` or `options.plugin['mqtt-transport']`.
   Top level `options['mqtt-transport']` is not merged into plugin options on
   Seneca 4.

6. Seneca 4 checks plugin options. `connect.opts` accepts every mqtt.js
   client option, such as `clientId` or `keepalive`. Other unknown option
   keys are rejected with `invalid_plugin_option`.

7. If the application also needs Seneca's own transports, load
   `@seneca/transport` 9 or later, not `seneca-transport` 8.

Topic options, message shapes and replies are unchanged. The plugin ends its
MQTT connection when Seneca closes.
