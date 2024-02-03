import { connect, IClientOptions, MqttClient } from 'mqtt'

type Options = {
  debug: boolean
  log: any[]
  client: IClientOptions
}

type Config = {
  subTopic: string
  pubTopic: string
  qos?: 0 | 1 | 2
}

// export type MQTTTransportOptions = Partial<Options>

const defaults: Options = {
  debug: false,
  log: [],
  client: {
    protocol: 'mqtt',
    username: undefined,
    password: undefined,
    host: '',
    port: 1883,
  },
}

function MQTTTransport(this: any, options: Options) {
  const seneca: any = this
  const client: MqttClient = connect(options.client)

  client.on('connect', function () {
    console.log('Connected to the broker')
  })

  client.on('error', function (err: any) {
    console.error('Connection error: ', err)
  })

  seneca.add('role:transport,hook:listen,type:mqtt', hook_listen_mqtt)
  seneca.add('role:transport,hook:client,type:mqtt', hook_client_mqtt)

  function hook_listen_mqtt(this: any, config: Config, ready: Function) {
    const subTopic = config.subTopic
    const qos = config.qos || 0

    client.subscribe(subTopic, { qos }, (err) => {
      if (err) {
        console.error('Subscribe error: ', err)
        return ready({ err })
      }
    })

    client.on('message', (topic, message) => {
      if (subTopic == topic) {
        const msg = JSON.parse(message.toString())
        return ready(msg)
      }
    })
  }

  async function hook_client_mqtt(this: any, config: Config, ready: Function) {
    const pubTopic = config.pubTopic
    const qos = config.qos || 0

    async function pub_msg(msg: any, reply: any) {
      const msgStr = JSON.stringify(msg)

      client.publish(pubTopic, msgStr, { qos }, (err: any) => {
        if (err) {
          console.error('Publish error: ', err)
          reply({ ok: false, err })
        }

        reply({ ok: true, msg })
      })
    }

    return ready({
      config: config,
      pub: pub_msg,
    })
  }

  return {
    exports: {},
  }
}

Object.assign(MQTTTransport, { defaults })
export default MQTTTransport
if ('undefined' !== typeof module) {
  module.exports = MQTTTransport
}
