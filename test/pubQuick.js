const Seneca = require('seneca')
const MqttTransport = require('../dist/MqttTransport')

//Public host - don't send sensitive data
const testHost = 'test.mosquitto.org'

run()

async function run() {
  const seneca = await Seneca({ legacy: false, timeout: 1111 })
    .test('print')
    .use('promisify')
    .use('gateway')
    .use('gateway-lambda')
    .use(MqttTransport, {
      debug: true,
      client: {
        host: testHost,
      },
      topic: {
        'test/quick': {
          qos: 0,
          external: false,
          msg: 'type:mqtt,role:transport,cmd:log',
        },
      },
    })
    .client({ type: 'mqtt' })
    .ready()

  try {
    await seneca.mqttClientReady
  } catch (err) {
    console.error('MQTT client connection error: ', err)
  }

  await seneca.ready()

  let o1 = await seneca.post('type:mqtt,role:transport,cmd:log', {
    topic: 'test/quick',
    json: {
      x: 1,
      y: 6,
    },
  })
  console.log('OUT', o1)
}
