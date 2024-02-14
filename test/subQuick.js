const Seneca = require('seneca')
const MqttTransport = require('../dist/MqttTransport')
const { connect } = require('mqtt')

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
        'test/quick/sum': {
          qos: 0,
          external: true,
          msg: 'type:mqtt,role:transport,cmd:sum',
        },
        'test/quick/sub': {
          qos: 0,
          external: true,
          msg: 'type:mqtt,role:transport,cmd:sub',
        },
      },
    })
    .message('type:mqtt,role:transport,cmd:sum', async function (msg) {
      const { json } = msg
      if (json?.x && json?.y) {
        const { x, y } = json
        return { result: x + y }
      } else {
        return { error: 'Missing or invalid message data' }
      }
    })
    .message('type:mqtt,role:transport,cmd:sub', async function (msg) {
      const { json } = msg
      if (json?.x && json?.y) {
        const { x, y } = json
        return { result: x - y }
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
    const ext1 = {
      msgStr: JSON.stringify({ x: 5, y: 2 }),
      topic: 'test/quick/sum',
    }

    const ext2 = {
      msgStr: JSON.stringify({ x: 20, y: 6 }),
      topic: 'test/quick/sub',
    }

    const messages = [ext1, ext2]

    messages.forEach((msgObj) => {
      client.publish(msgObj.topic, msgObj.msgStr, (err) => {
        if (err) {
          console.error(err)
        }
        console.log('External Client Published message: ', msgObj.msgStr)
      })
    })
  })

  client.on('error', function (err) {
    console.error('Connection error: ', err)
  })
}
