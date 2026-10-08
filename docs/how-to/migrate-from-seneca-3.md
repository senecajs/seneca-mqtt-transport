# Migrate from Seneca 3

Goal: run an application that uses this plugin on Seneca 4.

1. Install Seneca 4 (currently the prerelease):

   ```sh
   npm install seneca@^4.0.0-rc5
   ```

2. `seneca-promisify` is no longer needed. Promise methods such as
   `seneca.post` and `seneca.message`, which the plugin uses, are built in.
   Keeping `.use('promisify')` is harmless; it does nothing on Seneca 4.

3. Pass plugin options through `use()` or `options.plugin['mqtt-transport']`.
   Top level `options['mqtt-transport']` is not merged into plugin options on
   Seneca 4.

4. Use Node 22 or newer (Seneca 4 requires it).

5. Nothing else changes: topic options, message shapes and replies are the
   same on both versions. Since version 1.3.0 the plugin also ends its MQTT
   connection when Seneca closes, on both Seneca 3 and Seneca 4.
