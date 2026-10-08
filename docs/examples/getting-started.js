// Getting started: bridge Seneca messages and an MQTT broker.
// Needs a broker on 127.0.0.1:11884 (npm run services:up) and npm run build.
const Seneca = require('seneca')
const { connect } = require('mqtt')
const MqttTransport = require('../../dist/MqttTransport')

const BROKER_URL =
  'mqtt://' +
  (process.env.SENECA_TEST_MQTT_HOST || '127.0.0.1') +
  ':' +
  (process.env.SENECA_TEST_MQTT_PORT || '11884')

run()

async function run() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify') // needed on Seneca 3 only, a no-op on Seneca 4
    .use(MqttTransport, {
      connect: { brokerUrl: BROKER_URL, opts: {} },
      topic: {
        // Inbound: broker messages on sensor/... become Seneca messages.
        'sensor/#': { external: true, qos: 1, msg: 'app:sensor,cmd:reading' },
        // Outbound: posting app:alert,cmd:send publishes to alert/high.
        'alert/high': { external: false, qos: 1, msg: 'app:alert,cmd:send' },
      },
    })

  let resolveReading
  const reading = new Promise((r) => (resolveReading = r))

  seneca.message('app:sensor,cmd:reading', async function (msg) {
    const json = JSON.parse(msg.payload.toString())
    console.log('seneca received', msg.topic, json)
    resolveReading()
    return { ok: true }
  })

  await new Promise((resolve) => seneca.ready(resolve))

  // A separate MQTT client plays the part of a device.
  const device = connect(BROKER_URL)
  await new Promise((resolve) => device.on('connect', resolve))
  device.on('message', (topic, payload) =>
    console.log('device received', topic, payload.toString()),
  )
  await device.subscribeAsync('alert/high', { qos: 1 })

  // Wait until the plugin has connected and declared its outbound message.
  while (!seneca.has('app:alert,cmd:send')) {
    await new Promise((r) => setTimeout(r, 50))
  }

  const out = await seneca.post('app:alert,cmd:send', {
    topic: 'alert/high',
    json: { level: 9 },
  })
  console.log('publish result', out)

  // Publish until the plugin subscription is active.
  const timer = setInterval(
    () => device.publish('sensor/kitchen', JSON.stringify({ temp: 21 })),
    100,
  )
  await reading
  clearInterval(timer)

  await device.endAsync()
  await new Promise((resolve) => seneca.close(resolve))
}
