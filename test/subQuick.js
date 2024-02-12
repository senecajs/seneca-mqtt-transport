const Seneca = require('seneca')
const MqttTransport = require('../dist/MqttTransport')
const { connect } = require('mqtt')

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
      subTopic: testSubTopic,
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
    .listen({ type: 'mqtt' })
    .ready()

  try {
    await seneca.mqttClientReady
  } catch (err) {
    console.error('MQTT client connection error: ', err)
  }

  await seneca.ready()

  // Simulating an external mqtt client
  const client = connect({
    host: testHost,
    protocol: 'mqtt',
    port: 1883,
  })

  client.on('connect', function () {
    console.log('External Connected to the broker')
    const messageAction = { x: 5, y: 2 }
    const messageStr = JSON.stringify(messageAction)

    client.publish(testSubTopic, messageStr, (err) => {
      if (err) {
        console.error(err)
      }
      console.log(
        'External Client Published message to the MQTT broker',
        messageStr,
      )
    })
  })

  client.on('error', function (err) {
    console.error('Connection error: ', err)
  })
}
