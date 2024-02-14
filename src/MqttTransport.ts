import { connect, IClientOptions, MqttClient } from 'mqtt'

type QoS = 0 | 1 | 2

type TopicConfig = {
  external: boolean
  msg: string
  qos?: QoS
}

type Options = {
  debug: boolean
  log: any[]
  client: IClientOptions
  topic: Record<string, TopicConfig>
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
  topic: {},
}

function MqttTransport(this: any, options: Options) {
  const seneca: any = this

  const tag = seneca.plugin.tag
  const gtag = null == tag || '-' === tag ? '' : '$' + tag
  const gateway = seneca.export('gateway' + gtag + '/handler')

  const log = options.debug && (options.log || [])
  const tu = seneca.export('transport/utils')

  const topics = options.topic

  const client: MqttClient = connect(options.client)

  const clientReadyPromise = new Promise<void>((resolve, reject) => {
    client.on('connect', function () {
      console.log('Connected to the broker')

      if (topics) {
        for (let optTopic in topics) {
          const topicObj = topics[optTopic]
          const qos: QoS = topicObj.qos || 0

          client.subscribe(optTopic, { qos }, (err) => {
            if (err) {
              console.error('Subscribe error: ', err)
            }
          })

          client.on('message', (topic, message) => {
            const isSameTopic = topic === optTopic
            const optMsg = topicObj.msg
            const isExternal = topicObj.external

            const isHandleable = isSameTopic && optMsg && isExternal

            if (isHandleable) {
              return handleExternalMsg(topic, message, optMsg)
            }
          })
        }
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
      // todo: use options.topic
      const { ok, err, sent } = await handleInternalMsg('', msgstr)
      reply({ ok, sent, msgstr, err })
    }

    return ready({
      config: config,
      send: send_msg,
    })
  }

  //Handles MSG received from the broker
  async function handleExternalMsg(
    topic: string,
    msg: Buffer,
    act: string | object,
  ) {
    const externalJson = JSON.parse(msg.toString())
    const interMsg = tu.internalize_msg(seneca, { json: externalJson, topic })
    seneca.post(act, interMsg)
  }

  //Handles sending MSG to the broker
  async function handleInternalMsg(topic: string, msg: any) {
    let ok = false
    let err = null
    let sent = null

    // todo: add externalise utility function
    try {
      await client.publishAsync(topic, msg)
      ok = true
      sent = true
    } catch (err) {
      console.error('Error Sending External MSG: ', err)
    }

    return {
      ok,
      err,
      sent,
    }
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
