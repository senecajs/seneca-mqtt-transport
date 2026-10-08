# Changes

## 1.3.0

* Support the Seneca 4 prerelease (`seneca@4.0.0-rc5`) and Seneca 4.0.0;
  Seneca 3 remains supported (peer range `>=3 || >=4.0.0-rc5`).
* Behaviour change: the MQTT client is now ended when Seneca closes
  (`sys:seneca,cmd:close` on Seneca 4, `role:seneca,cmd:close` on Seneca 3),
  so processes can exit.
* Tested on Node 24 and 22; `engines.node` raised to `>=18`.
* Tests run against a real Mosquitto 2.1 broker: `docker-compose.yml`,
  `npm run services:up` / `services:down`, `SENECA_TEST_MQTT_HOST` /
  `SENECA_TEST_MQTT_PORT`. `npm test` builds before running Jest.
* CI workflow (Node 24/22, Mosquitto service container) delivered in
  `.patches/`.
* Documentation reorganized into `docs/` (Diátaxis).
