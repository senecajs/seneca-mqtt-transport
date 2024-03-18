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
      console.log('MqttTransport Connected to the broker')

      if (topics) {
        for (let topic in topics) {
          const topicConfig = topics[topic]

          if (topicConfig.external) {
            const qos: QoS = topicConfig.qos || 0

            client.subscribe(topic, { qos }, (err) => {
              if (err) {
                console.error('MqttTransport Subscribe error: ', err)
              }
            })

            externalTopics[topic] = topicConfig
            continue
          }
          seneca.message(topicConfig.msg, handleInternalMsg)
          internalTopics[topic] = topicConfig
        }

        client.on('message', (topic, payload) => {
          const topicConfig = externalTopics[topic]

          if (topicConfig?.msg) {
            handleExternalMsg(topic, payload, topicConfig.msg)
          }
        })
      }
      resolve()
    })

    client.on('error', (err) => {
      console.error('MqttTransport Connection error: ', err)
      reject(err)
    })
  })

  seneca.decorate('mqttClientReady', clientReadyPromise)

  //Handles MSG received from the broker
  async function handleExternalMsg(
    topic: string,
    payload: any,
    act: string | object,
  ) {
    const internalMsg = tu.internalize_msg(seneca, {
      topic,
      payload,
    })

    return seneca.post(act, internalMsg)
  }

  //Handles sending MSG to the broker
  async function handleInternalMsg(msg: any) {
    let ok = false
    let err = null
    let sent = null

    const topic = msg.topic
    const json = msg.json
    const topicConfig = internalTopics[topic]
    if (!topicConfig) {
      err = 'topic-not-declared'
      return {
        ok,
        sent,
        json,
        err,
      }
    }

    try {
      const jsonStr = JSON.stringify(json)
      const qos: QoS = topicConfig.qos || 0

      await client.publishAsync(topic, jsonStr, { qos })

      ok = true
      sent = true
    } catch (error) {
      console.error('MqttTransport Error Sending External MSG: ', error)
      err = error
    }

    return {
      ok,
      sent,
      json,
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
