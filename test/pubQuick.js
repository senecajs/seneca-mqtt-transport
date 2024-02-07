const Seneca = require('seneca')
const MqttTransport = require('../dist/MqttTransport')

const testSubTopic = 'test/quick'
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
      pubTopic: testSubTopic,
    })
    .message('type:mqtt,role:transport,cmd:listen', async function (msg) {
      const { data } = msg
      if (data?.x && data?.y) {
        const { x, y } = data
        return { result: x + y }
      } else {
        return { error: 'Missing or invalid message data' }
      }
    })
    .client({ type: 'mqtt' })
    .ready()

  await seneca.mqttClientReady
  await seneca.ready()

  let o1 = await seneca.post('type:mqtt', {
    data: {
      x: 1,
      y: 6,
    },
  })
  console.log('OUT', o1)
}
