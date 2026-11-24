# Changes

## 2.0.0 2026-11-21

Version 1.3.0 was never published; its changes are part of this
release. The last published version is 1.2.0.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (1.3.0 had
  `>=3 || >=4.0.0-rc5`). Seneca 3 is no longer supported; Seneca 3 users
  stay on `@seneca/mqtt-transport@1`.
* Node.js 24 or later (`engines.node` `>=24`).
* The unused peer dependencies `seneca-entity`, `@seneca/gateway`,
  `@seneca/gateway-lambda` and `seneca-promisify` are removed. npm
  installed them for every application, including `seneca-entity` 28,
  which Seneca 4 rejects with `plugin_gubu_shape`.
* `connect.opts` accepts every mqtt.js client option, such as
  `clientId`, `keepalive`, `reconnectPeriod` and the TLS settings. Seneca 4
  builds a closed shape from plain option defaults, so 1.3.0 rejected
  every key other than `username` and `password` with
  `invalid_plugin_option` (B13). The defaults are now a function of the
  `valid` builders that Seneca passes in. Other unknown option keys are
  still rejected. The TypeScript type of `connect.opts` is mqtt.js
  `IClientOptions`.
* The plugin stops at load with a clear message when the
  `transport/utils` export lacks `internalize_msg`, as it does when
  `seneca-transport` 8 or older is loaded first. `@seneca/transport` 9
  keeps it.
* The MQTT client is ended when Seneca closes (`sys:seneca,cmd:close`),
  so processes can exit (new in 1.3.0).
* TypeScript: the plugin function is typed `this: Seneca.Instance`, with
  a type-only import of `seneca` (B10). The declaration file now imports
  the `seneca` and `mqtt` types.
* Tests run against a real Mosquitto 2.1 broker: `docker-compose.yml`,
  `npm run services:up` / `services:down`, `SENECA_TEST_MQTT_HOST` /
  `SENECA_TEST_MQTT_PORT`. `npm test` builds before running Jest. The
  broker test also runs with `@seneca/transport` loaded first. New tests
  cover pass-through `connect.opts`, an unknown option and the
  `transport/utils` check; the `happy` test now loads the plugin. The
  tests no longer load `seneca-promisify` (D4) or `seneca-entity`.
* Development dependencies: `seneca` `^4.0.0`, `@seneca/transport`
  `^9.0.0`, `@seneca/doc` `^9.0.0` and `@types/node` `^24.0.0`;
  `seneca-entity`, `seneca-promisify` and the unused `@seneca/maintain`
  are removed.
* `repository.url` uses `git+https`, `publishConfig.access` is
  `public`, and README.md and CHANGES.md are in the package. The local
  publish scripts are removed.
* CI workflow (Mosquitto service container) delivered in `.patches/`.
* Documentation reorganized into `docs/` (Diátaxis), and updated for
  Seneca 4 and Node 24.
