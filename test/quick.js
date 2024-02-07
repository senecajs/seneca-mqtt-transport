const Seneca = require('seneca')
const MqttTransport = require('../dist/MqttTransport')
const { connect } = require('mqtt')

const testSubTopic = 'test/quick'
//Public host - don't send sensitive data
const testHost = 'test.mosquitto.org'

async function run() {
  await Seneca({ legacy: false, timeout: 1111 })
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
    .message(
      'role:transport,cmd:subscribed,topic:test/quick',
      async function (msg) {
        if (msg && msg.x && msg.y) {
          return { result: msg.x + msg.y }
        } else {
          return { error: 'Missing or invalid message data' }
        }
      },
    )
    .listen()
    .ready()
}

run()

// Simulating an external mqtt client
const client = connect({
  host: testHost,
  protocol: 'mqtt',
  port: 1883,
})

client.on('connect', function () {
  const messageAction = { x: 5, y: 2 }

  const messageStr = JSON.stringify(messageAction)
  client.publish(testSubTopic, messageStr, (err) => {
    if (err) {
      console.error(err)
    }
    console.log('Published message to the MQTT broker', messageStr)
  })
})

client.on('error', function (err) {
  console.error('Connection error: ', err)
})
