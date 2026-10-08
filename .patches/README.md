# CI patches

These patches change files under `.github/workflows/`, which could not be
pushed from the session that prepared this branch. Apply them with:

```sh
git am .patches/*.patch
```

`0001-ci-build-mosquitto.patch` updates `.github/workflows/build.yml`:

* runs on `push` and `pull_request` for `master` and `main`;
* tests on Node 24.x and 22.x;
* starts `eclipse-mosquitto:2.1-alpine` as a GitHub Actions service
  container on host port 11884 (the same port as `docker-compose.yml`), with
  a `mosquitto_sub` health check.

Service containers cannot mount files or override the container command, and
Mosquitto 2 without a configuration file only listens on the container
loopback interface. The health check runs inside the container, so it passes,
but the runner cannot connect yet. A first step therefore copies
`test/mosquitto/mosquitto.conf` into the container, restarts it, and waits for
port 11884 to accept connections.
