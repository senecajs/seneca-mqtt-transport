import { connect, MqttClient } from 'mqtt'

type QoS = 0 | 1 | 2

type TopicConfig = {
  external: boolean
  msg: string
  qos?: QoS
}

type Options = {
  debug: boolean
  log: any[]
  connect: {
    brokerUrl: string
    opts: {
      username?: string
      password?: string
    }
  }
  topic: Record<string, TopicConfig>
}

type Config = {
  type: string
}

export type MqttTransportOptions = Partial<Options>

const defaults: Options = {
  debug: false,
  log: [],
  connect: {
    brokerUrl: '',
    opts: {
      username: undefined,
      password: undefined,
    },
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

  const client: MqttClient = connect(
    options.connect.brokerUrl,
    options.connect.opts,
  )

  const topics = options.topic
  const externalTopics: { [key: string]: TopicConfig } = {}
  const internalTopics: { [key: string]: TopicConfig } = {}

  const clientReadyPromise = new Promise<void>((resolve, reject) => {
    client.on('connect', function () {
      console.log('MQTT Connected to the broker')

      if (topics) {
        for (let topic in topics) {
          const topicConfig = topics[topic]

          if (topicConfig.external) {
            const qos: QoS = topicConfig.qos || 0

            client.subscribe(topic, { qos }, (err) => {
              if (err) {
                console.error('MQTT Subscribe error: ', err)
              }
            })

            externalTopics[topic] = topicConfig
          } else {
            seneca.message(topicConfig.msg, handleInternalMsg)
            internalTopics[topic] = topicConfig
          }
        }

        client.on('message', (topic, buffer) => {
          const topicConfig = externalTopics[topic]

          if (topicConfig && topicConfig.msg) {
            handleExternalMsg(topic, buffer, topicConfig.msg)
          }
        })
      }
      resolve()
    })

    client.on('error', (err) => {
      console.error('MQTT Connection error: ', err)
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
          const { topic, msg } = trigger.record.body
          const body = {
            buffer: msg,
            topic,
          }

          return gateway(body, { ...trigger, gateway$: { local: true } })
        },
      },
    })

    return ready(config)
  }

  async function hook_client_mqtt(this: any, config: Config, ready: Function) {
    async function send_msg(msg: any, reply: any, meta: any) {
      log &&
        log.push({
          hook: 'client',
          entry: 'send',
          pat: meta.pattern,
          w: Date.now(),
          m: meta.id,
        })

      const { ok, sent, json, err } = await handleInternalMsg({
        topic: msg.topic,
        json: msg.json,
      })

      reply({ ok, sent, json, err })
    }

    return ready({
      config: config,
      send: send_msg,
    })
  }

  //Handles MSG received from the broker
  async function handleExternalMsg(
    topic: string,
    externalBuffer: Buffer,
    act: string | object,
  ) {
    const internalMsg = tu.internalize_msg(seneca, {
      buffer: externalBuffer,
      topic,
    })

    return seneca.post(act, internalMsg)
  }

  //Handles sending MSG to the broker
  async function handleInternalMsg(msg: any) {
    let ok = false
    let err = null
    let sent = null

    const topicConfig = internalTopics[msg.topic]

    try {
      if (!topicConfig) {
        err = 'topic-not-declared'
      } else {
        const jsonStr = JSON.stringify(msg.json)
        const qos: QoS = topicConfig.qos || 0

        await client.publishAsync(msg.topic, jsonStr, { qos })

        ok = true
        sent = true
      }
    } catch (error) {
      console.error('MQTT Error Sending External MSG: ', error)
      err = error
    }

    return {
      ok,
      sent,
      json: msg.json,
      err,
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
