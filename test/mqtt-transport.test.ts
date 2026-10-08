/* Copyright © 2022-2024 Seneca Project Contributors, MIT License. */

import Seneca from 'seneca'
import { connect, MqttClient } from 'mqtt'

import MqttTransportDoc from '../src/MqttTransportDoc'
import MqttTransport from '../src/MqttTransport'

// Broker started by `npm run services:up` (docker-compose.yml) or by the
// CI service container. Override with SENECA_TEST_MQTT_HOST/PORT.
const MQTT_HOST = process.env.SENECA_TEST_MQTT_HOST || '127.0.0.1'
const MQTT_PORT = process.env.SENECA_TEST_MQTT_PORT || '11884'
const BROKER_URL = `mqtt://${MQTT_HOST}:${MQTT_PORT}`

function waitFor(check: () => boolean, ms = 5000): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const iv = setInterval(() => {
      if (check()) {
        clearInterval(iv)
        resolve()
      } else if (ms < Date.now() - start) {
        clearInterval(iv)
        reject(new Error('timeout'))
      }
    }, 20)
  })
}

function ready(seneca: any): Promise<void> {
  return new Promise((resolve) => seneca.ready(resolve))
}

function close(seneca: any): Promise<void> {
  return new Promise((resolve) => seneca.close(resolve))
}

describe('mqtt-transport', () => {
  test('happy', async () => {
    expect(MqttTransportDoc).toBeDefined()
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('entity')
    await ready(seneca)
    await close(seneca)
  })

  test('broker-roundtrip', async () => {
    const id = Date.now() + '-' + Math.random().toString(36).slice(2)
    const seen: any[] = []

    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use(MqttTransport, {
        connect: { brokerUrl: BROKER_URL, opts: {} },
        topic: {
          [`test/${id}/sum/#`]: {
            qos: 1,
            external: true,
            msg: 'type:mqtt,role:transport,cmd:sum',
          },
          [`test/${id}/log`]: {
            qos: 1,
            external: false,
            msg: 'type:mqtt,role:transport,cmd:log',
          },
        },
      })
      .message('type:mqtt,role:transport,cmd:sum', async function (msg: any) {
        const json = JSON.parse(msg.payload.toString())
        seen.push({ topic: msg.topic, sum: json.x + json.y })
        return { ok: true }
      })

    await ready(seneca)

    const received: any[] = []
    const ext: MqttClient = connect(BROKER_URL)
    await new Promise((resolve) => ext.on('connect', resolve))
    ext.on('message', (topic, payload) =>
      received.push({ topic, json: JSON.parse(payload.toString()) }),
    )
    await ext.subscribeAsync(`test/${id}/log`, { qos: 1 })

    // The plugin declares its internal message once connected.
    await waitFor(() => seneca.has('type:mqtt,role:transport,cmd:log'))

    // Seneca -> broker
    const out = await seneca.post('type:mqtt,role:transport,cmd:log', {
      topic: `test/${id}/log`,
      json: { x: 1 },
    })
    expect(out).toMatchObject({ ok: true, sent: true, json: { x: 1 } })
    await waitFor(() => 0 < received.length)
    expect(received[0]).toEqual({ topic: `test/${id}/log`, json: { x: 1 } })

    // Undeclared topic
    const bad = await seneca.post('type:mqtt,role:transport,cmd:log', {
      topic: `test/${id}/nope`,
      json: {},
    })
    expect(bad).toMatchObject({ ok: false, err: 'topic-not-declared' })

    // Broker -> Seneca (retry until the plugin subscription is active)
    const pub = setInterval(
      () => ext.publish(`test/${id}/sum/a`, JSON.stringify({ x: 2, y: 3 })),
      100,
    )
    try {
      await waitFor(() => 0 < seen.length)
    } finally {
      clearInterval(pub)
    }
    expect(seen[0]).toEqual({ topic: `test/${id}/sum/a`, sum: 5 })

    await ext.endAsync()
    await close(seneca)
  })
})
