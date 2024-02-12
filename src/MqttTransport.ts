import { connect, IClientOptions, MqttClient } from 'mqtt'

type QoS = 0 | 1 | 2

type Options = {
  debug: boolean
  log: any[]
  client: IClientOptions
  subTopic: string
  pubTopic: string
  qos?: QoS
}

type Config = {
  type: string
}

export type MqttTransportOptions = Partial<Options>

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
  subTopic: '',
  pubTopic: '',
  qos: 0,
}

function MqttTransport(this: any, options: Options) {
  const seneca: any = this

  const tag = seneca.plugin.tag
  const gtag = null == tag || '-' === tag ? '' : '$' + tag
  const gateway = seneca.export('gateway' + gtag + '/handler')

  const log = options.debug && (options.log || [])

  const subTopic = options.subTopic
  const pubTopic = options.pubTopic
  let qos: QoS = 0
  if (options.qos) {
    qos = options.qos
  }

  const client: MqttClient = connect(options.client)

  const clientReadyPromise = new Promise<void>((resolve, reject) => {
    client.on('connect', function () {
      console.log('Connected to the broker')
      if (subTopic) {
        //todo: allow subscription to multiple topics
        client.subscribe(subTopic, { qos }, (err) => {
          if (err) {
            console.error('Subscribe error: ', err)
          }
        })

        client.on('message', (topic, message) => {
          let handler = seneca.export('gateway-lambda/handler')

          const msg = JSON.parse(message.toString())
          // todo: Handle topic?
          // const subTopic = topic

          return handler({
            Records: [{ eventSource: 'mqtt', body: { msg } }],
          })
        })
      }
      resolve()
    })

    client.on('error', (err) => {
      console.error('Connection error: ', err)
      reject(err)
    })
  })

  seneca.decorate('mqttClientReady', clientReadyPromise)

  seneca.add('role:transport,hook:listen,type:mqtt', hook_listen_mqtt)
  seneca.add('role:transport,hook:client,type:mqtt', hook_client_mqtt)

  function hook_listen_mqtt(this: any, config: Config, ready: Function) {
    const seneca = this.root.delegate()

    seneca.act('sys:gateway,kind:lambda,add:hook,hook:handler', {
      handler: {
        name: 'mqtt',
        // todo: What should be matched?
        match: (trigger: { record: any }) => {
          let matched = config.type === trigger.record.eventSource
          console.log('MQTT TYPE MATCHED', matched, trigger)
          return matched
        },
        process: async function (
          this: typeof seneca,
          trigger: { record: any; event: any },
        ) {
          const { msg } = trigger.record.body

          const action = {
            type: 'mqtt',
            role: 'transport',
            cmd: 'listen',
            data: msg,
          }

          return gateway(action, { ...trigger, gateway$: { local: true } })
        },
      },
    })

    return ready(config)
  }

  async function hook_client_mqtt(this: any, config: Config, ready: Function) {
    async function send_msg(msg: any, reply: any, meta: any) {
      const msgstr = JSON.stringify(msg.data)
      log &&
        log.push({
          hook: 'client',
          entry: 'send',
          pat: meta.pattern,
          w: Date.now(),
          m: meta.id,
        })

      let ok = false
      let sent = null
      let err = null

      if (pubTopic && msgstr) {
        client.publish(pubTopic, msgstr, { qos }, (error: any) => {
          if (error) {
            err = error
            console.error('MQTT SENT ERROR', error)
          }

          ok = true
          sent = true
        })
      } else {
        err = 'missing-pubTopic-or-msgstr'
      }

      reply({ ok, sent, msgstr, err })
    }

    return ready({
      config: config,
      send: send_msg,
    })
  }

  return {
    exports: {},
  }
}

Object.assign(MqttTransport, { defaults })
export default MqttTransport
if ('undefined' !== typeof module) {
  module.exports = MqttTransport
}
