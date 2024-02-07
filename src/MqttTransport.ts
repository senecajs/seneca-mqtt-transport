import { connect, IClientOptions, MqttClient } from 'mqtt'

type Options = {
  debug: boolean
  log: any[]
  client: IClientOptions
  subTopic: string
  pubTopic: string
  qos?: 0 | 1 | 2
}

type Config = {
  type: string
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
  subTopic: '',
  pubTopic: '',
  qos: 0,
}

function MQTTTransport(this: any, options: Options) {
  const seneca: any = this

  const tag = seneca.plugin.tag
  const gtag = null == tag || '-' === tag ? '' : '$' + tag
  const gateway = seneca.export('gateway' + gtag + '/handler')

  // const log = options.debug && (options.log || [])
  // const tu = seneca.export('transport/utils')

  const subTopic = options.subTopic
  // const pubTopic = options.pubTopic
  const client: MqttClient = connect(options.client)

  client.on('connect', function () {
    console.log('Connected to the broker')

    if (subTopic) {
      client.subscribe(subTopic, { qos: 0 }, (err) => {
        if (err) {
          console.error('Subscribe error: ', err)
        }
      })

      client.on('message', (topic, message) => {
        let handler = seneca.export('gateway-lambda/handler')

        const msg = JSON.parse(message.toString())
        const subTopic = topic

        return handler({
          Records: [{ eventSource: 'mqtt', body: { msg, subTopic } }],
        })
      })
    }
  })

  client.on('error', function (err: any) {
    console.error('Connection error: ', err)
  })

  seneca.add('role:transport,hook:listen,type:mqtt', hook_listen_mqtt)
  // seneca.add('role:transport,hook:client,type:mqtt', hook_client_mqtt)

  function hook_listen_mqtt(this: any, config: Config, ready: Function) {
    const seneca = this.root.delegate()

    seneca.act('sys:gateway,kind:lambda,add:hook,hook:handler', {
      handler: {
        name: 'mqtt',
        match: (trigger: { record: any }) => {
          let matched = config.type === trigger.record.eventSource
          console.log('MQTT TYPE MATCHED', matched, trigger)
          return matched
        },
        process: async function (
          this: typeof seneca,
          trigger: { record: any; event: any },
        ) {
          const { msg, subTopic } = trigger.record.body

          const action = {
            role: 'transport',
            cmd: 'sub',
            topic: subTopic,
            ...msg,
          }

          return gateway(action, { ...trigger, gateway$: { local: true } })
        },
      },
    })

    return ready(config)
  }

  // async function hook_client_mqtt(this: any, config: Config, ready: Function) {
  //   const pubTopic = config.pubTopic
  //   const qos = config.qos || 0
  //
  //   async function send_msg(msg: any, reply: any, meta: any) {
  //     const msgstr = JSON.stringify(tu.externalize_msg(seneca, msg, meta))
  //     log &&
  //       log.push({
  //         hook: 'client',
  //         entry: 'send',
  //         pat: meta.pattern,
  //         w: Date.now(),
  //         m: meta.id,
  //       })
  //
  //     let ok = false
  //     let sent = null
  //     let err = null
  //
  //     client.publish(pubTopic, msgstr, { qos }, (e: any) => {
  //       if (e) {
  //         err = e
  //         console.log('MQTT SENT ERROR', e)
  //       }
  //
  //       ok = true
  //       sent = true
  //     })
  //
  //     reply({ ok, sent, msgstr, err })
  //   }
  //
  //   return ready({
  //     config: config,
  //     send: send_msg,
  //   })
  // }

  return {
    exports: {},
  }
}

Object.assign(MQTTTransport, { defaults })
export default MQTTTransport
if ('undefined' !== typeof module) {
  module.exports = MQTTTransport
}
